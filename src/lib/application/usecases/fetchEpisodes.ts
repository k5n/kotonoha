import type { Episode } from '$lib/domain/entities/episode';

export async function fetchEpisodes(groupId: number): Promise<Episode[]> {
  // TODO: Implement actual data fetching logic here
  console.log(`Fetching episodes for group ${groupId}...`);
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

  // スタブデータ
  const now = new Date();
  const stubEpisodes: Episode[] = [
    {
      id: 101,
      episodeGroupId: groupId,
      displayOrder: 1,
      title: 'チュートリアルエピソード',
      audioPath: '/audio/101.mp3',
      scriptPath: '/scripts/101.txt',
      createdAt: now,
      updatedAt: now,
      durationSeconds: 300,
    },
    {
      id: 201,
      episodeGroupId: groupId,
      displayOrder: 1,
      title: 'S1-E1: 新たな始まり',
      audioPath: '/audio/201.mp3',
      scriptPath: '/scripts/201.txt',
      createdAt: now,
      updatedAt: now,
      durationSeconds: 400,
    },
    {
      id: 202,
      episodeGroupId: groupId,
      displayOrder: 2,
      title: 'S1-E2: 謎の影',
      audioPath: '/audio/202.mp3',
      scriptPath: '/scripts/202.txt',
      createdAt: now,
      updatedAt: now,
      durationSeconds: 200,
    },
    {
      id: 301,
      episodeGroupId: groupId,
      displayOrder: 1,
      title: 'S2-E1: 再会',
      audioPath: '/audio/301.mp3',
      scriptPath: '/scripts/301.txt',
      createdAt: now,
      updatedAt: now,
      durationSeconds: 600,
    },
  ];

  return stubEpisodes;
}
