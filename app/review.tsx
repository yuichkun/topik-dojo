import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import database from '../src/database/client';
import {
  getReviewWords,
  updateSrsForRemembered,
  updateSrsForForgotten,
} from '../src/database/queries/srsQueries';
import { searchWordsByKorean } from '../src/database/queries/wordQueries';
import { useWordAudio } from '../src/hooks/useWordAudio';
import {
  segmentKoreanText,
  guessLemmas,
} from '../src/utils/koreanLemmatizer';
import { findWordInExample } from '../src/utils/koreanTextUtils';
import WordTooltip from '../src/components/WordTooltip';
import { BackButton } from '../src/components/ui';
import type { Word, SrsManagement } from '../src/database/schema';

// ─── Design Tokens ───────────────────────────────────────────

const C = {
  primary: '#002897',
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

// ─── Review Theme (Purple) ──────────────────────────────────

const R = {
  hero: '#4c1d95',
  heroEnd: '#6d28d9',
  accent: '#4c1d95',
  highlight: '#ddd6fe',
};

// ─── ClickableWord ──────────────────────────────────────────

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

  const getStyle = () => {
    const base = { fontSize: 17, lineHeight: 26 } as const;
    if (isCurrentWord) {
      return { ...base, backgroundColor: '#b8c3ff', fontWeight: '700' as const, color: C.primary };
    }
    if (hasDefinition) {
      return { ...base, color: C.primary, fontWeight: '500' as const };
    }
    return { ...base, color: C.onBackground };
  };

  return (
    <TouchableOpacity
      onPress={(e) => onPress(segment, e.nativeEvent.pageX, e.nativeEvent.pageY)}
      disabled={!hasDefinition || isCurrentWord}
    >
      <Text style={getStyle()}>{segment} </Text>
    </TouchableOpacity>
  );
}

// ─── ExampleContent ─────────────────────────────────────────

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11, color: C.onSurfaceVariant, letterSpacing: 2, textTransform: 'uppercase' }}>
              例文
            </Text>
            <TouchableOpacity
              onPress={onPlayExampleAudio}
              disabled={isPlaying}
              style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: isPlaying ? C.surfaceContainerHighest : C.primary,
                alignItems: 'center', justifyContent: 'center',
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
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11, color: C.onSurfaceVariant, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            日本語訳
          </Text>
          <Text style={{ fontSize: 16, color: C.onBackground, lineHeight: 24 }}>{word.exampleJapanese}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Types ───────────────────────────────────────────────────

interface ReviewWordData {
  word: Word;
  srs: SrsManagement;
}

// ─── Progress Dots ──────────────────────────────────────────

function ReviewDots({
  total,
  current,
  results,
}: {
  total: number;
  current: number;
  results: boolean[];
}) {
  if (total > 20) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        let color: string;
        if (i < results.length) {
          color = results[i] ? C.correct : C.incorrect;
        } else if (i === current) {
          color = C.onPrimary;
        } else {
          color = 'rgba(255,255,255,0.2)';
        }
        return (
          <View
            key={i}
            style={{
              width: i === current ? 18 : 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: color,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Completion Screen ──────────────────────────────────────

function CompletionScreen({
  reviewedCount,
  rememberedCount,
  onBack,
}: {
  reviewedCount: number;
  rememberedCount: number;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const forgottenCount = reviewedCount - rememberedCount;
  const pct = reviewedCount > 0 ? Math.round((rememberedCount / reviewedCount) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[R.hero, R.heroEnd]}
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
            fontFamily: 'Manrope_500Medium', fontSize: 11,
            color: 'rgba(255,255,255,0.55)', letterSpacing: 2,
            textTransform: 'uppercase', marginBottom: 12,
          }}
        >
          REVIEW COMPLETE
        </Text>
        <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 72, color: C.onPrimary }}>
          {pct}%
        </Text>
        <Text
          style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}
        >
          定着率
        </Text>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 36, color: C.onBackground }}>{reviewedCount}</Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>復習</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 36, color: C.correct }}>{rememberedCount}</Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>覚えた</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 36, color: C.incorrect }}>{forgottenCount}</Text>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant, marginTop: 4 }}>覚えてない</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ backgroundColor: R.accent, borderRadius: 4, paddingVertical: 16, alignItems: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: C.onPrimary }}>トップに戻る</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────────

function EmptyState({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
          <BackButton onPress={onBack} />
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 48, color: C.surfaceContainerHighest, marginBottom: 16 }}>0</Text>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 8 }}>
          復習する単語はありません
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: C.outlineVariant, textAlign: 'center' }}>
          学習やテストを続けると復習対象が追加されます
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ backgroundColor: C.primary, borderRadius: 4, paddingVertical: 16, alignItems: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: C.onPrimary }}>トップに戻る</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviewWords, setReviewWords] = useState<ReviewWordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [feedbackResults, setFeedbackResults] = useState<boolean[]>([]);
  const [tooltipWord, setTooltipWord] = useState<Word | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const { playWordAudio, playExampleAudio, isPlaying } = useWordAudio();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const words = await getReviewWords(database);
        if (!cancelled) setReviewWords(words);
      } catch (err) {
        if (!cancelled) {
          console.error('復習データ取得エラー:', err);
          setError('復習データの読み込みに失敗しました');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const currentWordData = reviewWords[currentIndex];
  const currentWord = currentWordData?.word;
  const remainingCount = reviewWords.length - currentIndex;

  useEffect(() => {
    if (currentWord && !isCompleted) {
      const timer = setTimeout(() => {
        playWordAudio(currentWord.korean);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentWord?.id, playWordAudio, isCompleted]);

  const handleFeedback = useCallback(
    async (remembered: boolean) => {
      if (!currentWordData || isProcessing) return;
      setIsProcessing(true);
      try {
        const fn = remembered ? updateSrsForRemembered : updateSrsForForgotten;
        const result = await fn(database, currentWordData.word.id);
        if (!result) {
          setError('データの更新に失敗しました');
          setIsProcessing(false);
          return;
        }
        setReviewedCount(p => p + 1);
        if (remembered) setRememberedCount(p => p + 1);
        setFeedbackResults(p => [...p, remembered]);

        if (currentIndex < reviewWords.length - 1) {
          setCurrentIndex(p => p + 1);
          setShowMeaning(false);
          setShowExample(false);
        } else {
          setIsCompleted(true);
        }
      } catch (err) {
        console.error('フィードバック処理エラー:', err);
        setError('データの更新に失敗しました');
      } finally {
        setIsProcessing(false);
      }
    },
    [currentWordData, isProcessing, currentIndex, reviewWords.length],
  );

  const handleBack = useCallback(() => router.back(), [router]);

  const handleWordTap = useCallback(
    async (segment: string, pageX: number, pageY: number) => {
      const lemmas = guessLemmas(segment);
      const foundWord = await searchWordsByKorean(database, lemmas);
      if (foundWord && foundWord.id !== currentWord?.id) {
        setTooltipWord(foundWord);
        setTooltipRect({ x: pageX - 30, y: pageY - 15, width: 60, height: 25 });
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

  // ─── Loading / Error ────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface }}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: C.onSurfaceVariant, marginTop: 16 }}>
          復習データを読み込み中...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: C.onBackground, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={handleBack} style={{ backgroundColor: C.primary, borderRadius: 4, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: C.onPrimary }}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reviewWords.length === 0) return <EmptyState onBack={handleBack} />;
  if (isCompleted) return <CompletionScreen reviewedCount={reviewedCount} rememberedCount={rememberedCount} onBack={handleBack} />;

  // ─── Review UI ──────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="light-content" />

      {/* Cobalt header with Korean word */}
      <LinearGradient
        colors={[R.hero, R.heroEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 48 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 }}>
          <BackButton onPress={handleBack} color={C.onPrimary} />
          {reviewWords.length <= 20 ? (
            <ReviewDots total={reviewWords.length} current={currentIndex} results={feedbackResults} />
          ) : (
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              {currentIndex + 1} / {reviewWords.length}
            </Text>
          )}
          <View style={{ width: 40 }} />
        </View>

        <View style={{ alignItems: 'center', paddingTop: 32 }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium', fontSize: 11,
              color: 'rgba(255,255,255,0.45)', letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 8,
            }}
          >
            REVIEW — 残り {remainingCount}語
          </Text>

          <TouchableOpacity onPress={() => setShowMeaning(p => !p)} activeOpacity={0.9}>
            <Text style={{ fontSize: 52, fontWeight: '700', color: C.onPrimary, textAlign: 'center', lineHeight: 68 }}>
              {currentWord.korean}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => playWordAudio(currentWord.korean)}
            disabled={isPlaying}
            style={{
              width: 48, height: 48, borderRadius: 24, marginTop: 20,
              backgroundColor: isPlaying ? 'rgba(255,255,255,0.15)' : C.onPrimary,
              alignItems: 'center', justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={20} color={R.accent} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Surface drawer */}
      <View style={{ flex: 1, backgroundColor: C.surface, marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Meaning card */}
          <TouchableOpacity onPress={() => setShowMeaning(p => !p)} activeOpacity={0.9}>
            <View
              style={{
                backgroundColor: C.surfaceContainerLowest, borderRadius: 16, padding: 24,
                alignItems: 'center',
                shadowColor: C.onBackground, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
              }}
            >
              {showMeaning ? (
                <Text style={{ fontSize: 28, fontWeight: '600', color: C.onBackground, textAlign: 'center' }}>
                  {currentWord.japanese}
                </Text>
              ) : (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: C.outlineVariant }}>
                  タップして意味を表示
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Example with clickable words */}
          {(currentWord.exampleKorean || currentWord.exampleJapanese) && (
            <View style={{ marginTop: 32 }}>
              <TouchableOpacity
                onPress={() => setShowExample(p => !p)}
                style={{
                  backgroundColor: C.surfaceContainerLowest, borderRadius: 4,
                  paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: R.accent }}>
                  {showExample ? '例文を隠す' : '例文を見る'}
                </Text>
              </TouchableOpacity>

              {showExample && (
                <View style={{ marginTop: 16, backgroundColor: C.surfaceContainerLowest, borderRadius: 12, padding: 20 }}>
                  <ExampleContent
                    word={currentWord}
                    isPlaying={isPlaying}
                    onPlayExampleAudio={() => playExampleAudio(currentWord.korean)}
                    onWordTap={handleWordTap}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Feedback buttons */}
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => handleFeedback(false)}
            disabled={isProcessing}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 4, alignItems: 'center',
              backgroundColor: isProcessing ? C.surfaceContainerHighest : C.incorrectBg,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold', fontSize: 16,
                color: isProcessing ? C.outlineVariant : C.incorrect,
              }}
            >
              覚えてない
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleFeedback(true)}
            disabled={isProcessing}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 4, alignItems: 'center',
              backgroundColor: isProcessing ? C.surfaceContainerHighest : R.accent,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold', fontSize: 16,
                color: isProcessing ? C.outlineVariant : C.onPrimary,
              }}
            >
              覚えた
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <WordTooltip
        visible={tooltipVisible}
        word={tooltipWord}
        onClose={closeTooltip}
        fromRect={tooltipRect}
      />

    </View>
  );
}
