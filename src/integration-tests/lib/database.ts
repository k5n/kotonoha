import Database from '@tauri-apps/plugin-sql';

export const DATABASE_URL = 'dummy';

export async function clearDatabase(): Promise<void> {
  const db = new Database(DATABASE_URL);
  await db.execute('DELETE FROM sentence_cards');
  await db.execute('DELETE FROM dialogues');
  await db.execute('DELETE FROM episodes');
  await db.execute('DELETE FROM episode_groups');
  await db.execute(
    "DELETE FROM sqlite_sequence WHERE name IN ('episode_groups','episodes','dialogues','sentence_cards')"
  );
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}`;
}

export async function insertEpisodeGroup(params: {
  name: string;
  groupType?: 'album' | 'folder';
  displayOrder?: number;
  parentId?: string | null;
}): Promise<string> {
  const { name, groupType = 'album', displayOrder = 1, parentId = null } = params;
  const id = generateId();
  const now = new Date().toISOString();
  const db = new Database(DATABASE_URL);
  await db.execute(
    `INSERT INTO episode_groups (id, parent_group_id, content, display_order, group_type, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, parentId, JSON.stringify({ name }), displayOrder, groupType, now]
  );
  return id;
}

export async function insertEpisode(params: {
  episodeGroupId: string;
  title: string;
  displayOrder?: number;
  mediaPath?: string;
}): Promise<number> {
  const { episodeGroupId, title, displayOrder = 1, mediaPath = `media/${title}.mp3` } = params;
  const now = new Date().toISOString();
  const db = new Database(DATABASE_URL);

  // const id = generateId();
  // await db.execute(
  //   `INSERT INTO episodes (id, episode_group_id, content, updated_at, deleted_at)
  //    VALUES (?, ?, ?, ?, NULL)`,
  //   [
  //     id,
  //     episodeGroupId,
  //     JSON.stringify({
  //       title,
  //       mediaPath: `media/${id}/full.mp3`,
  //       learningLanguage: 'ja',
  //       explanationLanguage: 'en',
  //       displayOrder,
  //     }),
  //     now,
  //   ]
  // );

  await db.execute(
    `INSERT INTO episodes (episode_group_id, display_order, title, media_path, learning_language, explanation_language, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [episodeGroupId, displayOrder, title, mediaPath, 'ja', 'en', now, now]
  );

  const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id');
  return rows[0]?.id ?? 0;
}
