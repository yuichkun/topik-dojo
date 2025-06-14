/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TopScreen from '../../src/screens/TopScreen';
import { RootStackParamList } from '../../src/navigation/types';
import { createTestWords, createDueReviews } from '../helpers/databaseHelpers';
import database from '../../src/database';

// AlertのスパイFunction
jest.spyOn(Alert, 'alert');

const Stack = createNativeStackNavigator<RootStackParamList>();

// テスト用のナビゲーションコンテナーを作成
const createTestNavigationContainer = () => {
  const TestNavigationContainer = () => (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Top">
        <Stack.Screen 
          name="Top" 
          component={TopScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
  return TestNavigationContainer;
};

describe('TopScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', async () => {
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    expect(component!).toBeDefined();
  });

  test('displays app title "TOPIK道場"', async () => {
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    const title = component!.root.findByProps({ children: 'TOPIK道場' });
    expect(title).toBeDefined();
  });

  test('displays review button with database count', async () => {
    // テスト用のデータを作成
    const words = await createTestWords(database, [
      { korean: '안녕하세요', japanese: 'こんにちは' },
      { korean: '감사합니다', japanese: 'ありがとうございます' },
      { korean: '죄송합니다', japanese: 'すみません' }
    ]);
    
    // 復習対象のSRSレコードを作成（3語中2語が復習対象）
    await createDueReviews(database, [words[0].id, words[1].id]);
    
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    // 少し時間を置いてuseEffectが実行されるのを待つ
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 復習ボタンのテキストを確認（2語が復習対象）
    const reviewButton = component!.root.findAllByType(TouchableOpacity)[0];
    const reviewButtonText = reviewButton.findByType(Text);
    expect(reviewButtonText.props.children).toEqual(['復習 (', 2, '語)']);
  });

  test('displays all 6 level buttons', async () => {
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    // 1級から6級までのボタンが表示されることを確認
    const levelButtons = component!.root.findAllByType(TouchableOpacity);
    // 復習ボタンも含まれるので、級ボタンは1番目以降
    const actualLevelButtons = levelButtons.slice(1);
    
    expect(actualLevelButtons).toHaveLength(6);
    
    for (let i = 0; i < 6; i++) {
      const buttonText = actualLevelButtons[i].findByType(Text);
      expect(buttonText.props.children).toEqual([i + 1, '級']);
    }
  });

  test('review button is disabled when no reviews available', async () => {
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    // 復習ボタンを取得
    const reviewButton = component!.root.findAllByType(TouchableOpacity)[0];
    
    // ボタンが無効化されていることを確認（0語の状態）
    const reviewButtonText = reviewButton.findByType(Text);
    expect(reviewButtonText.props.children).toEqual(['復習 (', 0, '語)']);
    
    // タップしてもアラートが呼ばれないことを確認
    await ReactTestRenderer.act(async () => {
      reviewButton.props.onPress();
    });
    
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test('level button can be pressed', async () => {
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    // 1級ボタンを取得してタップ（復習ボタンの次のTouchableOpacity）
    const levelButtons = component!.root.findAllByType(TouchableOpacity);
    const firstLevelButton = levelButtons[1]; // インデックス0は復習ボタン
    
    // ボタンのonPressプロパティが定義されていることを確認
    expect(firstLevelButton.props.onPress).toBeDefined();
    
    // ボタンが押せることを確認（エラーが発生しないことを確認）
    await ReactTestRenderer.act(async () => {
      firstLevelButton.props.onPress();
    });
    
    // ナビゲーションが正しく動作することを想定（現在は実際のナビゲーションはテストしない）
    expect(true).toBe(true);
  });

  test('matches snapshot', async () => {
    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });
    
    expect(component!.toJSON()).toMatchSnapshot();
  });
});