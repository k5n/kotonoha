import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';

/**
 * 指定されたIDの対話のソフトデリートを取り消します。
 * @param dialogueId ソフトデリートを取り消す対話のID。
 */
export async function undoSoftDeleteDialogue(dialogueId: number): Promise<void> {
  await dialogueRepository.undoSoftDeleteDialogue(dialogueId);
}
