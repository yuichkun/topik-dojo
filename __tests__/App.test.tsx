/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, TouchableOpacity, Text } from 'react-native';
import App from '../App';

// AlertのスパイFunction
jest.spyOn(Alert, 'alert');

describe('TopScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    expect(component!).toBeDefined();
  });

  test('displays app title "TOPIK道場"', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    const title = component!.root.findByProps({ children: 'TOPIK道場' });
    expect(title).toBeDefined();
  });

  test('displays review button with mock count', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    // 復習ボタンのテキストを確認（動的に生成される文字列をテスト）
    const reviewButton = component!.root.findAllByType(TouchableOpacity)[0];
    const reviewButtonText = reviewButton.findByType(Text);
    expect(reviewButtonText.props.children).toEqual(['復習 (', 15, '語)']);
  });

  test('displays all 6 level buttons', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
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

  test('review button calls alert when pressed with valid count', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    // 復習ボタンを取得してタップ
    const reviewButton = component!.root.findAllByType(TouchableOpacity)[0];
    
    await ReactTestRenderer.act(async () => {
      reviewButton.props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('復習画面', '15語の復習を開始します');
  });

  test('level button calls alert when pressed', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    // 1級ボタンを取得してタップ（復習ボタンの次のTouchableOpacity）
    const levelButtons = component!.root.findAllByType(TouchableOpacity);
    const firstLevelButton = levelButtons[1]; // インデックス0は復習ボタン
    
    await ReactTestRenderer.act(async () => {
      firstLevelButton.props.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('級選択', '1級の学習モードを選択してください');
  });

  test('matches snapshot', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    expect(component!.toJSON()).toMatchSnapshot();
  });
});
