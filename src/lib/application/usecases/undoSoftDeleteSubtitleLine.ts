import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';

/**
 * 指定されたIDの対話のソフトデリートを取り消します。
 * @param subtitleLineId ソフトデリートを取り消す対話のID。
 */
export async function undoSoftDeleteSubtitleLine(subtitleLineId: number): Promise<void> {
  await dialogueRepository.undoSoftDeleteDialogue(subtitleLineId);
}
