/**
 * トップ画面（級選択）
 * 級選択と復習モードの選択を行う画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useReviewCount } from '../hooks/useReviewCount';
import { TopScreenProps } from '../navigation/types';
import { SCREEN_NAMES } from '../constants/screens';
import { seedDatabase } from '../utils/seedDatabase';

const TopScreen: React.FC<TopScreenProps> = ({ navigation }) => {
  const { count: reviewCount } = useReviewCount();
  const isDarkMode = useColorScheme() === 'dark';
  const [isSeeding, setIsSeeding] = useState(false);

  // 復習ボタンのタップハンドラ
  const handleReviewPress = () => {
    if (reviewCount === 0) {
      return; // 復習対象が0件の場合は何もしない
    }

    navigation.navigate(SCREEN_NAMES.REVIEW);
  };

  // 級選択ボタンのタップハンドラ
  const handleLevelPress = (level: number) => {
    navigation.navigate(SCREEN_NAMES.LEARNING_MODE_SELECTION, { level });
  };

  // シードデータ投入ハンドラ
  const handleSeedDatabase = async () => {
    Alert.alert(
      'テストデータ投入',
      'データベースの全データを削除してテストデータを投入します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '実行',
          style: 'destructive',
          onPress: async () => {
            setIsSeeding(true);
            try {
              const result = await seedDatabase();
              Alert.alert(result.success ? '成功' : 'エラー', result.message, [
                { text: 'OK' },
              ]);
            } catch (error) {
              Alert.alert(
                'エラー',
                `予期しないエラーが発生しました: ${error}`,
                [{ text: 'OK' }],
              );
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ],
    );
  };

  const levels = [1, 2, 3, 4, 5, 6];
  console.log('__DEV__,', __DEV__);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      {/* アプリタイトル */}
      <View className="items-center pt-16 pb-10">
        <Text className="text-3xl font-bold text-gray-800 tracking-wider">
          TOPIK道場
        </Text>
      </View>

      {/* 復習ボタン */}
      <View className="items-center py-8">
        <TouchableOpacity
          className={`
            border-2 rounded-lg px-10 py-4 bg-white
            ${
              reviewCount === 0
                ? 'border-gray-300 bg-gray-50'
                : 'border-blue-500'
            }
          `}
          onPress={handleReviewPress}
          disabled={reviewCount === 0}
        >
          <Text
            className={`
            text-lg font-semibold
            ${reviewCount === 0 ? 'text-gray-400' : 'text-blue-500'}
          `}
          >
            復習 ({reviewCount}語)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 級選択ボタン */}
      <View className="flex-1 justify-center px-5">
        <View className="items-center">
          {/* 上段: 1級, 2級, 3級 */}
          <View className="flex-row justify-between w-full my-4">
            {levels.slice(0, 3).map(level => (
              <TouchableOpacity
                key={level}
                className="flex-1 border border-gray-800 rounded py-5 mx-2 items-center bg-white"
                onPress={() => handleLevelPress(level)}
              >
                <Text className="text-base font-medium text-gray-800">
                  {level}級
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 下段: 4級, 5級, 6級 */}
          <View className="flex-row justify-between w-full my-4">
            {levels.slice(3, 6).map(level => (
              <TouchableOpacity
                key={level}
                className="flex-1 border border-gray-800 rounded py-5 mx-2 items-center bg-white"
                onPress={() => handleLevelPress(level)}
              >
                <Text className="text-base font-medium text-gray-800">
                  {level}級
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 開発モード用シードボタン */}
      {__DEV__ && (
        <View className="absolute bottom-4 right-4">
          <TouchableOpacity
            onPress={handleSeedDatabase}
            disabled={isSeeding}
            className={`
              px-4 py-2 rounded-lg shadow-lg
              ${isSeeding ? 'bg-gray-400' : 'bg-blue-500'}
            `}
          >
            {isSeeding ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-sm font-medium">Seed DB</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TopScreen;
