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
} from 'react-native';
import { UnitSelectionScreenProps } from '../navigation/types';
import { SCREEN_NAMES } from '../constants/screens';

// 各級のユニット数設定
const UNITS_PER_LEVEL: Record<number, number> = {
  1: 40,   // 1級: 400語 ÷ 10語/ユニット = 40ユニット
  2: 140,  // 2級: 1,400語 ÷ 10語/ユニット = 140ユニット
  3: 200,  // 3級: 2,000語 ÷ 10語/ユニット = 200ユニット
  4: 200,  // 4級: 2,000語 ÷ 10語/ユニット = 200ユニット
  5: 300,  // 5級: 3,000語 ÷ 10語/ユニット = 300ユニット
  6: 300,  // 6級: 3,000語 ÷ 10語/ユニット = 300ユニット
};

const UnitSelectionScreen: React.FC<UnitSelectionScreenProps> = ({ navigation, route }) => {
  const { level } = route.params;
  const isDarkMode = useColorScheme() === 'dark';
  
  // 選択された級のユニット数を取得
  const totalUnits = UNITS_PER_LEVEL[level] || 40;
  
  // ユニット範囲の配列を生成（1-10, 11-20, ...）
  const generateUnits = () => {
    const units = [];
    for (let i = 1; i <= totalUnits; i += 10) {
      const end = Math.min(i + 9, totalUnits);
      units.push({
        id: `${i}-${end}`,
        label: `${i}-${end}`,
        startUnit: i,
        endUnit: end,
      });
    }
    return units;
  };

  const units = generateUnits();

  // 戻るボタンのハンドラ
  const handleBackPress = () => {
    navigation.goBack();
  };

  // ホームボタンのハンドラ
  const handleHomePress = () => {
    navigation.navigate(SCREEN_NAMES.TOP);
  };

  // ユニット選択のハンドラ
  const handleUnitPress = (startUnit: number, endUnit: number) => {
    // TODO: 学習画面への遷移
    console.log(`Selected unit: ${startUnit}-${endUnit} for level ${level}`);
    // navigation.navigate('Learning', { level, unitStart: startUnit, unitEnd: endUnit });
  };

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
              onPress={() => handleUnitPress(unit.startUnit, unit.endUnit)}
            >
              <Text className="text-base font-medium text-gray-800">
                {unit.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UnitSelectionScreen;