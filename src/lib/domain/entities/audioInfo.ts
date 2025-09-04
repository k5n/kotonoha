export type AudioInfo = {
  duration: number; // 再生時間（ミリ秒）
  peaks: number[]; // 波形データのピーク値(0.0-1.0)の配列
};
