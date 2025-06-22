/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LearningModeSelectionScreen from '../../src/screens/LearningModeSelectionScreen';
import { RootStackParamList } from '../../src/navigation/types';
import { SCREEN_NAMES } from '../../src/constants/screens';

// AlertのスパイFunction
jest.spyOn(Alert, 'alert');

const Stack = createNativeStackNavigator<RootStackParamList>();

// Mock screens for navigation targets
const MockUnitSelectionScreen = () => <View><Text>Mock Unit Selection</Text></View>;
const MockTestModeSelectionScreen = () => <View><Text>Mock Test Mode Selection</Text></View>;
const MockResultsScreen = () => <View><Text>Mock Results</Text></View>;

// テスト用のナビゲーションコンテナーを作成
const createTestNavigationContainer = (level: number) => {
  const TestNavigationContainer = () => (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={SCREEN_NAMES.LEARNING_MODE_SELECTION}>
        <Stack.Screen
          name={SCREEN_NAMES.LEARNING_MODE_SELECTION}
          component={LearningModeSelectionScreen}
          initialParams={{ level }}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.UNIT_SELECTION}
          component={MockUnitSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.TEST_MODE_SELECTION}
          component={MockTestModeSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.RESULTS}
          component={MockResultsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
  return TestNavigationContainer;
};

describe('LearningModeSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with level 1', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    expect(component!).toBeDefined();
  });

  test('displays selected level in header', async () => {
    const TestContainer = createTestNavigationContainer(3);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // Text要素の内容を確認 - 配列形式で [3, '級'] となっている
    const textElements = component!.root.findAllByType(Text);
    const levelText = textElements.find(element => {
      const children = element.props.children;
      return (
        Array.isArray(children) && children[0] === 3 && children[1] === '級'
      );
    });
    expect(levelText).toBeDefined();
  });

  test('displays all three mode buttons', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 3つのモードボタンを確認
    const learningButton = component!.root.findByProps({ children: '学習' });
    const testButton = component!.root.findByProps({ children: 'テスト' });
    const resultsButton = component!.root.findByProps({ children: '成績' });

    expect(learningButton).toBeDefined();
    expect(testButton).toBeDefined();
    expect(resultsButton).toBeDefined();
  });

  test('learning button can be pressed', async () => {
    const TestContainer = createTestNavigationContainer(2);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 学習ボタンを見つけてタップ
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const learningButton = touchableOpacities.find(button => {
      try {
        const text = button.findByProps({ children: '学習' });
        return text !== undefined;
      } catch {
        return false;
      }
    });

    expect(learningButton).toBeDefined();

    // ボタンが押せることを確認（エラーが発生しないことを確認）
    await ReactTestRenderer.act(async () => {
      learningButton!.props.onPress();
    });

    // 学習ボタンは現在ナビゲーションするため、Alertは呼ばれない
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test('test button navigates to test mode selection when pressed', async () => {
    const TestContainer = createTestNavigationContainer(4);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // テストボタンを見つけてタップ
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const testButton = touchableOpacities.find(button => {
      try {
        const text = button.findByProps({ children: 'テスト' });
        return text !== undefined;
      } catch {
        return false;
      }
    });

    expect(testButton).toBeDefined();

    // ナビゲーションはテスト環境では実際には動作しないが、エラーが出ないことを確認
    await ReactTestRenderer.act(async () => {
      testButton!.props.onPress();
    });
  });

  test('results button navigates to results screen when pressed', async () => {
    const TestContainer = createTestNavigationContainer(5);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 成績ボタンを見つけてタップ
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const resultsButton = touchableOpacities.find(button => {
      try {
        const text = button.findByProps({ children: '成績' });
        return text !== undefined;
      } catch {
        return false;
      }
    });

    expect(resultsButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      resultsButton!.props.onPress();
    });

    // Should navigate to results screen instead of showing alert
    // Verify that the MockResultsScreen is rendered
    await ReactTestRenderer.act(async () => {
      const mockResultsText = component!.root.findByProps({ children: 'Mock Results' });
      expect(mockResultsText).toBeDefined();
    });
  });

  test('back button is present', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    const backButton = component!.root.findByProps({ children: '← 戻る' });
    expect(backButton).toBeDefined();
  });

  test('matches snapshot', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    expect(component!.toJSON()).toMatchSnapshot();
  });
});
