import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';

/**
 * TSVファイルのカラム設定
 */
export type TsvConfig = {
  readonly startTimeColumnIndex: number;
  readonly textColumnIndex: number;
  readonly endTimeColumnIndex?: number;
};

/**
 * ファイルベースのエピソード追加ペイロード
 */
export type FileEpisodeAddPayload = {
  readonly source: 'file';
  readonly title: string;
  readonly audioFilePath: string;
  readonly scriptFilePath: string;
  readonly tsvConfig?: TsvConfig;
};

/**
 * YouTubeベースのエピソード追加ペイロード
 */
export type YoutubeEpisodeAddPayload = {
  readonly source: 'youtube';
  readonly youtubeMetadata: YoutubeMetadata;
  readonly youtubeUrl: string;
};

/**
 * エピソード追加ペイロードのユニオン型
 */
export type EpisodeAddPayload = FileEpisodeAddPayload | YoutubeEpisodeAddPayload;
