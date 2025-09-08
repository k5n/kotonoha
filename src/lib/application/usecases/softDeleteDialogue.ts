import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';

/**
 * 指定されたIDの対話をソフトデリートします。
 * @param dialogueId ソフトデリートする対話のID。
 */
export async function softDeleteDialogue(dialogueId: number): Promise<void> {
  await dialogueRepository.softDeleteDialogue(dialogueId);
}
