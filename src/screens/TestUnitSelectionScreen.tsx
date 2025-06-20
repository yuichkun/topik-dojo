/**
 * テスト ユニット選択画面
 * 選択された級のテスト（リーディング/リスニング）用ユニットを選択する画面
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SCREEN_NAMES } from '../constants/screens';
import { useUnits } from '../hooks/useUnits';

import { TestUnitSelectionScreenProps } from '../navigation/types';

const TestUnitSelectionScreen: React.FC<TestUnitSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { level, testMode } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  // データベースからユニット一覧を取得
  const { units, loading, error } = useUnits(level);

  // 戻るボタンのハンドラ
  const handleBackPress = () => {
    navigation.goBack();
  };

  // ホームボタンのハンドラ
  const handleHomePress = () => {
    navigation.navigate(SCREEN_NAMES.TOP);
  };

  // ユニット選択のハンドラ
  const handleUnitPress = (unitNumber: number) => {
    if (testMode === 'reading') {
      navigation.navigate(SCREEN_NAMES.READING_TEST, {
        level,
        unitNumber,
      });
    } else if (testMode === 'listening') {
      // TODO: リスニングテスト画面への遷移
      // @ts-expect-error まだスクリーンがないため。できたら、このコメントを消す
      navigation.navigate(SCREEN_NAMES.LISTENING_TEST, {
        level,
        unitNumber,
      });
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator
          size="large"
          color={testMode === 'reading' ? '#14B8A6' : '#8B5CF6'}
          testID="activity-indicator"
        />
        <Text className="mt-4 text-gray-600">
          ユニット情報を読み込んでいます...
        </Text>
      </SafeAreaView>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-4">
        <Text className="text-red-500 text-lg mb-4">エラーが発生しました</Text>
        <Text className="text-gray-600 text-center">{error.message}</Text>
        <TouchableOpacity
          className={`mt-6 px-6 py-3 rounded-lg ${
            testMode === 'reading' ? 'bg-teal-500' : 'bg-purple-500'
          }`}
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-medium">戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        {/* 戻るボタン */}
        <TouchableOpacity className="p-2" onPress={handleBackPress}>
          <Text
            className={`text-base ${
              testMode === 'reading' ? 'text-teal-500' : 'text-purple-500'
            }`}
          >
            ← 戻る
          </Text>
        </TouchableOpacity>

        {/* 級表示 */}
        <Text className="text-lg font-semibold text-gray-800">
          {level}級 {testMode === 'reading' ? 'リーディング' : 'リスニング'}
          テスト
        </Text>

        {/* ホームボタン */}
        <TouchableOpacity className="p-2" onPress={handleHomePress}>
          <Text
            className={`text-base ${
              testMode === 'reading' ? 'text-teal-500' : 'text-purple-500'
            }`}
          >
            ホーム
          </Text>
        </TouchableOpacity>
      </View>

      {/* 説明テキスト */}
      <View
        className={`px-4 py-3 border-b ${
          testMode === 'reading'
            ? 'bg-teal-50 border-teal-100'
            : 'bg-purple-50 border-purple-100'
        }`}
      >
        <Text
          className={`text-sm text-center ${
            testMode === 'reading' ? 'text-teal-700' : 'text-purple-700'
          }`}
        >
          {testMode === 'reading'
            ? '📖 ハングル文字を見て日本語訳を4択から選択してください'
            : '🎧 音声を聞いて日本語訳を4択から選択してください'}
        </Text>
      </View>

      {/* ユニット選択エリア */}
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row flex-wrap justify-between">
          {units.map(unit => (
            <TouchableOpacity
              key={unit.id}
              className={`w-[48%] border-2 rounded-lg py-6 mb-4 items-center shadow-sm ${
                testMode === 'reading'
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-purple-200 bg-purple-50'
              }`}
              onPress={() => handleUnitPress(unit.unitNumber)}
            >
              <Text
                className={`text-base font-medium ${
                  testMode === 'reading' ? 'text-teal-800' : 'text-purple-800'
                }`}
              >
                ユニット {unit.displayName}
              </Text>
              <Text
                className={`text-xs mt-1 ${
                  testMode === 'reading' ? 'text-teal-600' : 'text-purple-600'
                }`}
              >
                10問
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TestUnitSelectionScreen;
