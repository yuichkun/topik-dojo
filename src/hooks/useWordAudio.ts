import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useRef } from 'react';
import type { AudioSource } from 'expo-audio';

// Audio asset mapping for test words (6 files)
// In production, this would be dynamically generated for 12,000 words
const wordAudioAssets: Record<string, AudioSource> = {
  word_1: require('../assets/audio/words/word_1.mp3'),
  word_2: require('../assets/audio/words/word_2.mp3'),
  word_3: require('../assets/audio/words/word_3.mp3'),
  word_4: require('../assets/audio/words/word_4.mp3'),
  word_5: require('../assets/audio/words/word_5.mp3'),
  word_6: require('../assets/audio/words/word_6.mp3'),
};

const exampleAudioAssets: Record<string, AudioSource> = {
  word_1: require('../assets/audio/examples/word_1.mp3'),
  word_2: require('../assets/audio/examples/word_2.mp3'),
  word_3: require('../assets/audio/examples/word_3.mp3'),
  word_4: require('../assets/audio/examples/word_4.mp3'),
  word_5: require('../assets/audio/examples/word_5.mp3'),
  word_6: require('../assets/audio/examples/word_6.mp3'),
};

export function useWordAudio() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const lastSourceRef = useRef<AudioSource>(null);

  const playWordAudio = useCallback(
    (wordId: string) => {
      const asset = wordAudioAssets[wordId];
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
    (wordId: string) => {
      const asset = exampleAudioAssets[wordId];
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
