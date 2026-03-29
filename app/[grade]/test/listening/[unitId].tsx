import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import database from '../../../../src/database/client';
import { getWordsByUnitId } from '../../../../src/database/queries/unitQueries';
import { getRandomWordsByGrade } from '../../../../src/database/queries/wordQueries';
import { createSrsManagement } from '../../../../src/database/queries/srsQueries';
import { createWordMastery } from '../../../../src/database/queries/wordMasteryQueries';
import { updateOrCreateLearningProgress } from '../../../../src/database/queries/learningProgressQueries';
import { useWordAudio } from '../../../../src/hooks/useWordAudio';
import type { Word } from '../../../../src/database/schema';

interface QuestionData {
  word: Word;
  options: string[];
  correctAnswer: string;
}

interface AnswerResult {
  wordId: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  timeMs: number;
}

export default function ListeningTestScreen() {
  const router = useRouter();
  const { grade, unitId } = useLocalSearchParams<{
    grade: string;
    unitId: string;
  }>();

  const gradeNum = Number(grade) || 1;

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const [testCompleted, setTestCompleted] = useState(false);

  const { playWordAudio, isPlaying } = useWordAudio();

  useEffect(() => {
    let cancelled = false;

    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!unitId) {
          setError('ユニット情報が見つかりません');
          return;
        }

        const wordsData = await getWordsByUnitId(database, unitId);

        if (cancelled) return;

        if (wordsData.length === 0) {
          setError('問題データの読み込みに失敗しました');
          return;
        }

        const generatedQuestions: QuestionData[] = [];

        for (const word of wordsData) {
          const wrongWords = await getRandomWordsByGrade(
            database,
            gradeNum,
            word.id,
            3,
          );

          if (cancelled) return;

          const options = [word.japanese, ...wrongWords.map(w => w.japanese)];
          const shuffled = options.sort(() => Math.random() - 0.5);

          generatedQuestions.push({
            word,
            options: shuffled,
            correctAnswer: word.japanese,
          });
        }

        setQuestions(generatedQuestions);
        setQuestionStartTime(Date.now());
      } catch (err) {
        if (!cancelled) {
          console.error('問題生成エラー:', err);
          setError('問題データの読み込みに失敗しました');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [unitId, gradeNum]);

  useEffect(() => {
    if (questions.length > 0 && !loading) {
      playWordAudio(questions[currentIndex].word.korean);
    }
  }, [currentIndex, questions, loading, playWordAudio]);

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (isAnswered) return;

      setSelectedAnswer(answer);
      setIsAnswered(true);

      const currentQuestion = questions[currentIndex];
      const isCorrect = answer === currentQuestion.correctAnswer;
      const timeMs = Date.now() - questionStartTime;

      setResults(prev => [
        ...prev,
        {
          wordId: currentQuestion.word.id,
          correct: isCorrect,
          userAnswer: answer,
          correctAnswer: currentQuestion.correctAnswer,
          timeMs,
        },
      ]);
    },
    [isAnswered, questions, currentIndex, questionStartTime],
  );

  const saveTestResults = useCallback(
    async (finalResults: AnswerResult[]) => {
      try {
        const correctResults = finalResults.filter(r => r.correct);
        for (const result of correctResults) {
          await createWordMastery(database, result.wordId, 'listening');
        }

        const incorrectResults = finalResults.filter(r => !r.correct);
        for (const result of incorrectResults) {
          await createSrsManagement(database, result.wordId, true);
        }

        await updateOrCreateLearningProgress(database, gradeNum);
      } catch (err) {
        console.error('テスト結果保存エラー:', err);
      }
    },
    [gradeNum],
  );

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setQuestionStartTime(Date.now());
    } else {
      setTestCompleted(true);
      await saveTestResults(results);
    }
  }, [currentIndex, questions.length, results, saveTestResults]);

  const handleBack = useCallback(() => {
    if (results.length > 0 && !testCompleted) {
      Alert.alert(
        'テストを中断しますか？',
        '現在のテスト結果は保存されません。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '中断する', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [results.length, testCompleted, router]);

  const handleReplay = useCallback(() => {
    if (questions.length > 0) {
      playWordAudio(questions[currentIndex].word.korean);
    }
  }, [questions, currentIndex, playWordAudio]);

  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      return 'border-2 border-gray-300 bg-white';
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.correctAnswer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) {
      return 'border-2 border-green-500 bg-green-50';
    } else if (isSelected && !isCorrect) {
      return 'border-2 border-red-500 bg-red-50';
    }
    return 'border-2 border-gray-200 bg-gray-50';
  };

  const getOptionTextStyle = (option: string) => {
    if (!isAnswered) {
      return 'text-gray-800';
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.correctAnswer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) {
      return 'text-green-700 font-semibold';
    } else if (isSelected && !isCorrect) {
      return 'text-red-700 font-semibold';
    }
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="mt-4 text-gray-600">問題を準備しています...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-purple-500 px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (testCompleted) {
    const correctCount = results.filter(r => r.correct).length;
    const totalCount = results.length;
    const accuracy =
      totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const incorrectCount = totalCount - correctCount;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-3xl font-bold text-gray-800 mb-4">
            テスト完了！
          </Text>

          <View className="bg-gray-50 rounded-xl p-6 w-full mb-6">
            <Text className="text-center text-5xl font-bold text-purple-500 mb-2">
              {accuracy}%
            </Text>
            <Text className="text-center text-gray-600 mb-4">正答率</Text>

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-500">
                  {correctCount}
                </Text>
                <Text className="text-gray-600">正解</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-500">
                  {incorrectCount}
                </Text>
                <Text className="text-gray-600">不正解</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-700">
                  {totalCount}
                </Text>
                <Text className="text-gray-600">問題数</Text>
              </View>
            </View>
          </View>

          {incorrectCount > 0 && (
            <Text className="text-gray-600 text-center mb-6">
              間違えた単語は復習リストに追加されました。
            </Text>
          )}

          <TouchableOpacity
            className="bg-purple-500 px-8 py-4 rounded-lg w-full"
            onPress={() => router.back()}
          >
            <Text className="text-white text-lg font-semibold text-center">
              戻る
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={handleBack}>
            <Text className="text-purple-500 text-base font-semibold">
              ← 戻る
            </Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-800">
            {gradeNum}級 リスニングテスト
          </Text>

          <Text className="text-gray-500 text-base">
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>

        <View className="bg-gray-200 rounded-full h-2">
          <View
            className="bg-purple-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <View className="flex-1 px-6 py-8">
        <View className="items-center mb-8">
          <Text className="text-lg text-gray-600 mb-6 text-center">
            音声を聞いて正しい日本語訳を選んでください
          </Text>

          <TouchableOpacity
            className={`w-32 h-32 rounded-full items-center justify-center shadow-lg ${
              isPlaying ? 'bg-purple-600' : 'bg-purple-500'
            }`}
            onPress={handleReplay}
          >
            <Text className="text-4xl">{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>

          <Text className="text-sm text-gray-500 mt-4">
            タップして音声を再生
          </Text>
        </View>

        <View className="flex-1">
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={`${currentIndex}-${index}`}
              className={`p-4 rounded-lg mb-3 ${getOptionStyle(option)}`}
              onPress={() => handleAnswerSelect(option)}
              disabled={isAnswered}
            >
              <Text
                className={`text-lg text-center ${getOptionTextStyle(option)}`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isAnswered && (
          <TouchableOpacity
            className="bg-purple-500 py-4 rounded-lg mt-4"
            onPress={handleNext}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {currentIndex < questions.length - 1
                ? '次の問題へ'
                : 'テスト完了'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
