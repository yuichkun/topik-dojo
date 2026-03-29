import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useRef } from 'react';
import type { AudioSource } from 'expo-audio';
// @ts-ignore - auto-generated JS file
import { wordAudioMap as _wordMap, exampleAudioMap as _exampleMap } from '../assets/audioMappings';

const wordAudioMap = _wordMap as Record<string, AudioSource>;
const exampleAudioMap = _exampleMap as Record<string, AudioSource>;

export function useWordAudio() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const lastSourceRef = useRef<AudioSource>(null);

  const playWordAudio = useCallback(
    (koreanText: string) => {
      const asset = wordAudioMap[koreanText];
      if (!asset) return;

      try {
        lastSourceRef.current = asset;
        player.replace(asset);
        player.play();
      } catch {
        /* empty */
      }
    },
    [player],
  );

  const playExampleAudio = useCallback(
    (koreanText: string) => {
      const asset = exampleAudioMap[koreanText];
      if (!asset) return;

      try {
        lastSourceRef.current = asset;
        player.replace(asset);
        player.play();
      } catch {
        /* empty */
      }
    },
    [player],
  );

  return {
    playWordAudio,
    playExampleAudio,
    isPlaying: status.playing,
  };
}
