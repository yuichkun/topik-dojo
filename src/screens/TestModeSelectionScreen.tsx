/**
 * テストモード選択画面
 * 選択された級に対して、リスニングテストかリーディングテストかを選択する画面
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Alert,
} from 'react-native';
import type { TestModeSelectionScreenProps } from '../navigation/types';
import { SCREEN_NAMES } from '../constants/screens';

const TestModeSelectionScreen: React.FC<TestModeSelectionScreenProps> = ({
  route,
  navigation,
}) => {
  const { level } = route.params || { level: 1 };
  const isDarkMode = useColorScheme() === 'dark';

  // 戻るボタンのタップハンドラ
  const handleBackPress = () => {
    navigation.goBack();
  };

  // ホームボタンのタップハンドラ
  const handleHomePress = () => {
    navigation.navigate(SCREEN_NAMES.TOP);
  };

  // リスニングテストボタンのタップハンドラ
  const handleListeningPress = () => {
    // TODO: リスニングテストユニット選択画面への遷移 (05-listening-unit-selection)
    Alert.alert('リスニングテスト', `${level}級のリスニングテストを開始します`);
    // navigation.navigate(SCREEN_NAMES.LISTENING_UNIT_SELECTION, { level, mode: 'listening' });
  };

  // リーディングテストボタンのタップハンドラ
  const handleReadingPress = () => {
    // TODO: リーディングテストユニット選択画面への遷移 (06-reading-unit-selection)
    Alert.alert('リーディングテスト', `${level}級のリーディングテストを開始します`);
    // navigation.navigate(SCREEN_NAMES.READING_UNIT_SELECTION, { level, mode: 'reading' });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />
      
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity
          className="px-3 py-2"
          onPress={handleBackPress}
        >
          <Text className="text-lg text-gray-600">← 戻る</Text>
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-800">{level}級 テスト</Text>
        
        <TouchableOpacity
          className="px-3 py-2"
          onPress={handleHomePress}
        >
          <Text className="text-lg text-gray-600">ホーム</Text>
        </TouchableOpacity>
      </View>

      {/* メインコンテンツ */}
      <View className="flex-1 justify-center px-8">
        
        {/* リスニングテストボタン */}
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

        {/* リーディングテストボタン */}
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
};

export default TestModeSelectionScreen;