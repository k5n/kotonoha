import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const docDir = path.join(projectRoot, 'doc');
const dependencyGraphMd = path.join(docDir, 'dependency-graph.md');

// --- Configuration: folders to include in folder-level dependency graph ---
// These should be project-relative POSIX-style paths (no leading './')
const TARGET_FOLDERS = [
  'src/routes',
  'src/lib/presentation/actions',
  'src/lib/presentation/components',
  'src/lib/presentation/types',
  'src/lib/presentation/utils',
  'src/lib/application/locales',
  'src/lib/application/stores',
  'src/lib/application/usecases',
  'src/lib/domain/entities',
  'src/lib/domain/services',
  'src/lib/infrastructure/repositories',
].map((p) => p.replace(/\\/g, '/'));

function toPosix(p: string) {
  return p.replace(/\\\\/g, '/');
}

// Given a normalized project-relative path (posix), return the owning target folder
// from TARGET_FOLDERS using longest-prefix match. Returns null if none match.
function getOwningTargetFolder(projectRelativePosixPath: string): string | null {
  // Try longest match first
  let bestMatch: string | null = null;
  for (const candidate of TARGET_FOLDERS) {
    const c = toPosix(candidate);
    // Match only if path equals candidate or starts with candidate + '/'
    if (projectRelativePosixPath === c || projectRelativePosixPath.startsWith(c + '/')) {
      if (!bestMatch || c.length > bestMatch.length) {
        bestMatch = c;
      }
    }
  }
  return bestMatch;
}

interface DependencyGraph {
  [sourcePath: string]: Set<string>;
}

interface TsConfigPaths {
  [key: string]: string[];
}

function readTsConfig(configPath: string): TsConfigPaths | undefined {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    console.error('Error reading tsconfig.json:', configFile.error.messageText);
    return undefined;
  }
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);
  return parsedConfig.options.paths;
}

const tsConfigPaths = readTsConfig(path.join(projectRoot, 'tsconfig.json'));

function resolveAliasPath(modulePath: string, basePath: string): string {
  if (!tsConfigPaths) {
    return modulePath;
  }

  for (const alias in tsConfigPaths) {
    const aliasPattern = alias.replace('*', '(.*)');
    const match = modulePath.match(new RegExp(`^${aliasPattern}$`));
    if (match) {
      const replacement = tsConfigPaths[alias][0].replace('*', match[1]);
      return path.resolve(projectRoot, replacement);
    }
  }
  return path.resolve(basePath, modulePath);
}

function normalizePath(filePath: string): string {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

// get script content from Svelte files
function getScriptContentFromSvelte(fileContent: string): string {
  const match = fileContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  return match ? match[1] : '';
}

function getDependencies(filePath: string): Set<string> {
  const dependencies = new Set<string>();
  const fileContent = filePath.endsWith('.svelte')
    ? getScriptContentFromSvelte(fs.readFileSync(filePath, 'utf-8'))
    : fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

  ts.forEachChild(sourceFile, (node) => {
    // Only process import/export declarations
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        let importedModulePath = moduleSpecifier.text;

        // Handle SvelteKit's $lib alias
        if (importedModulePath.startsWith('$lib/')) {
          importedModulePath = importedModulePath.replace(
            '$lib/',
            path.join(projectRoot, 'src', 'lib') + path.sep
          );
        } else if (importedModulePath.startsWith('.')) {
          // Resolve relative paths
          importedModulePath = path.resolve(path.dirname(filePath), importedModulePath);
        } else {
          // Try to resolve using tsconfig paths or node_modules (for simplicity, only tsconfig paths for now)
          importedModulePath = resolveAliasPath(importedModulePath, path.dirname(filePath));
        }

        // Try to resolve the import path
        const possibleExtensions = ['.ts', '.svelte.ts', '.svelte'];
        let resolvedPath = '';

        // If the import already has an extension, check as-is, then try other extensions if not found
        if (/\.(ts|svelte|svelte\.ts)$/.test(importedModulePath)) {
          // Try the path as-is
          if (fs.existsSync(importedModulePath)) {
            resolvedPath = importedModulePath;
          } else {
            // Try replacing the extension with each possible extension
            const base = importedModulePath.replace(/\.(ts|svelte|svelte\.ts)$/, '');
            for (const ext of possibleExtensions) {
              if (fs.existsSync(base + ext)) {
                resolvedPath = base + ext;
                break;
              }
              if (fs.existsSync(path.join(base, 'index' + ext))) {
                resolvedPath = path.join(base, 'index' + ext);
                break;
              }
            }
          }
          // Also check for directory import with index file
          for (const ext of possibleExtensions) {
            if (fs.existsSync(path.join(importedModulePath, 'index' + ext))) {
              resolvedPath = path.join(importedModulePath, 'index' + ext);
              break;
            }
          }
        } else {
          // Try each possible extension
          for (const ext of possibleExtensions) {
            if (fs.existsSync(importedModulePath + ext)) {
              resolvedPath = importedModulePath + ext;
              break;
            }
            if (fs.existsSync(path.join(importedModulePath, 'index' + ext))) {
              resolvedPath = path.join(importedModulePath, 'index' + ext);
              break;
            }
          }
        }

        if (resolvedPath) {
          // Add the resolved dependency (relative to project root)
          dependencies.add(normalizePath(resolvedPath));
        } else {
          // If not resolved, it might be a node_module or a non-existent path.
          // For this tool, we only care about internal project dependencies.
          console.warn(`Could not resolve import: ${moduleSpecifier.text} in ${filePath}`);
        }
      }
    }
  });
  return dependencies;
}

// Group files by their directory structure
interface FileNode {
  files?: string[];
  [key: string]: FileNode | string[] | undefined;
}

// Sort: Alphabetically sort the 'files' array in each directory
function sortFileTree(level: FileNode) {
  if (level.files) {
    level.files.sort((a, b) => a.localeCompare(b));
  }
  for (const key of Object.keys(level)) {
    if (
      key !== 'files' &&
      typeof level[key] === 'object' &&
      level[key] !== null &&
      !Array.isArray(level[key])
    ) {
      sortFileTree(level[key] as FileNode);
    }
  }
}

async function generateDependencyGraph() {
  // Exclude .test.ts files using glob ignore option
  let files = await glob('**/*.{ts,svelte.ts,svelte}', {
    cwd: srcDir,
    absolute: true,
    ignore: ['**/*.test.ts', '**/mocks/**', '**/testing/**', '**/integration-tests/**'],
  });
  // Additional filter for safety
  files = files.filter((file) => !file.endsWith('.test.ts'));
  const graph: DependencyGraph = {};

  for (const file of files) {
    const normalizedFilePath = normalizePath(file);
    graph[normalizedFilePath] = getDependencies(file);
  }

  // --- Folder-level dependency graph ---
  // Build dependencies between each file's immediate parent folder
  interface FolderGraph {
    [folderPath: string]: Set<string>;
  }

  const folderGraph: FolderGraph = {};
  const addFolderEdge = (from: string, to: string) => {
    if (!folderGraph[from]) folderGraph[from] = new Set<string>();
    folderGraph[from].add(to);
  };

  const getParentFolder = (p: string) => {
    // Paths in `graph` are normalized to use forward slashes.
    // Use posix dirname to be consistent across platforms.
    return path.posix.dirname(p);
  };

  // Build folderGraph but map each file's parent folder to an owning TARGET_FOLDER.
  for (const src of Object.keys(graph)) {
    const srcFolder = getParentFolder(src);
    const srcOwning = srcFolder ? getOwningTargetFolder(srcFolder) : null;
    for (const tgt of graph[src]) {
      const tgtFolder = getParentFolder(tgt);
      const tgtOwning = tgtFolder ? getOwningTargetFolder(tgtFolder) : null;
      // Only record inter-folder dependencies where both sides belong to a TARGET_FOLDER
      if (srcOwning && tgtOwning && srcOwning !== tgtOwning) {
        addFolderEdge(srcOwning, tgtOwning);
      }
    }
  }

  // --- Mermaid Graph Generation (file-level) ---
  let mermaidGraph = 'graph LR\n';

  // Helper to generate a valid Mermaid node ID
  const getNodeMermaidId = (filePath: string) => {
    return filePath.replace(/[^a-zA-Z0-9_]/g, '_');
  };

  const fileTree: FileNode = {};
  files.forEach((file) => {
    const relativePath = path.relative(srcDir, file);
    const parts = relativePath.split(path.sep);
    let currentLevel: FileNode = fileTree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // It's a file
        if (!currentLevel.files) {
          currentLevel.files = [];
        }
        currentLevel.files.push(file);
      } else {
        // It's a directory
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part] as FileNode;
      }
    }
  });

  sortFileTree(fileTree);

  // Recursively generate subgraphs
  const generateSubgraphs = (level: FileNode, currentPath: string, indent: string) => {
    let subgraphContent = '';
    // Loop through sorted keys
    for (const key of Object.keys(level).sort()) {
      if (key === 'files') {
        if (level.files) {
          // files are already sorted
          level.files.forEach((file: string) => {
            const fileName = path.basename(file);
            const mermaidId = getNodeMermaidId(normalizePath(file));
            subgraphContent += `${indent}    ${mermaidId}["${fileName}"]\n`;
          });
        }
      } else {
        const subPath = path.join(currentPath, key);
        const subgraphTitle = key; // Use directory name as subgraph title

        const nextLevel = level[key];
        if (typeof nextLevel === 'object' && nextLevel !== null && !Array.isArray(nextLevel)) {
          const innerContent = generateSubgraphs(nextLevel as FileNode, subPath, indent + '    ');
          if (innerContent) {
            subgraphContent += `${indent}    subgraph "${subgraphTitle}"\n`;
            subgraphContent += innerContent;
            subgraphContent += `${indent}    end\n`;
          }
        }
      }
    }
    return subgraphContent;
  };

  mermaidGraph += generateSubgraphs(fileTree, '', '    ');

  // Add dependencies (sorted)
  for (const sourceFile of Object.keys(graph).sort()) {
    const sourceMermaidId = getNodeMermaidId(sourceFile);
    const sortedTargets = Array.from(graph[sourceFile]).sort();
    for (const targetFile of sortedTargets) {
      const targetMermaidId = getNodeMermaidId(targetFile);
      // Ensure both source and target are part of the graph (i.e., within srcDir)
      if (graph[targetFile] || files.map(normalizePath).includes(targetFile)) {
        mermaidGraph += `${sourceMermaidId} --> ${targetMermaidId}\n`;
      }
    }
  }

  // Folder nodes/edges are produced later in a dedicated Mermaid block.

  const fileMermaidBlock = `# Src Dependency Graph\n\n\`src/\` 以下の各ファイルの import 依存関係を解析した結果グラフ。\n\n\`\`\`mermaid\n${mermaidGraph}\`\`\`\n`;

  // --- Mermaid Graph Generation (folder-level) ---
  // Only include target folders that actually appear in the folderGraph
  let mermaidFolderGraph = 'graph LR\n';
  const allFoldersSet = new Set<string>();
  for (const src of Object.keys(folderGraph)) {
    allFoldersSet.add(src);
    for (const t of folderGraph[src]) allFoldersSet.add(t);
  }
  const allFolders = Array.from(allFoldersSet).sort();

  // Build a nested folder tree for involved target folders so we can emit subgraphs
  const folderTree: FileNode = {};
  for (const folder of allFolders) {
    const parts = folder.split('/');
    let current: FileNode = folderTree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        if (!current.files) current.files = [];
        current.files.push(folder);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part] as FileNode;
      }
    }
  }

  sortFileTree(folderTree);

  // Recursively generate subgraphs for folders (mirrors file-level behaviour)
  const generateFolderSubgraphs = (level: FileNode, currentPath: string, indent: string) => {
    let subgraphContent = '';
    for (const key of Object.keys(level).sort()) {
      if (key === 'files') {
        if (level.files) {
          level.files.forEach((folderPath: string) => {
            const folderName = path.posix.basename(folderPath);
            const mermaidId = getNodeMermaidId(folderPath);
            subgraphContent += `${indent}    ${mermaidId}["${folderName}"]\n`;
          });
        }
      } else {
        const nextLevel = level[key];
        if (typeof nextLevel === 'object' && nextLevel !== null && !Array.isArray(nextLevel)) {
          const inner = generateFolderSubgraphs(
            nextLevel as FileNode,
            path.posix.join(currentPath, key),
            indent + '    '
          );
          if (inner) {
            subgraphContent += `${indent}    subgraph "${key}"\n`;
            subgraphContent += inner;
            subgraphContent += `${indent}    end\n`;
          }
        }
      }
    }
    return subgraphContent;
  };

  mermaidFolderGraph += generateFolderSubgraphs(folderTree, '', '    ');

  // Add folder-level edges
  for (const srcFolder of Object.keys(folderGraph).sort()) {
    const targets = Array.from(folderGraph[srcFolder]).sort();
    for (const tgtFolder of targets) {
      mermaidFolderGraph += `    ${getNodeMermaidId(srcFolder)} --> ${getNodeMermaidId(tgtFolder)}\n`;
    }
  }

  const folderMermaidBlock = `# Src Folder-level Dependency Graph\n\n\`src/\` 以下の各ディレクトリ間依存関係を解析した結果グラフ。\n\n\`\`\`mermaid\n${mermaidFolderGraph}\`\`\`\n`;

  const fullMermaidContent = fileMermaidBlock + '\n' + folderMermaidBlock;

  fs.writeFileSync(dependencyGraphMd, fullMermaidContent, 'utf-8');
  console.log(`Dependency graph generated at ${dependencyGraphMd}`);

  // NOTE: Disabled for now as AGENTS.md is getting too large.
  // // --- Generate simplified Markdown list for AGENTS.md ---
  // try {
  //   const simpleList = generateSimpleList(graph);
  //   updateAgentsMd(simpleList);
  // } catch (err) {
  //   console.error('Failed to update AGENTS.md with simplified dependency list:', err);
  // }
}

// // Generate a simple sorted list of dependencies in the format:
// // src/... -> src/...
// function generateSimpleList(graph: DependencyGraph): string {
//   const lines: string[] = [];
//   const sources = Object.keys(graph).sort();
//   for (const src of sources) {
//     const targets = Array.from(graph[src]).sort();
//     for (const tgt of targets) {
//       // Only include targets that are within the graph (i.e., internal)
//       // and avoid self-dependencies
//       if (tgt && tgt !== src) {
//         lines.push(`- ${src} -> ${tgt}`);
//       }
//     }
//   }
//   // Deduplicate (in case multiple entries) while preserving order
//   return Array.from(new Set(lines)).join('\n');
// }

// // Replace content between <!-- DEP_GRAPH_START --> and <!-- DEP_GRAPH_END --> in AGENTS.md
// function updateAgentsMd(simpleList: string) {
//   const agentsPath = path.join(projectRoot, 'src/AGENTS.md');
//   if (!fs.existsSync(agentsPath)) {
//     console.error(`AGENTS.md not found at ${agentsPath}`);
//     return;
//   }

//   const text = fs.readFileSync(agentsPath, 'utf-8');
//   const startMarker = '<!-- DEP_GRAPH_START -->';
//   const endMarker = '<!-- DEP_GRAPH_END -->';

//   const startIdx = text.indexOf(startMarker);
//   const endIdx = text.indexOf(endMarker);

//   if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
//     console.error('DEP_GRAPH markers not found or malformed in AGENTS.md; skipping update.');
//     return;
//   }

//   const before = text.slice(0, startIdx + startMarker.length);
//   const after = text.slice(endIdx);

//   const newContent = `${before}\n\n${simpleList}\n\n${after}`;

//   try {
//     fs.writeFileSync(agentsPath, newContent, 'utf-8');
//     console.log(`AGENTS.md updated with simplified dependency list at markers.`);
//   } catch (err) {
//     console.error('Failed to write AGENTS.md:', err);
//   }
// }

generateDependencyGraph().catch(console.error);
