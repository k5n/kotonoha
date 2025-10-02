let geminiApiKey = $state<string | null>(null);
let youtubeApiKey = $state<string | null>(null);

// NOTE: StrongholdからのAPIキーの読み込みは幾らか時間がかかる（セキュリティ的にわざとそうなっている）。
// 数百ミリ秒程度で済むとは思うが、LLM呼び出しのたびに読み出すのは非効率だしUX的にも良くない。
// そのためAPIキーはストアに保持しておく。
export const apiKeyStore = {
  gemini: {
    get value() {
      return geminiApiKey;
    },

    set(value: string) {
      geminiApiKey = value;
    },

    reset() {
      geminiApiKey = null;
    },
  },
  youtube: {
    get value() {
      return youtubeApiKey;
    },

    set(value: string) {
      youtubeApiKey = value;
    },

    reset() {
      youtubeApiKey = null;
    },
  },
};
