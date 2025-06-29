import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Popover from 'react-native-popover-view';
import { Word } from '../database/models';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

interface WordTooltipProps {
  visible: boolean;
  word: Word | null;
  onClose: () => void;
  fromView: React.RefObject<any> | null;
  navigation: NavigationProp<RootStackParamList>;
}

export default function WordTooltip({
  visible,
  word,
  onClose,
  fromView,
  navigation,
}: WordTooltipProps) {
  if (!word || !fromView) return null;

  // Calculate unit range display (e.g., "21-30" for unit 3)
  const getUnitRange = (unitOrder: number) => {
    const unitNumber = Math.ceil(unitOrder / 10);
    const start = (unitNumber - 1) * 10 + 1;
    const end = unitNumber * 10;
    return `${start}-${end}`;
  };

  const getUnitNumber = (unitOrder: number) => {
    return Math.ceil(unitOrder / 10);
  };

  const handleUnitPress = () => {
    if (!word) return;
    onClose();
    // Navigate to the learning screen for this unit
    navigation.navigate('Learning', {
      level: word.grade,
      unitNumber: getUnitNumber(word.unitOrder),
    });
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
        {/* 韓国語単語 */}
        <Text className="text-xl font-bold text-gray-800 text-center">
          {word.korean}
        </Text>

        {/* 日本語訳 */}
        <Text className="text-base text-gray-700 text-center mt-1">
          {word.japanese}
        </Text>

        {/* 級とユニット情報 */}
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