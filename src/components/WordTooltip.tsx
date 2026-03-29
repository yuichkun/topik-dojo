import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Popover from 'react-native-popover-view';
import { useRouter } from 'expo-router';
import { useWordAudio } from '../hooks/useWordAudio';
import type { Word } from '../database/schema';

interface WordTooltipProps {
  visible: boolean;
  word: Word | null;
  onClose: () => void;
  fromView: React.RefObject<any> | null;
}

export default function WordTooltip({
  visible,
  word,
  onClose,
  fromView,
}: WordTooltipProps) {
  const router = useRouter();
  const { playWordAudio } = useWordAudio();

  if (!word || !fromView) return null;

  const getUnitRange = (unitOrder: number) => {
    const unitNumber = Math.ceil(unitOrder / 10);
    const start = (unitNumber - 1) * 10 + 1;
    const end = unitNumber * 10;
    return `${start}-${end}`;
  };

  const handleUnitPress = () => {
    if (!word) return;
    onClose();
    router.push(`/${word.grade}/learning/${word.unitId}`);
  };

  const handlePlayAudio = () => {
    if (!word) return;
    playWordAudio(word.korean);
  };

  return (
    <Popover
      isVisible={visible}
      from={fromView}
      onRequestClose={onClose}
      animationConfig={{ duration: 200 }}
      popoverStyle={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      arrowSize={{ width: 16, height: 8 }}
    >
      <View className="p-4 min-w-[200px] max-w-[280px]">
        <View className="flex-row items-center justify-center mb-2">
          <Text className="text-xl font-bold text-gray-800 mr-2">
            {word.korean}
          </Text>
          <TouchableOpacity
            onPress={handlePlayAudio}
            className="bg-blue-500 rounded-full p-1.5 active:bg-blue-600"
          >
            <Text className="text-white text-xs">🔊</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-base text-gray-700 text-center">
          {word.japanese}
        </Text>

        <TouchableOpacity
          onPress={handleUnitPress}
          className="bg-gray-100 rounded px-2 py-1 mt-2 active:bg-gray-200"
        >
          <Text className="text-xs text-blue-600 text-center underline">
            {word.grade}級 ユニット{getUnitRange(word.unitOrder)}
          </Text>
        </TouchableOpacity>
      </View>
    </Popover>
  );
}
