/**
 * リーディングテスト画面
 * 韓国語単語を表示し、4択の日本語訳から正解を選ぶテスト画面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import { SCREEN_NAMES } from '../constants/screens';
import { Word } from '../database/models';
import { getRandomWordsByGrade } from '../database/queries/wordQueries';
import {
  getSrsManagementByWordId,
  createSrsManagement,
  updateSrsForMistake,
} from '../database/queries/srsQueries';
import { createWordMastery } from '../database/queries/wordMasteryQueries';
import { useUnits } from '../hooks/useUnits';
import database from '../database';
import { Q } from '@nozbe/watermelondb';
import { TableName } from '../database/constants';

import { ReadingTestScreenProps } from '../navigation/types';

interface TestQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
}

interface TestResult {
  wordId: string;
  correct: boolean;
  timeMs: number;
}

const ReadingTestScreen: React.FC<ReadingTestScreenProps> = ({
  navigation,
  route,
}) => {
  const { level, unitNumber } = route.params;
  const isDarkMode = useColorScheme() === 'dark';

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );
  const [showNextButton, setShowNextButton] = useState(false);

  // ユニット情報を取得
  const { units } = useUnits(level);
  const currentUnit = units.find(unit => unit.unitNumber === unitNumber);

  // ユニットの単語を取得して問題を生成
  const generateQuestions = useCallback(async () => {
    try {
      if (!currentUnit) return;

      // ユニットの単語を取得
      const words = await database.collections
        .get<Word>(TableName.WORDS)
        .query(Q.where('unit_id', currentUnit.id))
        .fetch();

      if (words.length === 0) {
        Alert.alert('エラー', '問題データの読み込みに失敗しました', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // 各単語に対して4択問題を生成
      const testQuestions: TestQuestion[] = [];

      for (const word of words) {
        // 同級の他の単語から間違い選択肢を3つ取得
        const wrongOptions = await getRandomWordsByGrade(level, word.id, 3);

        // 選択肢を生成（正解 + 間違い3つ）
        const options = [word.japanese, ...wrongOptions.map(w => w.japanese)];

        // 選択肢をシャッフル
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        testQuestions.push({
          word,
          options: shuffledOptions,
          correctAnswer: word.japanese,
        });
      }

      setQuestions(testQuestions);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('問題生成エラー:', error);
      Alert.alert('エラー', '問題データの読み込みに失敗しました', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentUnit, level, navigation]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  // 戻るボタンのハンドラ
  const handleBackPress = () => {
    Alert.alert(
      'テストを中断しますか？',
      '現在のテスト結果は保存されません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '中断する', onPress: () => navigation.goBack() },
      ],
    );
  };

  // ホームボタンのハンドラ
  const handleHomePress = () => {
    Alert.alert(
      'テストを中断しますか？',
      '現在のテスト結果は保存されません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '中断する',
          onPress: () => navigation.navigate(SCREEN_NAMES.TOP),
        },
      ],
    );
  };

  // 音声再生ボタンのハンドラ
  const handlePlayAudio = () => {
    // テスト用に固定のファイルを再生（学習画面と同じ方式）
    // TODO: あとで変える
    try {
      SoundPlayer.playAsset(require('../assets/audio/words/word_1.mp3'));
    } catch (e) {
      Alert.alert('エラー', '音声再生に失敗しました');
    }
  };

  // 選択肢選択のハンドラ
  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return; // 既に選択済みの場合は無視

    setSelectedAnswer(answer);
    setShowNextButton(true);

    // 結果を記録
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeMs = Date.now() - questionStartTime;

    const result: TestResult = {
      wordId: currentQuestion.word.id,
      correct: isCorrect,
      timeMs,
    };

    setResults(prev => [...prev, result]);
  };

  // 次の問題への遷移
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // 次の問題へ
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowNextButton(false);
      setQuestionStartTime(Date.now());
    } else {
      // テスト完了
      handleTestComplete();
    }
  };

  // テスト完了処理
  const handleTestComplete = async () => {
    const correctCount = results.filter(r => r.correct).length;
    const totalQuestions = questions.length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);

    // 正解した問題をWORD_MASTERYに記録
    const correctResults = results.filter(r => r.correct);
    for (const result of correctResults) {
      await createWordMastery(result.wordId, 'reading');
    }

    // 間違えた問題を復習リストに登録
    const incorrectResults = results.filter(r => !r.correct);
    for (const result of incorrectResults) {
      const question = questions.find(q => q.word.id === result.wordId);
      if (question) {
        const existingSrs = await getSrsManagementByWordId(question.word.id);
        if (!existingSrs) {
          // 新規登録（テスト間違いなのでfromMistake=true）
          await createSrsManagement(question.word.id, true);
        } else {
          // 既存の場合は「覚えてない」処理を適用
          await updateSrsForMistake(existingSrs);
        }
      }
    }

    Alert.alert(
      'テスト完了！',
      `正答率: ${accuracy}% (${correctCount}/${totalQuestions}問正解)${
        incorrectResults.length > 0
          ? '\n\n間違えた単語は復習リストに追加されました。'
          : ''
      }`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  // 選択肢のスタイルを取得
  const getOptionStyle = (option: string) => {
    if (!selectedAnswer) {
      return 'border-2 border-gray-300 bg-white';
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correctAnswer;
    const isSelected = option === selectedAnswer;

    if (isSelected && isCorrect) {
      return 'border-2 border-green-500 bg-green-50';
    } else if (isSelected && !isCorrect) {
      return 'border-2 border-red-500 bg-red-50';
    } else if (isCorrect) {
      return 'border-2 border-green-500 bg-green-50';
    } else {
      return 'border-2 border-gray-300 bg-gray-50';
    }
  };

  // 選択肢のテキストスタイルを取得
  const getOptionTextStyle = (option: string) => {
    if (!selectedAnswer) {
      return 'text-gray-800';
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correctAnswer;
    const isSelected = option === selectedAnswer;

    if (isSelected && isCorrect) {
      return 'text-green-700 font-semibold';
    } else if (isSelected && !isCorrect) {
      return 'text-red-700 font-semibold';
    } else if (isCorrect) {
      return 'text-green-700 font-semibold';
    } else {
      return 'text-gray-600';
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text className="mt-4 text-gray-600">問題を準備しています...</Text>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-4">
        <Text className="text-red-500 text-lg mb-4">
          問題データが見つかりません
        </Text>
        <TouchableOpacity
          className="bg-teal-500 px-6 py-3 rounded-lg"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-medium">戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      {/* ヘッダー */}
      <View className="px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={handleBackPress}>
            <Text className="text-teal-500 text-base">← 戻る</Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-800">
            {level}級 リーディングテスト
          </Text>

          <TouchableOpacity onPress={handleHomePress}>
            <Text className="text-teal-500 text-base">ホーム</Text>
          </TouchableOpacity>
        </View>

        {/* 進捗表示 */}
        <View className="mt-2">
          <Text className="text-center text-sm text-gray-600 mb-2">
            ユニット {currentUnit?.displayName} ({currentQuestionIndex + 1}/
            {questions.length})
          </Text>
          <View className="bg-gray-200 rounded-full h-2">
            <View
              className="bg-teal-500 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      </View>

      {/* メインコンテンツ */}
      <View className="flex-1 px-6 py-8">
        {/* 韓国語単語表示 */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-gray-800 mb-4 text-center">
            {currentQuestion.word.korean}
          </Text>

          {/* 音声再生ボタン */}
          <TouchableOpacity
            className="bg-teal-100 p-3 rounded-full"
            onPress={handlePlayAudio}
          >
            <Text className="text-2xl">🔊</Text>
          </TouchableOpacity>
        </View>

        {/* 4択選択肢 */}
        <View className="flex-1">
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              className={`p-4 rounded-lg mb-3 ${getOptionStyle(option)}`}
              onPress={() => handleAnswerSelect(option)}
              disabled={!!selectedAnswer}
            >
              <Text
                className={`text-lg text-center ${getOptionTextStyle(option)}`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 次へボタン */}
        {showNextButton && (
          <TouchableOpacity
            className="bg-teal-500 py-4 rounded-lg mt-4"
            onPress={handleNextQuestion}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {currentQuestionIndex < questions.length - 1
                ? '次の問題へ'
                : 'テスト完了'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ReadingTestScreen;
