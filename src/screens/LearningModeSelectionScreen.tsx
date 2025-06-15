/**
 * 学習モード選択画面
 * 選択された級に対して、学習・テスト・成績確認のいずれかのモードを選択する画面
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
import { LearningModeSelectionScreenProps } from '../navigation/types';
import { SCREEN_NAMES } from '../constants/screens';

const LearningModeSelectionScreen: React.FC<LearningModeSelectionScreenProps> = ({
  route,
  navigation,
}) => {
  const { level } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  // 戻るボタンのタップハンドラ
  const handleBackPress = () => {
    navigation.goBack();
  };

  // 学習ボタンのタップハンドラ
  const handleLearningPress = () => {
    navigation.navigate(SCREEN_NAMES.UNIT_SELECTION, { level });
  };

  // テストボタンのタップハンドラ
  const handleTestPress = () => {
    // TODO: テストモード選択画面への遷移 (04-test-mode-selection)
    Alert.alert('テストモード', `${level}級のテストモードを選択してください`);
  };

  // 成績ボタンのタップハンドラ
  const handleResultsPress = () => {
    // TODO: 成績確認画面への遷移 (10-results)
    Alert.alert('成績確認', `${level}級の成績を確認します`);
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
        
        <Text className="text-xl font-bold text-gray-800">{level}級</Text>
        
        <View className="w-16" />
      </View>

      {/* メインコンテンツ */}
      <View className="flex-1 justify-center px-8">
        
        {/* 学習ボタン */}
        <TouchableOpacity
          className="bg-blue-50 border-2 border-blue-500 rounded-lg py-6 mb-6 items-center"
          onPress={handleLearningPress}
        >
          <Text className="text-xl font-bold text-blue-600">学習</Text>
          <Text className="text-sm text-blue-500 mt-1">単語カード形式での語彙学習</Text>
        </TouchableOpacity>

        {/* テストボタン */}
        <TouchableOpacity
          className="bg-orange-50 border-2 border-orange-500 rounded-lg py-6 mb-6 items-center"
          onPress={handleTestPress}
        >
          <Text className="text-xl font-bold text-orange-600">テスト</Text>
          <Text className="text-sm text-orange-500 mt-1">リスニング・リーディングテスト</Text>
        </TouchableOpacity>

        {/* 成績ボタン */}
        <TouchableOpacity
          className="bg-green-50 border-2 border-green-500 rounded-lg py-6 mb-6 items-center"
          onPress={handleResultsPress}
        >
          <Text className="text-xl font-bold text-green-600">成績</Text>
          <Text className="text-sm text-green-500 mt-1">テスト結果の確認・グラフ表示</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LearningModeSelectionScreen;