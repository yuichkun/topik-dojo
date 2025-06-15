/**
 * ユニット選択画面
 * 選択された級の学習用ユニットを選択する画面
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
import { UnitSelectionScreenProps } from '../navigation/types';
import { SCREEN_NAMES } from '../constants/screens';
import { useUnits } from '../hooks/useUnits';

const UnitSelectionScreen: React.FC<UnitSelectionScreenProps> = ({ navigation, route }) => {
  const { level } = route.params;
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
    // TODO: 学習画面への遷移
    console.log(`Selected unit: ${unitNumber} for level ${level}`);
    // navigation.navigate('Learning', { level, unit: unitNumber });
  };

  // ローディング中の表示
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" testID="activity-indicator" />
        <Text className="mt-4 text-gray-600">ユニット情報を読み込んでいます...</Text>
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
          className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
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
        <TouchableOpacity
          className="p-2"
          onPress={handleBackPress}
        >
          <Text className="text-blue-500 text-base">← 戻る</Text>
        </TouchableOpacity>
        
        {/* 級表示 */}
        <Text className="text-lg font-semibold text-gray-800">
          {level}級 学習
        </Text>
        
        {/* ホームボタン */}
        <TouchableOpacity
          className="p-2"
          onPress={handleHomePress}
        >
          <Text className="text-blue-500 text-base">ホーム</Text>
        </TouchableOpacity>
      </View>

      {/* ユニット選択エリア */}
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row flex-wrap justify-between">
          {units.map((unit) => (
            <TouchableOpacity
              key={unit.id}
              className="w-[48%] border border-gray-300 rounded-lg py-6 mb-4 items-center bg-white shadow-sm"
              onPress={() => handleUnitPress(unit.unitNumber)}
            >
              <Text className="text-base font-medium text-gray-800">
                {unit.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UnitSelectionScreen;