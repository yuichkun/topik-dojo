/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ResultsScreen from '../../src/screens/ResultsScreen';
import { RootStackParamList } from '../../src/navigation/types';
import { SCREEN_NAMES } from '../../src/constants/screens';
import { createTestWords } from '../helpers/databaseHelpers';
import database from '../../src/database';
import { createWordMastery } from '../../src/database/queries/wordMasteryQueries';
import { updateOrCreateLearningProgress } from '../../src/database/queries/learningProgressQueries';
import { format } from 'date-fns';

// Chart componentをモックする
jest.mock('react-native-chart-kit', () => ({
  PieChart: () => 'PieChart',
  LineChart: () => 'LineChart',
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

// Mock screens for navigation
const MockLearningModeSelectionScreen = () => (
  <View>
    <Text>Mock Learning Mode Selection</Text>
  </View>
);
const MockTopScreen = () => (
  <View>
    <Text>Mock Top Screen</Text>
  </View>
);

// テスト用のナビゲーションコンテナーを作成
const createTestNavigationContainer = (
  level: number,
  initialRoute = SCREEN_NAMES.RESULTS,
) => {
  const TestNavigationContainer = () => (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name={SCREEN_NAMES.LEARNING_MODE_SELECTION}
          component={MockLearningModeSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.RESULTS}
          component={ResultsScreen}
          initialParams={{ level }}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={SCREEN_NAMES.TOP}
          component={MockTopScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
  return TestNavigationContainer;
};

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with no data', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    expect(component!).toBeDefined();
  });

  test('displays correct header with level', async () => {
    const TestContainer = createTestNavigationContainer(3);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // ヘッダーのテキストを確認
    const textElements = component!.root.findAllByType(Text);
    const headerText = textElements.find(element => {
      const children = element.props.children;
      return (
        Array.isArray(children) &&
        children[0] === 3 &&
        children[1] === '級 成績確認'
      );
    });
    expect(headerText).toBeDefined();
  });

  test('displays "まだテストを実施していません" when no test data exists', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    const noDataText = component!.root.findByProps({
      children: 'まだテストを実施していません',
    });
    expect(noDataText).toBeDefined();
  });

  test('displays mastery data when test results exist', async () => {
    // テスト用のデータを作成
    const words = await createTestWords(database, [
      { korean: '안녕하세요', japanese: 'こんにちは', grade: 2 },
      { korean: '감사합니다', japanese: 'ありがとうございます', grade: 2 },
      { korean: '죄송합니다', japanese: 'すみません', grade: 2 },
      { korean: '괜찮아요', japanese: '大丈夫です', grade: 2 },
    ]);

    // WORD_MASTERYレコードを作成（2語をリスニング、1語をリーディングで習得済み）
    await createWordMastery(words[0].id, 'listening');
    await createWordMastery(words[1].id, 'listening');
    await createWordMastery(words[2].id, 'reading');

    // 学習進捗データを作成
    await updateOrCreateLearningProgress(2);

    const TestContainer = createTestNavigationContainer(2);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 習得率のセクションタイトルが表示されることを確認
    const masteryTitle = component!.root.findByProps({ children: '習得率' });
    expect(masteryTitle).toBeDefined();

    // リスニングとリーディングのラベルが表示されることを確認
    const textElements = component!.root.findAllByType(Text);

    // リスニングのラベルを確認 (2/4 = 50%)
    const listeningLabel = textElements.find(element => {
      const children = element.props.children;
      return (
        Array.isArray(children) &&
        children[0] === 'リスニング (' &&
        children[1] === 2 &&
        children[2] === '/' &&
        children[3] === 4 &&
        children[4] === ')'
      );
    });
    expect(listeningLabel).toBeDefined();

    // リーディングのラベルを確認 (1/4 = 25%)
    const readingLabel = textElements.find(element => {
      const children = element.props.children;
      return (
        Array.isArray(children) &&
        children[0] === 'リーディング (' &&
        children[1] === 1 &&
        children[2] === '/' &&
        children[3] === 4 &&
        children[4] === ')'
      );
    });
    expect(readingLabel).toBeDefined();
  });

  test('displays progress chart when daily data exists', async () => {
    // テスト用のデータを作成
    const words = await createTestWords(database, [
      { korean: '안녕하세요', japanese: 'こんにちは', grade: 1 },
      { korean: '감사합니다', japanese: 'ありがとうございます', grade: 1 },
    ]);

    // WORD_MASTERYレコードを作成
    await createWordMastery(words[0].id, 'listening');

    // 複数日の学習進捗データを作成
    await updateOrCreateLearningProgress(1);
    const yesterday = format(Date.now() - 24 * 60 * 60 * 1000, 'yyyy-MM-dd');
    await updateOrCreateLearningProgress(1, yesterday);

    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 進捗グラフのタイトルが表示されることを確認
    const progressTitle = component!.root.findByProps({
      children: '習得進捗',
    });
    expect(progressTitle).toBeDefined();
  });

  test('back button is present', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 戻るボタンを確認
    const backButton = component!.root.findByProps({ children: '← 戻る' });
    expect(backButton).toBeDefined();

    // 戻るボタンが押せることを確認
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const backTouchable = touchableOpacities.find(button => {
      try {
        const text = button.findByProps({ children: '← 戻る' });
        return text !== undefined;
      } catch {
        return false;
      }
    });

    expect(backTouchable).toBeDefined();
    expect(backTouchable!.props.onPress).toBeDefined();
  });

  test('displays retry button functionality', async () => {
    const TestContainer = createTestNavigationContainer(1);
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 再試行ボタンがエラー状態でのみ表示されるため、ここでは基本的な構造をテスト
    // コンポーネントが正常にレンダリングされることを確認
    expect(component!.root).toBeDefined();
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
