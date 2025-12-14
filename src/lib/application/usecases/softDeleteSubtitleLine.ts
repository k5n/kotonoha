import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';

/**
 * 指定されたIDの対話をソフトデリートします。
 * @param subtitleLineId ソフトデリートする対話のID。
 */
export async function softDeleteSubtitleLine(subtitleLineId: number): Promise<void> {
  await dialogueRepository.softDeleteDialogue(subtitleLineId);
}
