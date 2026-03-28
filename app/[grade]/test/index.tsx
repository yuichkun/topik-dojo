import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TestModeSelectionScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const isDarkMode = useColorScheme() === 'dark';

  const gradeNumber = Number(grade) || 1;

  const handleBackPress = () => {
    router.back();
  };

  const handleHomePress = () => {
    router.push('/');
  };

  const handleListeningPress = () => {
    router.push(`/${gradeNumber}/test/units?testType=listening`);
  };

  const handleReadingPress = () => {
    router.push(`/${gradeNumber}/test/units?testType=reading`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity className="px-3 py-2" onPress={handleBackPress}>
          <Text className="text-lg text-gray-600">← 戻る</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-800">
          {gradeNumber}級 テスト
        </Text>

        <TouchableOpacity className="px-3 py-2" onPress={handleHomePress}>
          <Text className="text-lg text-gray-600">ホーム</Text>
        </TouchableOpacity>
      </View>

      {/* テストモード選択 */}
      <View className="flex-1 justify-center px-8">
        <TouchableOpacity
          className="bg-purple-50 border-2 border-purple-500 rounded-lg py-8 mb-6 items-center"
          onPress={handleListeningPress}
        >
          <Text className="text-2xl mb-2">🎧</Text>
          <Text className="text-xl font-bold text-purple-600">リスニング</Text>
          <Text className="text-sm text-purple-500 mt-2 text-center px-4">
            音声を聞いて日本語訳を4択から選択
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-teal-50 border-2 border-teal-500 rounded-lg py-8 items-center"
          onPress={handleReadingPress}
        >
          <Text className="text-2xl mb-2">📖</Text>
          <Text className="text-xl font-bold text-teal-600">リーディング</Text>
          <Text className="text-sm text-teal-500 mt-2 text-center px-4">
            ハングル文字を見て日本語訳を4択から選択
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
