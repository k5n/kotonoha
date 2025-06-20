import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';

// 初期画面表示時に必要なデータをまとめて取得するユースケース
export async function initializeApp(): Promise<EpisodeGroup[]> {
  // TODO: Implement actual data fetching logic here
  const stubGroups: EpisodeGroup[] = [
    { id: 1, name: 'Default', displayOrder: 1, parentId: null, children: [], groupType: 'album' },
    {
      id: 2,
      name: 'アニメシリーズ',
      displayOrder: 2,
      parentId: null,
      groupType: 'folder',
      children: [
        {
          id: 4,
          name: 'シーズン1',
          displayOrder: 1,
          parentId: 2,
          children: [],
          groupType: 'album',
        },
        {
          id: 5,
          name: 'シーズン2',
          displayOrder: 2,
          parentId: 2,
          children: [],
          groupType: 'album',
        },
      ],
    },
    { id: 3, name: '映画', displayOrder: 3, parentId: null, children: [], groupType: 'folder' },
  ];
  return stubGroups;
}
