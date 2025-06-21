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
import {
  createTestWord,
  createTestSrsRecord,
} from '../helpers/databaseHelpers';
import { Unit, SrsManagement } from '../../src/database/models';
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

  describe('復習マーク機能', () => {
    test('初回表示時は「復習に追加」ボタンが表示される', async () => {
      const TestContainer = createTestNavigationContainer(1, 1);
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      const reviewButton = component!.root.findByProps({
        children: '復習に追加',
      });
      expect(reviewButton).toBeDefined();
    });

    test('復習に追加ボタンをタップするとSRSレコードが作成される', async () => {
      const TestContainer = createTestNavigationContainer(1, 1);
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // 復習に追加ボタンを探して押す
      const touchableOpacities =
        component!.root.findAllByType(TouchableOpacity);
      const reviewButton = touchableOpacities.find(button => {
        try {
          button.findByProps({ children: '復習に追加' });
          return true;
        } catch {
          return false;
        }
      });

      expect(reviewButton).toBeDefined();

      // ボタンを押す
      await ReactTestRenderer.act(async () => {
        await reviewButton!.props.onPress();
      });

      // Alert.alertが呼ばれたことを確認
      expect(Alert.alert).toHaveBeenCalledWith(
        '復習登録',
        '復習リストに追加しました',
      );

      // データベースにSRSレコードが作成されたことを確認
      const srsRecords = await database.collections
        .get<SrsManagement>(TableName.SRS_MANAGEMENT)
        .query()
        .fetch();

      expect(srsRecords.length).toBe(1);
      expect(srsRecords[0].wordId).toBe('word_1');
      expect(srsRecords[0].masteryLevel).toBe(0);
      expect(srsRecords[0].easeFactor).toBe(2.5);
      expect(srsRecords[0].intervalDays).toBe(1);
      expect(srsRecords[0].mistakeCount).toBe(0);
    });

    test('既にSRS登録済みの単語は復習予定日が表示される', async () => {
      // 事前にSRSレコードを作成
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      await createTestSrsRecord(database, {
        id: 'srs_1',
        wordId: 'word_1',
        masteryLevel: 0,
        easeFactor: 2.5,
        nextReviewDate: tomorrow.getTime(),
        intervalDays: 1,
        mistakeCount: 0,
      });

      const TestContainer = createTestNavigationContainer(1, 1);
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // 復習予定日の表示を確認
      const reviewInfo = component!.root.findByProps({
        children: '1日後に復習予定',
      });
      expect(reviewInfo).toBeDefined();

      // 復習に追加ボタンが表示されないことを確認
      const textElements = component!.root.findAllByType(Text);
      const addReviewButton = textElements.find(element => {
        const children = element.props.children;
        return typeof children === 'string' && children === '復習に追加';
      });
      expect(addReviewButton).toBeUndefined();
    });

    test('本日復習予定の単語は「今日復習予定」と表示される', async () => {
      // 本日の日付でSRSレコードを作成
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createTestSrsRecord(database, {
        id: 'srs_1',
        wordId: 'word_1',
        masteryLevel: 1,
        easeFactor: 2.5,
        nextReviewDate: today.getTime(),
        intervalDays: 3,
        mistakeCount: 0,
      });

      const TestContainer = createTestNavigationContainer(1, 1);
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // 本日復習予定の表示を確認
      const reviewInfo = component!.root.findByProps({
        children: '今日復習予定',
      });
      expect(reviewInfo).toBeDefined();
    });

    test('複数の単語がある場合、それぞれのSRS状態が正しく表示される', async () => {
      // 追加の単語を作成
      await createTestWord(database, {
        id: 'word_2',
        korean: '두번째',
        japanese: '二番目',
        exampleKorean: '두번째 테스트',
        exampleJapanese: '二番目のテスト',
        grade: 1,
        unitId: 'unit_1_1',
        unitOrder: 2,
      });

      // word_2のみSRS登録
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      threeDaysLater.setHours(0, 0, 0, 0);

      await createTestSrsRecord(database, {
        id: 'srs_2',
        wordId: 'word_2',
        masteryLevel: 1,
        easeFactor: 2.5,
        nextReviewDate: threeDaysLater.getTime(),
        intervalDays: 3,
        mistakeCount: 0,
      });

      const TestContainer = createTestNavigationContainer(1, 1);
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // 最初の単語（word_1）では「復習に追加」ボタンが表示される
      const addReviewButton = component!.root.findByProps({
        children: '復習に追加',
      });
      expect(addReviewButton).toBeDefined();

      // 次の単語へ移動
      const touchableOpacities =
        component!.root.findAllByType(TouchableOpacity);
      const nextButton = touchableOpacities.find(button => {
        try {
          button.findByProps({ children: '次へ' });
          return true;
        } catch {
          return false;
        }
      });

      await ReactTestRenderer.act(async () => {
        nextButton!.props.onPress();
      });

      // 2番目の単語（word_2）では復習予定日が表示される
      const reviewInfo = component!.root.findByProps({
        children: '3日後に復習予定',
      });
      expect(reviewInfo).toBeDefined();
    });
  });
});
