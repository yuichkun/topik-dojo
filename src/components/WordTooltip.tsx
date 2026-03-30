import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Popover, { Rect } from 'react-native-popover-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWordAudio } from '../hooks/useWordAudio';
import type { Word } from '../database/schema';

interface WordTooltipProps {
  visible: boolean;
  word: Word | null;
  onClose: () => void;
  fromRect: { x: number; y: number; width: number; height: number } | null;
}

export default function WordTooltip({
  visible,
  word,
  onClose,
  fromRect,
}: WordTooltipProps) {
  const router = useRouter();
  const { playWordAudio } = useWordAudio();

  if (!word || !fromRect) return null;

  const getUnitRange = (unitOrder: number) => {
    const unitNumber = Math.ceil(unitOrder / 10);
    const start = (unitNumber - 1) * 10 + 1;
    const end = unitNumber * 10;
    return `${start}-${end}`;
  };

  const handleUnitPress = () => {
    onClose();
    router.push(`/${word.grade}/learning/${word.unitId}?wordId=${word.id}`);
  };

  const handlePlayAudio = () => {
    playWordAudio(word.korean);
  };

  const unitLabel = `${word.grade}級 単語${getUnitRange(word.unitOrder)}`;

  return (
    <Popover
      isVisible={visible}
      from={new Rect(fromRect.x, fromRect.y, fromRect.width, fromRect.height)}
      onRequestClose={onClose}
      animationConfig={{ duration: 200 }}
      popoverStyle={{
        backgroundColor: 'rgba(25,28,29,0.92)',
        borderRadius: 12,
        padding: 0,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
      }}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      arrowSize={{ width: 14, height: 7 }}
    >
      <View style={{ padding: 14, minWidth: 180, maxWidth: 260 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#ffffff',
            }}
          >
            {word.korean}
          </Text>
          <TouchableOpacity
            onPress={handlePlayAudio}
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="play" size={11} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {word.japanese}
        </Text>

        <TouchableOpacity
          onPress={handleUnitPress}
          style={{ alignSelf: 'center' }}
        >
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              textDecorationLine: 'underline',
            }}
          >
            {unitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Popover>
  );
}
