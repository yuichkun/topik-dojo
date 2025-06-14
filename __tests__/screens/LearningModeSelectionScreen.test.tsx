/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LearningModeSelectionScreen from '../../src/screens/LearningModeSelectionScreen';
import { RootStackParamList } from '../../src/navigation/types';

// AlertのスパイFunction
jest.spyOn(Alert, 'alert');

const Stack = createNativeStackNavigator<RootStackParamList>();

// テスト用のナビゲーションコンテナーを作成
const createTestNavigationContainer = (level: number) => {
  const TestNavigationContainer = () => (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LearningModeSelection">
        <Stack.Screen 
          name="LearningModeSelection" 
          component={LearningModeSelectionScreen}
          initialParams={{ level }}
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
    
    const levelHeader = component!.root.findByProps({ children: '3級' });
    expect(levelHeader).toBeDefined();
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

  test('learning button shows alert when pressed', async () => {
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
    
    await ReactTestRenderer.act(async () => {
      learningButton!.props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('学習モード', '2級の学習ユニットを選択してください');
  });

  test('test button shows alert when pressed', async () => {
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
    
    await ReactTestRenderer.act(async () => {
      testButton!.props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('テストモード', '4級のテストモードを選択してください');
  });

  test('results button shows alert when pressed', async () => {
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
    
    expect(Alert.alert).toHaveBeenCalledWith('成績確認', '5級の成績を確認します');
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