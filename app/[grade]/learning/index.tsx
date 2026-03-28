import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';

type ModeOption = {
  label: string;
  description: string;
  route: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  descColor: string;
};

export default function LearningModeSelectionScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const isDarkMode = useColorScheme() === 'dark';

  const gradeDisplay = grade ?? '1';

  const modes: ModeOption[] = [
    {
      label: '学習',
      description: '単語カード形式での語彙学習',
      route: `/${gradeDisplay}/learning/units`,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
      descColor: 'text-blue-500',
    },
    {
      label: 'テスト',
      description: 'リスニング・リーディングテスト',
      route: `/${gradeDisplay}/test`,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-600',
      descColor: 'text-orange-500',
    },
    {
      label: '成績',
      description: 'テスト結果の確認・グラフ表示',
      route: `/${gradeDisplay}/results`,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-600',
      descColor: 'text-green-500',
    },
  ];

  const handleModePress = (route: string) => {
    router.push(route as Href);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity className="px-3 py-2" onPress={handleBackPress}>
          <Text className="text-lg text-gray-600">← 戻る</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-800">
          {gradeDisplay}級
        </Text>

        <View className="w-16" />
      </View>

      <View className="flex-1 justify-center px-8">
        {modes.map(mode => (
          <TouchableOpacity
            key={mode.label}
            className={`${mode.bgColor} border-2 ${mode.borderColor} rounded-lg py-6 mb-6 items-center`}
            onPress={() => handleModePress(mode.route)}
          >
            <Text className={`text-xl font-bold ${mode.textColor}`}>
              {mode.label}
            </Text>
            <Text className={`text-sm ${mode.descColor} mt-1`}>
              {mode.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
