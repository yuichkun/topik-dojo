/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReviewScreen from '../ReviewScreen';
import { RootStackParamList } from '../../navigation/types';
import { SCREEN_NAMES } from '../../constants/screens';
import {
  createTestWord,
  createTestSrsRecord,
} from '../../../__tests__/helpers/databaseHelpers';
import { SrsManagement } from '../../database/models';
import database from '../../database';

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
const createTestNavigationContainer = () => {
  const TestNavigationContainer = () => (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={SCREEN_NAMES.REVIEW}>
        <Stack.Screen
          name={SCREEN_NAMES.REVIEW}
          component={ReviewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
  return TestNavigationContainer;
};

describe('ReviewScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  test('renders correctly when no review words available', async () => {
    const TestContainer = createTestNavigationContainer();

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<TestContainer />);
    });

    // 復習対象がない場合、Alertが表示される
    expect(Alert.alert).toHaveBeenCalledWith(
      '復習完了',
      '本日の復習対象がありません。',
      [{ text: 'OK', onPress: expect.any(Function) }]
    );
  });

  test('displays review word when review data is available', async () => {
    // テスト用単語を作成
    const word = await createTestWord(database, {
      korean: '복습',
      japanese: '復習',
      exampleKorean: '복습이 중요합니다.',
      exampleJapanese: '復習が重要です。',
      grade: 3,
    });

    // 復習対象のSRSレコードを作成（期限切れ）
    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 2,
      nextReviewDate: Date.now() - 1000, // 1秒前（期限切れ）
      intervalDays: 3,
      mistakeCount: 1,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 韓国語単語が表示されることを確認
    const textElements = component!.root.findAllByType(Text);
    const koreanWordText = textElements.find(element => {
      const children = element.props.children;
      return typeof children === 'string' && children === '복습';
    });
    expect(koreanWordText).toBeDefined();
  });

  test('displays review header with remaining count', async () => {
    // 複数の復習対象を作成
    const words = await Promise.all([
      createTestWord(database, { korean: '단어1', japanese: '単語1' }),
      createTestWord(database, { korean: '단어2', japanese: '単語2' }),
      createTestWord(database, { korean: '단어3', japanese: '単語3' }),
    ]);

    // 全て復習対象にする
    await Promise.all(
      words.map(word =>
        createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 1,
          nextReviewDate: Date.now() - 1000,
        })
      )
    );

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // ヘッダーに「復習」タイトルが表示されることを確認
    const reviewTitle = component!.root.findByProps({ children: '復習' });
    expect(reviewTitle).toBeDefined();

    // 残り件数が表示されることを確認（配列形式）
    const textElements = component!.root.findAllByType(Text);
    const remainingCountText = textElements.find(element => {
      const children = element.props.children;
      return Array.isArray(children) && children.join('') === '残り 3語';
    });
    expect(remainingCountText).toBeDefined();
  });

  test('displays back button in header', async () => {
    // 1つの復習対象を作成
    const word = await createTestWord(database, {
      korean: '테스트',
      japanese: 'テスト',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    const backButton = component!.root.findByProps({ children: '← 戻る' });
    expect(backButton).toBeDefined();
  });

  test('displays audio play button', async () => {
    const word = await createTestWord(database, {
      korean: '음성',
      japanese: '音声',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
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

  test('displays meaning toggle functionality', async () => {
    const word = await createTestWord(database, {
      korean: '의미',
      japanese: '意味',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 初期状態では意味が隠れている
    const meaningToggle = component!.root.findByProps({
      children: 'タップして意味を表示',
    });
    expect(meaningToggle).toBeDefined();
  });

  test('displays example toggle functionality', async () => {
    const word = await createTestWord(database, {
      korean: '예문',
      japanese: '例文',
      exampleKorean: '예문이 있습니다.',
      exampleJapanese: '例文があります。',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 例文表示ボタンを確認
    const exampleButton = component!.root.findByProps({
      children: '例文を見る',
    });
    expect(exampleButton).toBeDefined();
  });

  test('displays feedback buttons', async () => {
    const word = await createTestWord(database, {
      korean: '피드백',
      japanese: 'フィードバック',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // フィードバックボタンを確認
    const rememberedButton = component!.root.findByProps({
      children: '覚えた',
    });
    const forgottenButton = component!.root.findByProps({
      children: '覚えてない',
    });

    expect(rememberedButton).toBeDefined();
    expect(forgottenButton).toBeDefined();
  });

  test('feedback buttons can be pressed', async () => {
    const word = await createTestWord(database, {
      korean: '버튼',
      japanese: 'ボタン',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // TouchableOpacityコンポーネントから覚えたボタンを探す
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const rememberedButton = touchableOpacities.find(button => {
      try {
        button.findByProps({ children: '覚えた' });
        return true;
      } catch {
        return false;
      }
    });

    expect(rememberedButton).toBeDefined();
    expect(rememberedButton!.props.onPress).toBeInstanceOf(Function);
  });

  test('progress bar updates correctly', async () => {
    // 複数の復習対象を作成
    const words = await Promise.all([
      createTestWord(database, { korean: '진행1', japanese: '進行1' }),
      createTestWord(database, { korean: '진행2', japanese: '進行2' }),
    ]);

    await Promise.all(
      words.map(word =>
        createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 1,
          nextReviewDate: Date.now() - 1000,
        })
      )
    );

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 進捗バーが表示されることを確認
    // スタイルに width プロパティを持つ要素を探す
    const allElements = component!.root.findAll(() => true);
    const progressElements = allElements.filter(element => {
      const style = element.props.style;
      return style && typeof style === 'object' && 'width' in style;
    });
    expect(progressElements.length).toBeGreaterThan(0);
  });

  test('completes review when all words are finished', async () => {
    const word = await createTestWord(database, {
      korean: '완료',
      japanese: '完了',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 1,
      nextReviewDate: Date.now() - 1000,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    // 覚えたボタンを押して復習完了させる
    const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
    const rememberedButton = touchableOpacities.find(button => {
      try {
        button.findByProps({ children: '覚えた' });
        return true;
      } catch {
        return false;
      }
    });

    await ReactTestRenderer.act(async () => {
      await rememberedButton!.props.onPress();
    });

    // 復習完了のアラートが表示される
    expect(Alert.alert).toHaveBeenCalledWith(
      '復習完了',
      '本日の復習が完了しました！お疲れ様でした。',
      [{ text: 'OK', onPress: expect.any(Function) }]
    );
  });

  test('matches snapshot with review data', async () => {
    const word = await createTestWord(database, {
      korean: '스냅샷',
      japanese: 'スナップショット',
      exampleKorean: '스냅샷 테스트입니다.',
      exampleJapanese: 'スナップショットテストです。',
    });

    await createTestSrsRecord(database, {
      wordId: word.id,
      masteryLevel: 2,
      nextReviewDate: Date.now() - 1000,
      mistakeCount: 1,
    });

    const TestContainer = createTestNavigationContainer();
    let component: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<TestContainer />);
    });

    expect(component!.toJSON()).toMatchSnapshot();
  });

  describe('フィードバック処理', () => {
    test('「覚えた」ボタンでSRSデータが正しく更新される', async () => {
      const word = await createTestWord(database, {
        korean: '기억',
        japanese: '記憶',
      });

      const srs = await createTestSrsRecord(database, {
        wordId: word.id,
        masteryLevel: 1,
        nextReviewDate: Date.now() - 1000,
        intervalDays: 3,
        easeFactor: 2.5,
      });

      const TestContainer = createTestNavigationContainer();
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // 覚えたボタンを押す
      const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
      const rememberedButton = touchableOpacities.find(button => {
        try {
          button.findByProps({ children: '覚えた' });
          return true;
        } catch {
          return false;
        }
      });

      await ReactTestRenderer.act(async () => {
        await rememberedButton!.props.onPress();
      });

      // SRSデータが更新されたことを確認（データベースから再取得）
      const srsRecords = await database.collections
        .get<SrsManagement>(srs.table)
        .find(srs.id);
      expect(srsRecords.masteryLevel).toBe(2); // 1→2
      expect(srsRecords.intervalDays).toBe(3); // レベル2は3日固定
    });

    test('「覚えてない」ボタンでSRSデータが正しく更新される', async () => {
      const word = await createTestWord(database, {
        korean: '실수',
        japanese: 'ミス',
      });

      const srs = await createTestSrsRecord(database, {
        wordId: word.id,
        masteryLevel: 3,
        nextReviewDate: Date.now() - 1000,
        intervalDays: 6,
        easeFactor: 2.5,
        mistakeCount: 1,
      });

      const TestContainer = createTestNavigationContainer();
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // 覚えてないボタンを押す
      const touchableOpacities = component!.root.findAllByType(TouchableOpacity);
      const forgottenButton = touchableOpacities.find(button => {
        try {
          button.findByProps({ children: '覚えてない' });
          return true;
        } catch {
          return false;
        }
      });

      await ReactTestRenderer.act(async () => {
        await forgottenButton!.props.onPress();
      });

      // SRSデータが更新されたことを確認（データベースから再取得）
      const srsRecords = await database.collections
        .get<SrsManagement>(srs.table)
        .find(srs.id);
      expect(srsRecords.masteryLevel).toBe(2); // 3→2
      expect(srsRecords.intervalDays).toBe(1); // リセット
      expect(srsRecords.easeFactor).toBe(2.3); // 2.5→2.3
      expect(srsRecords.mistakeCount).toBe(2); // 1→2
    });
  });

  describe('優先度順での表示', () => {
    test('期限超過度が高い単語が先に表示される', async () => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      const words = await Promise.all([
        createTestWord(database, { korean: '최근', japanese: '最近' }),
        createTestWord(database, { korean: '오래전', japanese: '昔' }),
      ]);

      // 昔の単語: より期限超過
      await createTestSrsRecord(database, {
        wordId: words[1].id,
        nextReviewDate: now - 2 * dayMs, // 2日前期限
        mistakeCount: 0,
        lastReviewed: now - 3 * dayMs,
      });

      // 最近の単語: 期限超過少
      await createTestSrsRecord(database, {
        wordId: words[0].id,
        nextReviewDate: now - 1000, // 1秒前期限
        mistakeCount: 0,
        lastReviewed: now - 2000,
      });

      const TestContainer = createTestNavigationContainer();
      let component: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        component = ReactTestRenderer.create(<TestContainer />);
      });

      // より期限超過している単語（昔）が先に表示される
      const textElements = component!.root.findAllByType(Text);
      const koreanWordText = textElements.find(element => {
        const children = element.props.children;
        return typeof children === 'string' && children === '오래전';
      });
      expect(koreanWordText).toBeDefined();
    });
  });
});