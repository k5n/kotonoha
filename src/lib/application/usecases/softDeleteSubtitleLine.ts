import { subtitleLineRepository } from '$lib/infrastructure/repositories/subtitleLineRepository';

/**
 * 指定されたIDの対話をソフトデリートします。
 * @param subtitleLineId ソフトデリートする対話のID。
 */
export async function softDeleteSubtitleLine(subtitleLineId: string): Promise<void> {
  await subtitleLineRepository.softDeleteSubtitleLine(subtitleLineId);
}
