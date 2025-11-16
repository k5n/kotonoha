import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';

let path = $state<readonly EpisodeGroup[]>([]);

export const groupPathStore = {
  // パンくずリストのパス全体
  get path() {
    return path;
  },

  // 現在の選択グループ（パスの末尾）
  get current() {
    return path.length > 0 ? path[path.length - 1] : null;
  },

  // 現在のURLパス
  get url() {
    if (this.current?.groupType === 'album') {
      return `/episode-list/${this.current.id}`;
    }
    return '/' + path.map((g) => g.id).join('/');
  },

  // パスを一括セット
  setPath(newPath: readonly EpisodeGroup[]) {
    path = newPath;
  },

  // パスにグループを追加
  pushGroup(group: EpisodeGroup) {
    path = [...path, group];
  },

  // パンくずで指定indexまで戻る
  // 戻り値は変化したかどうか。変化がなかった場合はfalseを返す。
  popTo(index: number | null): boolean {
    if (index !== null && index === path.length - 1) {
      return false;
    }
    path = index === null ? [] : path.slice(0, index + 1);
    return true;
  },

  // パスをリセット
  reset() {
    path = [];
  },
};
