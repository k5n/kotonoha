import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

/**
 * 指定されたパスのオーディオを再生するユースケース
 * @param path - 再生するオーディオファイルのフルパス。
 */
export async function playAudio(path: string): Promise<void> {
  await audioRepository.play(path);
}
