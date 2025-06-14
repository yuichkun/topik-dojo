/**
 * アプリのナビゲーション設定
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// 画面コンポーネントのインポート
import TopScreen from '../screens/TopScreen';
import LearningModeSelectionScreen from '../screens/LearningModeSelectionScreen';
import UnitSelectionScreen from '../screens/UnitSelectionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Top"
        screenOptions={{
          headerShown: false, // カスタムヘッダーを使用するため非表示
        }}
      >
        <Stack.Screen name="Top" component={TopScreen} />
        <Stack.Screen name="LearningModeSelection" component={LearningModeSelectionScreen} />
        <Stack.Screen name="UnitSelection" component={UnitSelectionScreen} />
        {/* TODO: 他の画面を追加 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;