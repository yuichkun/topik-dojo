/**
 * TOPIK道場 - React Native App
 * トップ画面（級選択）
 */

import './global.css';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  Alert,
  SafeAreaView,
} from 'react-native';

interface TopScreenProps {}

const TopScreen: React.FC<TopScreenProps> = () => {
  const [reviewCount, setReviewCount] = useState<number>(0);
  const isDarkMode = useColorScheme() === 'dark';

  // 復習対象数を取得（現在はモックデータ）
  useEffect(() => {
    const loadReviewCount = async () => {
      try {
        // TODO: 実際のDBから復習対象数を取得
        // 現在はモックデータを使用
        const mockReviewCount = 15;
        setReviewCount(mockReviewCount);
        
        // TODO: アプリアイコンバッジの更新
        // setBadgeCount(mockReviewCount);
      } catch (error) {
        console.error('復習対象数の取得に失敗:', error);
        // エラーの場合は0件として扱う
        setReviewCount(0);
      }
    };

    loadReviewCount();
  }, []);

  // 復習ボタンのタップハンドラ
  const handleReviewPress = () => {
    if (reviewCount === 0) {
      return; // 復習対象が0件の場合は何もしない
    }
    
    // TODO: 復習画面への遷移
    Alert.alert('復習画面', `${reviewCount}語の復習を開始します`);
  };

  // 級選択ボタンのタップハンドラ
  const handleLevelPress = (level: number) => {
    // TODO: 学習モード選択画面への遷移
    Alert.alert('級選択', `${level}級の学習モードを選択してください`);
  };

  const levels = [1, 2, 3, 4, 5, 6];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />
      
      {/* アプリタイトル */}
      <View className="items-center pt-16 pb-10">
        <Text className="text-3xl font-bold text-gray-800 tracking-wider">TOPIK道場</Text>
      </View>

      {/* 復習ボタン */}
      <View className="items-center py-8">
        <TouchableOpacity
          className={`
            border-2 rounded-lg px-10 py-4 bg-white
            ${reviewCount === 0 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-blue-500'
            }
          `}
          onPress={handleReviewPress}
          disabled={reviewCount === 0}
        >
          <Text className={`
            text-lg font-semibold
            ${reviewCount === 0 
              ? 'text-gray-400' 
              : 'text-blue-500'
            }
          `}>
            復習 ({reviewCount}語)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 級選択ボタン */}
      <View className="flex-1 justify-center px-5">
        <View className="items-center">
          {/* 上段: 1級, 2級, 3級 */}
          <View className="flex-row justify-between w-full my-4">
            {levels.slice(0, 3).map((level) => (
              <TouchableOpacity
                key={level}
                className="flex-1 border border-gray-800 rounded py-5 mx-2 items-center bg-white"
                onPress={() => handleLevelPress(level)}
              >
                <Text className="text-base font-medium text-gray-800">{level}級</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 下段: 4級, 5級, 6級 */}
          <View className="flex-row justify-between w-full my-4">
            {levels.slice(3, 6).map((level) => (
              <TouchableOpacity
                key={level}
                className="flex-1 border border-gray-800 rounded py-5 mx-2 items-center bg-white"
                onPress={() => handleLevelPress(level)}
              >
                <Text className="text-base font-medium text-gray-800">{level}級</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};


export default TopScreen;
