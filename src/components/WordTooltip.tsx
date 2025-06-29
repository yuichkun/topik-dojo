import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Word } from '../database/models';

interface WordTooltipProps {
  visible: boolean;
  word: Word | null;
  onClose: () => void;
}

export default function WordTooltip({ visible, word, onClose }: WordTooltipProps) {
  if (!word) return null;

  // Calculate unit range display (e.g., "21-30" for unit 3)
  const getUnitRange = (unitOrder: number) => {
    const unitNumber = Math.ceil(unitOrder / 10);
    const start = (unitNumber - 1) * 10 + 1;
    const end = unitNumber * 10;
    return `${start}-${end}`;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-lg">
              {/* 韓国語単語 */}
              <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
                {word.korean}
              </Text>
              
              {/* 日本語訳 */}
              <Text className="text-lg text-gray-700 text-center mb-2">
                {word.japanese}
              </Text>
              
              {/* 級とユニット情報 */}
              <View className="bg-gray-100 rounded-lg px-3 py-2 mb-4">
                <Text className="text-sm text-gray-600 text-center">
                  {word.grade}級 ユニット{getUnitRange(word.unitOrder)}
                </Text>
              </View>
              
              {/* 閉じるボタン */}
              <TouchableOpacity
                onPress={onClose}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  閉じる
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}