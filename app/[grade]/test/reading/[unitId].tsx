import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import database from '../../../../src/database/client';
import { getWordsByUnitId } from '../../../../src/database/queries/unitQueries';
import { getRandomWordsByGrade } from '../../../../src/database/queries/wordQueries';
import { createSrsManagement } from '../../../../src/database/queries/srsQueries';
import { createWordMastery } from '../../../../src/database/queries/wordMasteryQueries';
import { updateOrCreateLearningProgress } from '../../../../src/database/queries/learningProgressQueries';
import { BackButton } from '../../../../src/components/ui';
import type { Word } from '../../../../src/database/schema';

// ─── Design Tokens ───────────────────────────────────────────

const C = {
  primary: '#002897',
  primaryContainer: '#003ace',
  surface: '#f8f9fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#edeeef',
  surfaceContainerHighest: '#e1e3e5',
  onBackground: '#191c1d',
  onSurfaceVariant: '#434653',
  outlineVariant: '#c3c6d5',
  onPrimary: '#ffffff',
  correct: '#16a34a',
  correctBg: '#f0fdf4',
  incorrect: '#dc2626',
  incorrectBg: '#fef2f2',
};

// ─── Types ───────────────────────────────────────────────────

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
  korean: string;
}

// ─── Completion Screen ──────────────────────────────────────

function CompletionScreen({
  results,
  onBack,
}: {
  results: AnswerResult[];
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const correctCount = results.filter(r => r.correct).length;
  const totalCount = results.length;
  const accuracy =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[C.primary, C.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 48,
          paddingBottom: 64,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          READING TEST COMPLETE
        </Text>
        <Text
          style={{
            fontFamily: 'Epilogue_700Bold',
            fontSize: 72,
            color: C.onPrimary,
          }}
        >
          {accuracy}%
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 15,
            color: 'rgba(255,255,255,0.55)',
            marginTop: 4,
          }}
        >
          正答率
        </Text>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 36, color: C.correct }}>
              {correctCount}
            </Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>
              正解
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 36, color: C.incorrect }}>
              {totalCount - correctCount}
            </Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>
              不正解
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 36, color: C.onBackground }}>
              {totalCount}
            </Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>
              問題数
            </Text>
          </View>
        </View>

        {totalCount - correctCount > 0 && (
          <View style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center' }}>
              間違えた単語は復習リストに追加されました
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ backgroundColor: C.primary, borderRadius: 4, paddingVertical: 16, alignItems: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: C.onPrimary }}>
            戻る
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function ReadingTestScreen() {
  const router = useRouter();
  const { grade, unitId } = useLocalSearchParams<{
    grade: string;
    unitId: string;
  }>();

  const gradeNum = Number(grade) || 1;
  const insets = useSafeAreaInsets();
  const labels = ['A', 'B', 'C', 'D'];

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [testCompleted, setTestCompleted] = useState(false);

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
          const wrongWords = await getRandomWordsByGrade(database, gradeNum, word.id, 3);
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
        if (!cancelled) setLoading(false);
      }
    };

    loadQuestions();
    return () => { cancelled = true; };
  }, [unitId, gradeNum]);

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (isAnswered) return;
      setSelectedAnswer(answer);
      setIsAnswered(true);

      const q = questions[currentIndex];
      setResults(prev => [
        ...prev,
        {
          wordId: q.word.id,
          correct: answer === q.correctAnswer,
          userAnswer: answer,
          correctAnswer: q.correctAnswer,
          timeMs: Date.now() - questionStartTime,
          korean: q.word.korean,
        },
      ]);
    },
    [isAnswered, questions, currentIndex, questionStartTime],
  );

  const saveTestResults = useCallback(
    async (finalResults: AnswerResult[]) => {
      try {
        for (const r of finalResults.filter(r => r.correct)) {
          await createWordMastery(database, r.wordId, 'reading');
        }
        for (const r of finalResults.filter(r => !r.correct)) {
          await createSrsManagement(database, r.wordId, true);
        }
        await updateOrCreateLearningProgress(database, gradeNum);
      } catch (err) {
        console.error('テスト結果保存エラー:', err);
      }
    },
    [gradeNum],
  );

  const handleNext = useCallback(async () => {
    let finalResults = results;

    if (!isAnswered) {
      const q = questions[currentIndex];
      const skippedResult: AnswerResult = {
        wordId: q.word.id,
        correct: false,
        userAnswer: '',
        correctAnswer: q.correctAnswer,
        timeMs: Date.now() - questionStartTime,
        korean: q.word.korean,
      };
      finalResults = [...results, skippedResult];
      setResults(finalResults);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setQuestionStartTime(Date.now());
    } else {
      setTestCompleted(true);
      await saveTestResults(finalResults);
    }
  }, [currentIndex, questions, results, saveTestResults, isAnswered, questionStartTime]);

  const handleBack = useCallback(() => {
    if (results.length > 0 && !testCompleted) {
      Alert.alert('テストを中断しますか？', '現在のテスト結果は保存されません。', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '中断する', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [results.length, testCompleted, router]);

  // ─── Option styling helpers ─────────────────────────────

  const getOptionBg = (option: string) => {
    if (!isAnswered) return C.surfaceContainerLowest;
    if (option === questions[currentIndex].correctAnswer) return C.correctBg;
    if (option === selectedAnswer) return C.incorrectBg;
    return C.surfaceContainer;
  };

  const getOptionTextColor = (option: string) => {
    if (!isAnswered) return C.onBackground;
    if (option === questions[currentIndex].correctAnswer) return C.correct;
    if (option === selectedAnswer) return C.incorrect;
    return C.outlineVariant;
  };

  const getLabelColor = (option: string) => {
    if (!isAnswered) return C.onSurfaceVariant;
    if (option === questions[currentIndex].correctAnswer) return C.correct;
    if (option === selectedAnswer) return C.incorrect;
    return C.outlineVariant;
  };

  // ─── Loading / Error / Complete ─────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface }}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: C.onSurfaceVariant, marginTop: 16 }}>
          問題を準備しています...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: C.onBackground, textAlign: 'center', marginBottom: 24 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: C.primary, borderRadius: 4, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: C.onPrimary }}>戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (testCompleted) {
    return <CompletionScreen results={results} onBack={() => router.back()} />;
  }

  // ─── Quiz UI ────────────────────────────────────────────

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="dark-content" />

      {/* Progress bar */}
      <View style={{ paddingTop: insets.top }}>
        <View style={{ height: 3, backgroundColor: C.surfaceContainerHighest, borderRadius: 1.5 }}>
          <View style={{ height: 3, width: `${progress}%`, backgroundColor: C.primary, borderRadius: 1.5 }} />
        </View>
      </View>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <BackButton onPress={handleBack} />
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: C.onSurfaceVariant }}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* Stimulus card */}
        <View
          style={{
            backgroundColor: C.surfaceContainerLowest,
            borderRadius: 24,
            paddingVertical: 48,
            paddingHorizontal: 32,
            alignItems: 'center',
            shadowColor: C.onBackground,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.04,
            shadowRadius: 24,
            elevation: 3,
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 11,
              color: C.onSurfaceVariant,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            READING
          </Text>

          <Text
            style={{
              fontSize: 48,
              fontWeight: '700',
              color: C.onBackground,
              textAlign: 'center',
              lineHeight: 60,
            }}
          >
            {currentQuestion.word.korean}
          </Text>
        </View>

        {/* Options */}
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={`${currentIndex}-${index}`}
            onPress={() => handleAnswerSelect(option)}
            disabled={isAnswered}
            activeOpacity={0.7}
            style={{
              backgroundColor: getOptionBg(option),
              borderRadius: 10,
              paddingVertical: 16,
              paddingHorizontal: 20,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Text style={{ fontFamily: 'Epilogue_600SemiBold', fontSize: 13, color: getLabelColor(option) }}>
              {labels[index]}
            </Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, color: getOptionTextColor(option), flex: 1 }}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next button — always visible */}
      <View style={{ paddingHorizontal: 32, paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: isAnswered ? C.primary : C.surfaceContainerHighest,
            borderRadius: 4,
            paddingVertical: 16,
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 16,
              color: isAnswered ? C.onPrimary : C.onSurfaceVariant,
            }}
          >
            {isAnswered
              ? (currentIndex < questions.length - 1 ? '次の問題へ' : 'テスト完了')
              : 'スキップ'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
