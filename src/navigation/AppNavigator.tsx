/**
 * アプリのナビゲーション設定
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SCREEN_NAMES } from '../constants/screens';

// 画面コンポーネントのインポート
import TopScreen from '../screens/TopScreen';
import LearningModeSelectionScreen from '../screens/LearningModeSelectionScreen';
import UnitSelectionScreen from '../screens/UnitSelectionScreen';
import LearningScreen from '../screens/LearningScreen';
import TestModeSelectionScreen from '../screens/TestModeSelectionScreen';
import TestUnitSelectionScreen from '../screens/TestUnitSelectionScreen';
import ReadingTestScreen from '../screens/ReadingTestScreen';
import ListeningTestScreen from '../screens/ListeningTestScreen';
import ReviewScreen from '../screens/ReviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={SCREEN_NAMES.TOP}
        screenOptions={{
          headerShown: false, // カスタムヘッダーを使用するため非表示
        }}
      >
        <Stack.Screen name={SCREEN_NAMES.TOP} component={TopScreen} />
        <Stack.Screen name={SCREEN_NAMES.LEARNING_MODE_SELECTION} component={LearningModeSelectionScreen} />
        <Stack.Screen name={SCREEN_NAMES.UNIT_SELECTION} component={UnitSelectionScreen} />
        <Stack.Screen name={SCREEN_NAMES.LEARNING} component={LearningScreen} />
        <Stack.Screen name={SCREEN_NAMES.TEST_MODE_SELECTION} component={TestModeSelectionScreen} />
        <Stack.Screen name={SCREEN_NAMES.TEST_UNIT_SELECTION} component={TestUnitSelectionScreen} />
        <Stack.Screen name={SCREEN_NAMES.READING_TEST} component={ReadingTestScreen} />
        <Stack.Screen name={SCREEN_NAMES.LISTENING_TEST} component={ListeningTestScreen} />
        <Stack.Screen name={SCREEN_NAMES.REVIEW} component={ReviewScreen} />
        {/* TODO: 他の画面を追加 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;