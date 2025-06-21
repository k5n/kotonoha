import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';

let path = $state<EpisodeGroup[]>([]);

export const groupPathStore = {
  // パンくずリストのパス全体
  get path() {
    return path;
  },

  // 現在の選択グループ（パスの末尾）
  get current() {
    return path.length > 0 ? path[path.length - 1] : null;
  },

  // パスを一括セット
  setPath(newPath: EpisodeGroup[]) {
    path = newPath;
  },

  // パスにグループを追加
  pushGroup(group: EpisodeGroup) {
    path = [...path, group];
  },

  // パンくずで指定indexまで戻る
  popTo(index: number | null) {
    path = index === null ? [] : path.slice(0, index + 1);
  },

  // パスをリセット
  reset() {
    path = [];
  },
};
