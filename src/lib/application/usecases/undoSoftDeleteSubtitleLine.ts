import { subtitleLineRepository } from '$lib/infrastructure/repositories/subtitleLineRepository';

/**
 * 指定されたIDの対話のソフトデリートを取り消します。
 * @param subtitleLineId ソフトデリートを取り消す対話のID。
 */
export async function undoSoftDeleteSubtitleLine(subtitleLineId: string): Promise<void> {
  await subtitleLineRepository.undoSoftDeleteSubtitleLine(subtitleLineId);
}
