import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  type TextStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import database from '../../../src/database/client';
import { getWordsByUnitId } from '../../../src/database/queries/unitQueries';
import { searchWordsByKorean } from '../../../src/database/queries/wordQueries';
import {
  getSrsManagementByWordId,
  createSrsManagement,
} from '../../../src/database/queries/srsQueries';
import {
  markUnitOpened,
  markUnitCompleted,
} from '../../../src/database/queries/unitProgressQueries';
import { useWordAudio } from '../../../src/hooks/useWordAudio';
import {
  segmentKoreanText,
  guessLemmas,
} from '../../../src/utils/koreanLemmatizer';
import { findWordInExample } from '../../../src/utils/koreanTextUtils';
import WordTooltip from '../../../src/components/WordTooltip';
import { BackButton } from '../../../src/components/ui';
import type { Word, SrsManagement } from '../../../src/database/schema';

// ─── Design Tokens ───────────────────────────────────────────

const C = {
  primary: '#002897',
  primaryContainer: '#003ace',
  primaryFixedDim: '#b8c3ff',
  surface: '#f8f9fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#edeeef',
  surfaceContainerHighest: '#e1e3e5',
  onBackground: '#191c1d',
  onSurfaceVariant: '#434653',
  outlineVariant: '#c3c6d5',
  onPrimary: '#ffffff',
};

// ─── Shared Types ────────────────────────────────────────────

type LayoutProps = {
  words: Word[];
  currentWord: Word;
  currentIndex: number;
  showMeaning: boolean;
  showExample: boolean;
  isPlaying: boolean;
  existingSrs: SrsManagement | undefined;
  daysToReview: number | null;
  toggleMeaning: () => void;
  toggleExample: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleMarkForReview: () => void;
  handlePlayWordAudio: () => void;
  handlePlayExampleAudio: () => void;
  handleWordTap: (segment: string, pageX: number, pageY: number) => void;
  onBack: () => void;
};

// ─── ClickableWord ───────────────────────────────────────────

function ClickableWord({
  segment,
  isCurrentWord,
  onPress,
}: {
  segment: string;
  isCurrentWord: boolean;
  onPress: (segment: string, pageX: number, pageY: number) => void;
}) {
  const [hasDefinition, setHasDefinition] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isCurrentWord) {
      const check = async () => {
        const lemmas = guessLemmas(segment);
        const found = await searchWordsByKorean(database, lemmas);
        setHasDefinition(!!found);
      };
      check();
    }
  }, [segment, isCurrentWord]);

  const getStyle = (): TextStyle => {
    const base: TextStyle = { fontSize: 17, lineHeight: 26 };
    if (isCurrentWord) {
      return {
        ...base,
        backgroundColor: C.primaryFixedDim,
        fontWeight: '700',
        color: C.primary,
      };
    }
    if (hasDefinition) {
      return { ...base, color: C.primary, fontWeight: '500' };
    }
    return { ...base, color: C.onBackground };
  };

  return (
    <TouchableOpacity
      onPress={(e) =>
        onPress(segment, e.nativeEvent.pageX, e.nativeEvent.pageY)
      }
      disabled={!hasDefinition || isCurrentWord}
    >
      <Text style={getStyle()}>{segment} </Text>
    </TouchableOpacity>
  );
}

// ─── Shared: Example Content ─────────────────────────────────

function ExampleContent({
  word,
  isPlaying,
  onPlayExampleAudio,
  onWordTap,
}: {
  word: Word;
  isPlaying: boolean;
  onPlayExampleAudio: () => void;
  onWordTap: (segment: string, pageX: number, pageY: number) => void;
}) {
  return (
    <View>
      {word.exampleKorean && (
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 11,
                color: C.onSurfaceVariant,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              例文
            </Text>
            <TouchableOpacity
              onPress={onPlayExampleAudio}
              disabled={isPlaying}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isPlaying
                  ? C.surfaceContainerHighest
                  : C.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="play" size={12} color={C.onPrimary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {segmentKoreanText(word.exampleKorean).map((segment, idx) => (
              <ClickableWord
                key={`${word.id}-${idx}`}
                segment={segment}
                isCurrentWord={!!findWordInExample(word.korean, segment)}
                onPress={onWordTap}
              />
            ))}
          </View>
        </View>
      )}
      {word.exampleJapanese && (
        <View>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 11,
              color: C.onSurfaceVariant,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            日本語訳
          </Text>
          <Text
            style={{ fontSize: 16, color: C.onBackground, lineHeight: 24 }}
          >
            {word.exampleJapanese}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Shared: Progress Dots ───────────────────────────────────

function ProgressDots({
  total,
  current,
  activeColor = C.primary,
  inactiveColor = C.surfaceContainerHighest,
}: {
  total: number;
  current: number;
  activeColor?: string;
  inactiveColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= current ? activeColor : inactiveColor,
          }}
        />
      ))}
    </View>
  );
}

// ─── Shared: Nav Buttons ─────────────────────────────────────

function NavButtons({
  currentIndex,
  totalWords,
  onPrevious,
  onNext,
}: {
  currentIndex: number;
  totalWords: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalWords - 1;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
      }}
    >
      <TouchableOpacity
        onPress={onPrevious}
        disabled={isFirst}
        style={{
          backgroundColor: isFirst
            ? C.surfaceContainer
            : C.surfaceContainerHighest,
          borderRadius: 4,
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 14,
            color: isFirst ? C.outlineVariant : C.onBackground,
          }}
        >
          前へ
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        style={{
          backgroundColor: C.primary,
          borderRadius: 4,
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 14,
            color: C.onPrimary,
          }}
        >
          {isLast ? '完了' : '次へ'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Learning Layout ─────────────────────────────────────────

function LearningLayout(props: LayoutProps) {
  const {
    words,
    currentWord,
    currentIndex,
    showMeaning,
    showExample,
    isPlaying,
    existingSrs,
    daysToReview,
    toggleMeaning,
    toggleExample,
    handleNext,
    handlePrevious,
    handleMarkForReview,
    handlePlayWordAudio,
    handlePlayExampleAudio,
    handleWordTap,
    onBack,
  } = props;

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="light-content" />

      {/* Gradient cobalt section */}
      <LinearGradient
        colors={[C.primary, C.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 48 }}
      >
        {/* Header: back + progress dots */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
          }}
        >
          <BackButton onPress={onBack} color={C.onPrimary} />
          <ProgressDots
            total={words.length}
            current={currentIndex}
            activeColor={C.onPrimary}
            inactiveColor="rgba(255,255,255,0.2)"
          />
          <View style={{ width: 40 }} />
        </View>

        {/* Korean word */}
        <View style={{ alignItems: 'center', paddingTop: 36 }}>
          <TouchableOpacity onPress={toggleMeaning} activeOpacity={0.9}>
            <Text
              style={{
                fontSize: 52,
                fontWeight: '700',
                color: C.onPrimary,
                textAlign: 'center',
                lineHeight: 68,
              }}
            >
              {currentWord.korean}
            </Text>
          </TouchableOpacity>

          {/* Glass audio button */}
          <TouchableOpacity
            onPress={handlePlayWordAudio}
            disabled={isPlaying}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              marginTop: 20,
              backgroundColor: isPlaying
                ? 'rgba(255,255,255,0.15)'
                : C.onPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Surface drawer */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          marginTop: -32,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Meaning in a white card */}
          <TouchableOpacity onPress={toggleMeaning} activeOpacity={0.9}>
            <View
              style={{
                backgroundColor: C.surfaceContainerLowest,
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                shadowColor: C.onBackground,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 16,
                elevation: 2,
              }}
            >
              {showMeaning ? (
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '600',
                    color: C.onBackground,
                    textAlign: 'center',
                  }}
                >
                  {currentWord.japanese}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 15,
                    color: C.outlineVariant,
                  }}
                >
                  タップして意味を表示
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Review chip */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            {existingSrs ? (
              <View
                style={{
                  backgroundColor: C.surfaceContainer,
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 12,
                    color: C.onSurfaceVariant,
                  }}
                >
                  {daysToReview === 0
                    ? '今日復習予定'
                    : `${daysToReview}日後に復習`}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleMarkForReview}
                style={{
                  backgroundColor: C.surfaceContainer,
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 12,
                    color: C.primary,
                  }}
                >
                  復習に追加
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Example */}
          {(currentWord.exampleKorean || currentWord.exampleJapanese) && (
            <View style={{ marginTop: 32 }}>
              <TouchableOpacity
                onPress={toggleExample}
                style={{
                  backgroundColor: C.surfaceContainerLowest,
                  borderRadius: 4,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_600SemiBold',
                    fontSize: 13,
                    color: C.primary,
                  }}
                >
                  {showExample ? '例文を隠す' : '例文を見る'}
                </Text>
              </TouchableOpacity>

              {showExample && (
                <View
                  style={{
                    marginTop: 16,
                    backgroundColor: C.surfaceContainerLowest,
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <ExampleContent
                    word={currentWord}
                    isPlaying={isPlaying}
                    onPlayExampleAudio={handlePlayExampleAudio}
                    onWordTap={handleWordTap}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={{ paddingBottom: insets.bottom + 8 }}>
          <NavButtons
            currentIndex={currentIndex}
            totalWords={words.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function LearningScreen() {
  const router = useRouter();
  const { grade, unitId } = useLocalSearchParams<{
    grade: string;
    unitId: string;
  }>();
  const gradeNumber = Number(grade) || 1;

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [srsData, setSrsData] = useState<Map<string, SrsManagement>>(
    new Map(),
  );

  const { playWordAudio, playExampleAudio, isPlaying } = useWordAudio();

  const [tooltipWord, setTooltipWord] = useState<Word | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadWords = async () => {
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
          setError('単語データの読み込みに失敗しました');
          return;
        }
        setWords(wordsData);
        const srsMap = new Map<string, SrsManagement>();
        for (const word of wordsData) {
          const srs = await getSrsManagementByWordId(database, word.id);
          if (cancelled) return;
          if (srs) srsMap.set(word.id, srs);
        }
        setSrsData(srsMap);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load words:', err);
          setError('単語データの読み込みに失敗しました');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadWords();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  const currentWord = words[currentIndex];

  const handleWordTap = useCallback(
    async (segment: string, pageX: number, pageY: number) => {
      const lemmas = guessLemmas(segment);
      const foundWord = await searchWordsByKorean(database, lemmas);
      if (foundWord && foundWord.id !== currentWord?.id) {
        setTooltipWord(foundWord);
        setTooltipRect({
          x: pageX - 30,
          y: pageY - 15,
          width: 60,
          height: 25,
        });
        setTooltipVisible(true);
      }
    },
    [currentWord?.id],
  );

  const closeTooltip = useCallback(() => {
    setTooltipVisible(false);
    setTooltipWord(null);
    setTooltipRect(null);
  }, []);

  useEffect(() => {
    if (currentWord) playWordAudio(currentWord.korean);
  }, [currentWord?.id, playWordAudio]);

  useEffect(() => {
    if (unitId && words.length > 0) markUnitOpened(database, unitId);
  }, [unitId, words.length]);

  useEffect(() => {
    if (unitId && words.length > 0 && currentIndex >= words.length - 1)
      markUnitCompleted(database, unitId);
  }, [unitId, currentIndex, words.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowMeaning(false);
      setShowExample(false);
    } else {
      Alert.alert('学習完了', `${gradeNumber}級 の学習が完了しました。`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [currentIndex, words.length, gradeNumber, router]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowMeaning(false);
      setShowExample(false);
    }
  }, [currentIndex]);

  const handleMarkForReview = useCallback(async () => {
    if (!currentWord) return;
    if (srsData.get(currentWord.id)) return;
    try {
      const newSrs = await createSrsManagement(database, currentWord.id);
      if (newSrs) {
        setSrsData((prev) => {
          const next = new Map(prev);
          next.set(currentWord.id, newSrs);
          return next;
        });
        Alert.alert('復習登録', '復習リストに追加しました');
      }
    } catch (err) {
      console.error('Failed to register for review:', err);
      Alert.alert('エラー', '復習登録に失敗しました');
    }
  }, [currentWord, srsData]);

  const toggleMeaning = useCallback(
    () => setShowMeaning((prev) => !prev),
    [],
  );
  const toggleExample = useCallback(
    () => setShowExample((prev) => !prev),
    [],
  );
  const handlePlayWordAudio = useCallback(() => {
    if (currentWord) playWordAudio(currentWord.korean);
  }, [currentWord, playWordAudio]);
  const handlePlayExampleAudio = useCallback(() => {
    if (currentWord) playExampleAudio(currentWord.korean);
  }, [currentWord, playExampleAudio]);

  const calculateDaysToReview = (nextReviewDate: number): number => {
    const diffTime = nextReviewDate - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.surface,
        }}
      >
        <ActivityIndicator size="large" color={C.primary} />
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 14,
            color: C.onSurfaceVariant,
            marginTop: 16,
          }}
        >
          読み込み中...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.surface,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 15,
            color: C.onBackground,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: C.primary,
            borderRadius: 4,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 14,
              color: C.onPrimary,
            }}
          >
            戻る
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.surface,
        }}
      >
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 15,
            color: C.onSurfaceVariant,
          }}
        >
          単語データがありません
        </Text>
      </SafeAreaView>
    );
  }

  const existingSrs = srsData.get(currentWord.id);
  const daysToReview = existingSrs?.nextReviewDate
    ? calculateDaysToReview(existingSrs.nextReviewDate)
    : null;

  return (
    <View style={{ flex: 1 }}>
      <LearningLayout
        words={words}
        currentWord={currentWord}
        currentIndex={currentIndex}
        showMeaning={showMeaning}
        showExample={showExample}
        isPlaying={isPlaying}
        existingSrs={existingSrs}
        daysToReview={daysToReview}
        toggleMeaning={toggleMeaning}
        toggleExample={toggleExample}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
        handleMarkForReview={handleMarkForReview}
        handlePlayWordAudio={handlePlayWordAudio}
        handlePlayExampleAudio={handlePlayExampleAudio}
        handleWordTap={handleWordTap}
        onBack={() => router.back()}
      />

      <WordTooltip
        visible={tooltipVisible}
        word={tooltipWord}
        onClose={closeTooltip}
        fromRect={tooltipRect}
      />
    </View>
  );
}
