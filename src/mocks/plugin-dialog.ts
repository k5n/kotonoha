// Mock implementation of @tauri-apps/plugin-dialog for browser mode

// グローバルにスクリプトファイルの File オブジェクトを保持
let selectedScriptFile: File | null = null;

export function getSelectedScriptFile(): File | null {
  return selectedScriptFile;
}

export function clearSelectedScriptFile(): void {
  selectedScriptFile = null;
}

interface DialogFilter {
  name: string;
  extensions: string[];
}

interface OpenDialogOptions {
  title?: string;
  directory?: boolean;
  multiple?: boolean;
  filters?: DialogFilter[];
  defaultPath?: string;
}

export async function open(options?: OpenDialogOptions): Promise<string | string[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    if (options?.multiple) {
      input.multiple = true;
    }

    if (options?.directory) {
      input.setAttribute('webkitdirectory', '');
    }

    if (options?.filters && options.filters.length > 0) {
      // 拡張子を .ext 形式に変換
      const accept = options.filters
        .flatMap((filter) => filter.extensions.map((ext) => `.${ext}`))
        .join(',');
      input.accept = accept;
    }

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }

      // スクリプトファイル（テキストファイル）の場合のみ File オブジェクトを保存
      // 音声ファイルは保存しない（使用されないため）
      if (isScriptFile(files[0])) {
        selectedScriptFile = files[0];
      } else {
        selectedScriptFile = null;
      }

      if (options?.multiple) {
        resolve(Array.from(files).map((f) => f.name));
      } else {
        // ファイル名を返す（パスは取得できない）
        resolve(files[0].name);
      }

      document.body.removeChild(input);
    };

    input.oncancel = () => {
      resolve(null);
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

// スクリプトファイルかどうかを判定
function isScriptFile(file: File): boolean {
  const scriptExtensions = ['.srt', '.vtt', '.sswt', '.tsv', '.txt'];
  return scriptExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
}
