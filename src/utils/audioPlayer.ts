import SoundPlayer from 'react-native-sound-player';
import { wordAudioMap, exampleAudioMap } from '../assets/audioMappings';

export type AudioType = 'word' | 'example';

/**
 * Play audio file for a Korean word or example
 * Uses pre-mapped audio files to work around Metro bundler's static require limitation
 *
 * @param koreanText The Korean text (word or sentence)
 * @param type 'word' or 'example' to specify which type of audio
 */
export async function playAudio(
  koreanText: string,
  type: AudioType,
): Promise<void> {
  try {
    const audioMap: Record<string, number> =
      type === 'word' ? wordAudioMap : exampleAudioMap;
    const audioAsset = audioMap[koreanText];

    if (!audioAsset) {
      console.warn(`Audio not found for "${koreanText}" (type: ${type})`);
      throw new Error(`Audio file not found for: ${koreanText}`);
    }

    SoundPlayer.playAsset(audioAsset);
  } catch (error) {
    console.error(`Error playing audio for "${koreanText}":`, error);
    throw error;
  }
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  try {
    SoundPlayer.stop();
  } catch (error) {
    console.error('Error stopping audio:', error);
  }
}
