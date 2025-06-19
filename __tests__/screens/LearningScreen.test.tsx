/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LearningScreen from '../../src/screens/LearningScreen';
import { RootStackParamList } from '../../src/navigation/types';
import { SCREEN_NAMES } from '../../src/constants/screens';
import { createTestWord } from '../helpers/databaseHelpers';
import { Unit } from '../../src/database/models';
import { TableName } from '../../src/database/constants';
import database from '../../src/database';

// react-native-sound-playerのモック
jest.mock('react-native-sound-player', () => ({
  playAsset: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
}));

// AlertのスパイFunction
jest.spyOn(Alert, 'alert');

const Stack = createNativeStackNavigator<RootStackParamList>();

// テスト用のナビゲーションコンテナーを作成
const createTestNavigationContainer = (level: number, unitNumber: number) => {
  const TestNavigationContainer = () => (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={SCREEN_NAMES.LEARNING}>
        <Stack.Screen
          name={SCREEN_NAMES.LEARNING}
          component={LearningScreen}
          initialParams={{ level, unitNumber }}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
  return TestNavigationContainer;
};

describe('LearningScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // テスト用ユニットを作成
    await database.write(async () => {
      await database.collections.get<Unit>(TableName.UNITS).create(unit => {
        unit._raw.id = 'unit_1_1';
        unit.grade = 1;
        unit.unitNumber = 1;
      });
    });

    // テスト用単語を作成
    await createTestWord(database, {
      id: 'word_1',
      korean: '테스트',
      japanese: 'テスト',
      exampleKorean: '이것은 테스트입니다.',
      exampleJapanese: 'これはテストです。',
      grade: 1,
      unitId: 'unit_1_1',
      unitOrder: 1,
    });
  });

  test('renders correctly with level 1 unit 1', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    expect(component!).toBeDefined();
  });

  test('displays Korean word when data is loaded', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 韓国語単語が表示されることを確認
    const textElements = component!.root.findAllByType(Text);
    const koreanWordText = textElements.find(element => {
      const children = element.props.children;
      return typeof children === 'string' && children === '테스트';
    });
    expect(koreanWordText).toBeDefined();
  });

  test('displays audio play button when word is loaded', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 音声再生ボタンを確認
    const audioButton = component!.root.findByProps({
      children: '🔊 音声再生',
    });
    expect(audioButton).toBeDefined();
  });

  test('audio button can be pressed', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // TouchableOpacityコンポーネントの中から音声再生ボタンを探す
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const audioButton = touchableOpacities.find(button => {
      try {
        button.findByProps({ children: '🔊 音声再生' });
        return true;
      } catch {
        return false;
      }
    });

    expect(audioButton).toBeDefined();
    expect(audioButton!.props.onPress).toBeInstanceOf(Function);
  });

  test('displays meaning toggle button', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 意味表示切り替えボタンを確認
    const meaningToggle = component!.root.findByProps({
      children: 'タップして意味を表示',
    });
    expect(meaningToggle).toBeDefined();
  });

  test('displays navigation buttons', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // ナビゲーションボタンを確認
    const prevButton = component!.root.findByProps({ children: '前へ' });
    const completeButton = component!.root.findByProps({ children: '完了' }); // 単語が1つなので「完了」
    const reviewButton = component!.root.findByProps({
      children: '復習に追加',
    });

    expect(prevButton).toBeDefined();
    expect(completeButton).toBeDefined();
    expect(reviewButton).toBeDefined();
  });

  test('displays back button in header', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    const backButton = component!.root.findByProps({ children: '← 戻る' });
    expect(backButton).toBeDefined();
  });

  test('matches snapshot', async () => {
    const TestContainer = createTestNavigationContainer(1, 1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    expect(component!.toJSON()).toMatchSnapshot();
  });
});
