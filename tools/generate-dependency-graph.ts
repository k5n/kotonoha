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

  const config = configFile.config;

  // Handle 'extends' property specifically for SvelteKit's tsconfig.json
  if (config.extends && typeof config.extends === 'string') {
    const extendsPath = path.resolve(path.dirname(configPath), config.extends);
    try {
      const extendsConfigFile = ts.readConfigFile(extendsPath, ts.sys.readFile);
      if (!extendsConfigFile.error) {
        // Merge compilerOptions from extended config.
        // For simplicity, we'll just take the paths from the extended config if available
        // or merge them if both have paths.
        if (extendsConfigFile.config.compilerOptions?.paths) {
          config.compilerOptions = {
            ...extendsConfigFile.config.compilerOptions,
            ...config.compilerOptions,
          };
        }
      } else {
        console.warn(
          `Warning: Could not read extended tsconfig file '${extendsPath}': ${extendsConfigFile.error.messageText}. Proceeding without it.`
        );
      }
    } catch (e) {
      console.warn(
        `Warning: Failed to process extends path '${extendsPath}'. Proceeding without it.`,
        e
      );
    }
  }

  const parsedConfig = ts.parseJsonConfigFileContent(config, ts.sys, projectRoot);
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

// --- Layer Definition ---
const PRESENTATION_LAYER_ROOTS = ['src/routes', 'src/lib/presentation'];
const USECASE_ROOT = 'src/lib/application/usecases';
const STORE_ROOT = 'src/lib/application/stores';

// Files that should be hidden from the Presentation layer dependency graphs
// (kept small so only intentionally noisy dependencies are suppressed)
const EXCLUDED_PRESENTATION_GRAPH_FILES = new Set<string>([
  'src/lib/application/stores/i18n.svelte.ts',
]);

// Helper to generate a valid Mermaid node ID
const getNodeMermaidId = (filePath: string) => {
  return filePath.replace(/[^a-zA-Z0-9_]/g, '_');
};

// Helper to generate a unique subgraph ID
const getSubgraphId = (posixPath: string) => `sg_${getNodeMermaidId(posixPath)}`;

// Helper to escape labels for Mermaid
const escapeLabel = (label: string) => label.replace(/"/g, '\\"');

/**
 * Generates a generic Mermaid markdown block for a given set of file nodes.
 * @param title The title for the graph section.
 * @param description The description for the graph section.
 * @param fullGraph The complete dependency graph of the project.
 * @param allAbsoluteFiles All absolute file paths in the project used to build the file tree.
 * @param nodesForGraph The specific set of normalized file paths to include in this graph.
 * @returns A string containing the Mermaid markdown block.
 */
function generateMermaidBlock(
  title: string,
  description: string,
  fullGraph: DependencyGraph,
  allAbsoluteFiles: string[],
  nodesForGraph: Set<string>
): string {
  const filesForThisGraph = allAbsoluteFiles.filter((file) =>
    nodesForGraph.has(normalizePath(file))
  );

  // Build file tree for Mermaid subgraphs
  const fileTree: FileNode = {};
  filesForThisGraph.forEach((file) => {
    const relativePath = path.relative(srcDir, file);
    const parts = relativePath.split(path.sep);
    let currentLevel: FileNode = fileTree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        if (!currentLevel.files) currentLevel.files = [];
        currentLevel.files.push(file);
      } else {
        if (!currentLevel[part]) currentLevel[part] = {};
        currentLevel = currentLevel[part] as FileNode;
      }
    }
  });

  sortFileTree(fileTree);

  let mermaidGraph = 'graph LR\n';

  // Recursively generate subgraphs
  const generateSubgraphs = (level: FileNode, currentPath: string, indent: string): string => {
    let subgraphContent = '';
    for (const key of Object.keys(level).sort()) {
      if (key === 'files') {
        if (level.files) {
          level.files.forEach((file: string) => {
            const fileName = path.basename(file);
            const mermaidId = getNodeMermaidId(normalizePath(file));
            subgraphContent += `${indent}    ${mermaidId}["${fileName}"]\n`;
          });
        }
      } else {
        const subPath = path.posix.join(currentPath, key);
        const nextLevel = level[key];
        if (typeof nextLevel === 'object' && nextLevel !== null && !Array.isArray(nextLevel)) {
          const innerContent = generateSubgraphs(nextLevel as FileNode, subPath, indent + '    ');
          if (innerContent) {
            const subgraphId = getSubgraphId(subPath);
            const subgraphLabel = escapeLabel(key);
            subgraphContent += `${indent}    subgraph ${subgraphId} ["${subgraphLabel}"]\n`;
            subgraphContent += innerContent;
            subgraphContent += `${indent}    end\n`;
          }
        }
      }
    }
    return subgraphContent;
  };

  mermaidGraph += generateSubgraphs(fileTree, '', '    ');

  // Add dependency edges
  for (const sourceFile of nodesForGraph) {
    const sourceMermaidId = getNodeMermaidId(sourceFile);
    const targets = fullGraph[sourceFile];
    if (targets) {
      const sortedTargets = Array.from(targets).sort();
      for (const targetFile of sortedTargets) {
        if (nodesForGraph.has(targetFile)) {
          const targetMermaidId = getNodeMermaidId(targetFile);
          mermaidGraph += `    ${sourceMermaidId} --> ${targetMermaidId}\n`;
        }
      }
    }
  }

  return `### ${title}\n\n${description}\n\n\`\`\`mermaid\n${mermaidGraph}\`\`\`\n`;
}

/**
 * Recursively collects all unique dependencies for a given starting file.
 * @param startFile The normalized path of the file to start from.
 * @param fullGraph The complete dependency graph.
 * @param allPresentationFiles A set of all files belonging to the presentation layer.
 * @returns A set of normalized file paths that are dependencies of the start file.
 */
function collectDependenciesRecursively(
  startFile: string,
  fullGraph: DependencyGraph,
  allPresentationFiles: Set<string>,
  excluded: Set<string> = new Set<string>()
): Set<string> {
  const collected = new Set<string>();
  const queue: string[] = [startFile];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentFile = queue.shift()!;
    if (visited.has(currentFile)) {
      continue;
    }
    visited.add(currentFile);
    if (excluded.has(currentFile)) {
      continue;
    }

    collected.add(currentFile);

    const dependencies = fullGraph[currentFile];
    if (dependencies) {
      for (const dep of dependencies) {
        // Only trace dependencies within the presentation layer or store layer
        if (!excluded.has(dep) && (allPresentationFiles.has(dep) || dep.startsWith(STORE_ROOT))) {
          queue.push(dep);
        }
      }
    }
  }
  return collected;
}

/**
 * Generates separate Mermaid graphs for each screen (+page.svelte) in the Presentation layer.
 */
async function generateScreenDependencyGraphs(
  fullGraph: DependencyGraph,
  allAbsoluteFiles: string[]
): Promise<string> {
  const allNormalizedFiles = allAbsoluteFiles.map(normalizePath);
  const presentationFiles = new Set<string>();
  allNormalizedFiles.forEach((file) => {
    if (PRESENTATION_LAYER_ROOTS.some((root) => file.startsWith(root))) {
      presentationFiles.add(file);
    }
  });

  const screenEntryPoints = await glob('**/+page.svelte', {
    cwd: path.join(srcDir, 'routes'),
    absolute: true,
  });

  let finalContent = '';

  for (const screenFile of screenEntryPoints.sort()) {
    const normalizedScreenFile = normalizePath(screenFile);
    const screenDependencies = collectDependenciesRecursively(
      normalizedScreenFile,
      fullGraph,
      presentationFiles,
      EXCLUDED_PRESENTATION_GRAPH_FILES
    );

    const screenPath =
      path
        .dirname(normalizedScreenFile)
        .replace(/^src\/routes/, '')
        .replace(/\/$/, '') || '/';

    const title = `Screen: ${screenPath}`;
    const description = `Dependencies for the \`${screenPath}\` screen.`;

    finalContent += generateMermaidBlock(
      title,
      description,
      fullGraph,
      allAbsoluteFiles,
      screenDependencies
    );
  }

  return finalContent;
}

/**
 * Generates a separate Mermaid graph for each use case.
 */
function generateUsecaseGraphs(
  fullGraph: DependencyGraph,
  reverseGraph: DependencyGraph,
  allAbsoluteFiles: string[]
): string {
  const allNormalizedFiles = allAbsoluteFiles.map(normalizePath);
  const usecaseFiles = allNormalizedFiles.filter((file) => file.startsWith(USECASE_ROOT));

  let finalContent = '## Application Layer: Use Case Dependencies\n';

  for (const usecaseFile of usecaseFiles.sort()) {
    const nodesForGraph = new Set<string>([usecaseFile]);

    // Add dependencies of the use case
    const deps = fullGraph[usecaseFile];
    if (deps) {
      deps.forEach((dep) => nodesForGraph.add(dep));
    }

    // Add presentation layer files that depend on the use case
    const dependents = reverseGraph[usecaseFile];
    if (dependents) {
      dependents.forEach((dependent) => {
        if (PRESENTATION_LAYER_ROOTS.some((root) => dependent.startsWith(root))) {
          nodesForGraph.add(dependent);
        }
      });
    }

    const usecaseName = path.basename(usecaseFile);
    finalContent += generateMermaidBlock(
      `Use Case: ${usecaseName}`,
      `Shows files that use the \`${usecaseName}\` use case, and the files it depends on.`,
      fullGraph,
      allAbsoluteFiles,
      nodesForGraph
    );
  }

  return finalContent;
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

  // Create reverse dependency graph
  const reverseGraph: DependencyGraph = {};
  for (const sourceFile in graph) {
    for (const targetFile of graph[sourceFile]) {
      if (!reverseGraph[targetFile]) {
        reverseGraph[targetFile] = new Set<string>();
      }
      reverseGraph[targetFile].add(sourceFile);
    }
  }

  // --- Folder-level dependency graph ---
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

  // --- Generate Layer-specific Mermaid Graphs ---
  const presentationMermaidBlock = await generateScreenDependencyGraphs(graph, files);
  const usecaseMermaidBlocks = generateUsecaseGraphs(graph, reverseGraph, files);

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
        const subPath = path.posix.join(currentPath, key);
        const subgraphId = getSubgraphId(subPath);
        const subgraphLabel = escapeLabel(key);
        const nextLevel = level[key];
        if (typeof nextLevel === 'object' && nextLevel !== null && !Array.isArray(nextLevel)) {
          const inner = generateFolderSubgraphs(nextLevel as FileNode, subPath, indent + '    ');
          if (inner) {
            subgraphContent += `${indent}    subgraph ${subgraphId} ["${subgraphLabel}"]\n`;
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
      mermaidFolderGraph += `    ${getNodeMermaidId(srcFolder)} --> ${getNodeMermaidId(
        tgtFolder
      )}\n`;
    }
  }

  const fullMermaidHeader = `# Frontend Dependency Graphs\n\n`;
  const folderMermaidBlock = `# Src Folder-level Dependency Graph\n\nDependency graph showing relationships between directories under \`src/\`.\n\n\`\`\`mermaid\n${mermaidFolderGraph}\`\`\`\n`;

  const fullMermaidContent =
    fullMermaidHeader +
    '# Presentation Layer Dependency Graph\n\n' +
    'Note: `src/lib/application/stores/i18n.svelte.ts` is omitted from presentation graphs to reduce noise.\n\n' +
    presentationMermaidBlock +
    '\n' +
    usecaseMermaidBlocks +
    '\n' +
    folderMermaidBlock;

  fs.writeFileSync(dependencyGraphMd, fullMermaidContent, 'utf-8');
  console.log(`Dependency graph generated at ${dependencyGraphMd}`);
}

generateDependencyGraph().catch(console.error);
