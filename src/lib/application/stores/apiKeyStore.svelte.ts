let apiKey = $state<string | null>(null);

// NOTE: StrongholdからのAPIキーの読み込みは幾らか時間がかかる（セキュリティ的にわざとそうなっている）。
// 数百ミリ秒程度で済むとは思うが、LLM呼び出しのたびに読み出すのは非効率だしUX的にも良くない。
// そのためAPIキーはストアに保持しておく。
export const apiKeyStore = {
  get value() {
    return apiKey;
  },

  set(value: string) {
    apiKey = value;
  },

  reset() {
    apiKey = null;
  },
};
