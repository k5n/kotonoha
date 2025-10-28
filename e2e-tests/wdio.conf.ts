// cSpell:words Testrunner appimage
import type { Options } from '@wdio/types';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, URL } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Load version from package.json
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// Construct AppImage path dynamically
const appImagePath = path.resolve(
  __dirname,
  '..',
  'src-tauri',
  'target',
  'release',
  'bundle',
  'appimage',
  `kotonoha_${version}_amd64.AppImage`
);

// Verify AppImage exists
if (!fs.existsSync(appImagePath)) {
  console.error(`AppImage not found: ${appImagePath}`);
  console.error(`Expected version: ${version} (from ${packageJsonPath})`);
  console.error('Please build the release AppImage before running E2E tests.');
  process.exit(1);
}

console.log(`Using AppImage: ${appImagePath}`);
console.log(`Version: ${version}`);

// keep track of the `tauri-driver` child process
let tauriDriver: ReturnType<typeof spawn> | undefined;
let exit = false;

export const config: Omit<Options.Testrunner, 'capabilities'> & {
  capabilities: Array<{
    maxInstances?: number;
    'tauri:options': {
      application: string;
    };
  }>;
} = {
  hostname: '127.0.0.1',
  port: 4444,
  specs: ['./specs/**/*.ts'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        // application: '../src-tauri/target/debug/kotonoha',
        application: appImagePath,
      },
    },
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  // ensure the rust project is built since we expect this binary to exist for the webdriver sessions
  onPrepare: () => {
    // Remove the extra `--` if you're not using npm!
    // spawnSync('npm', ['run', 'tauri', 'build', '--', '--debug', '--no-bundle'], {
    //   cwd: path.resolve(__dirname, '..'),
    //   stdio: 'inherit',
    //   shell: true,
    // });
  },

  // ensure we are running `tauri-driver` before the session starts so that we can proxy the webdriver requests
  beforeSession: () => {
    tauriDriver = spawn(path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'), [], {
      stdio: [null, process.stdout, process.stderr],
      env: {
        ...process.env,
        PUBLIC_APP_ENV: 'e2e',
      },
    });

    tauriDriver.on('error', (error) => {
      console.error('tauri-driver error:', error);
      process.exit(1);
    });
    tauriDriver.on('exit', (code) => {
      if (!exit) {
        console.error('tauri-driver exited with code:', code);
        process.exit(1);
      }
    });
  },

  // clean up the `tauri-driver` process we spawned at the start of the session
  // note that afterSession might not run if the session fails to start, so we also run the cleanup on shutdown
  afterSession: () => {
    closeTauriDriver();
  },
};

function closeTauriDriver() {
  exit = true;
  tauriDriver?.kill();
}

function onShutdown(fn: () => void) {
  const cleanup = () => {
    try {
      fn();
    } finally {
      process.exit();
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGHUP', cleanup);
  process.on('SIGBREAK', cleanup);
}

// ensure tauri-driver is closed when our test process exits
onShutdown(() => {
  closeTauriDriver();
});
