import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import database from '../../../src/database/client';
import { getWordsByUnitId } from '../../../src/database/queries/unitQueries';
import { searchWordsByKorean } from '../../../src/database/queries/wordQueries';
import {
  getSrsManagementByWordId,
  createSrsManagement,
} from '../../../src/database/queries/srsQueries';
import { useWordAudio } from '../../../src/hooks/useWordAudio';
import { segmentKoreanText, guessLemmas } from '../../../src/utils/koreanLemmatizer';
import { findWordInExample } from '../../../src/utils/koreanTextUtils';
import WordTooltip from '../../../src/components/WordTooltip';
import type { Word, SrsManagement } from '../../../src/database/schema';

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
  const [srsData, setSrsData] = useState<Map<string, SrsManagement>>(new Map());

  const { playWordAudio, playExampleAudio, isPlaying } = useWordAudio();

  const [tooltipWord, setTooltipWord] = useState<Word | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipFromRef, setTooltipFromRef] = useState<React.RefObject<any> | null>(null);
  const wordRefs = useRef<Map<number, React.RefObject<any>>>(new Map());

  const getRefForIndex = (index: number) => {
    if (!wordRefs.current.has(index)) {
      wordRefs.current.set(index, React.createRef());
    }
    return wordRefs.current.get(index)!;
  };

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
          if (srs) {
            srsMap.set(word.id, srs);
          }
        }
        setSrsData(srsMap);
      } catch (err) {
        if (!cancelled) {
          console.error('単語データ取得エラー:', err);
          setError('単語データの読み込みに失敗しました');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWords();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  const currentWord = words[currentIndex];

  const handleWordTap = useCallback(async (segment: string, ref: React.RefObject<any>) => {
    const lemmas = guessLemmas(segment);
    const foundWord = await searchWordsByKorean(database, lemmas);
    if (foundWord && foundWord.id !== currentWord?.id) {
      setTooltipWord(foundWord);
      setTooltipFromRef(ref);
      setTooltipVisible(true);
    }
  }, [currentWord?.id]);

  const closeTooltip = useCallback(() => {
    setTooltipVisible(false);
    setTooltipWord(null);
    setTooltipFromRef(null);
  }, []);

  useEffect(() => {
    if (currentWord) {
      playWordAudio(currentWord.korean);
    }
  }, [currentWord?.id, playWordAudio]);

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowMeaning(false);
      setShowExample(false);
    } else {
      Alert.alert('学習完了', `${gradeNumber}級 の学習が完了しました。`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  }, [currentIndex, words.length, gradeNumber, router]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowMeaning(false);
      setShowExample(false);
    }
  }, [currentIndex]);

  const handleMarkForReview = useCallback(async () => {
    if (!currentWord) return;

    const existingSrs = srsData.get(currentWord.id);
    if (existingSrs) return;

    try {
      const newSrs = await createSrsManagement(database, currentWord.id);
      if (newSrs) {
        setSrsData(prev => {
          const next = new Map(prev);
          next.set(currentWord.id, newSrs);
          return next;
        });
        Alert.alert('復習登録', '復習リストに追加しました');
      }
    } catch (err) {
      console.error('復習登録エラー:', err);
      Alert.alert('エラー', '復習登録に失敗しました');
    }
  }, [currentWord, srsData]);

  const toggleMeaning = useCallback(() => {
    setShowMeaning(prev => !prev);
  }, []);

  const toggleExample = useCallback(() => {
    setShowExample(prev => !prev);
  }, []);

  const handlePlayWordAudio = useCallback(() => {
    if (currentWord) {
      playWordAudio(currentWord.korean);
    }
  }, [currentWord, playWordAudio]);

  const handlePlayExampleAudio = useCallback(() => {
    if (currentWord) {
      playExampleAudio(currentWord.exampleKorean ?? '');
    }
  }, [currentWord, playExampleAudio]);

  const calculateDaysToReview = (nextReviewDate: number): number => {
    const now = Date.now();
    const diffTime = nextReviewDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">単語を読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">単語データがありません</Text>
      </SafeAreaView>
    );
  }

  const progressPercent = ((currentIndex + 1) / words.length) * 100;
  const existingSrs = srsData.get(currentWord.id);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-blue-500 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 px-3 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">← 戻る</Text>
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text className="text-white text-center font-bold text-lg">
              {gradeNumber}級
            </Text>
            <Text className="text-white/80 text-center">
              ({currentIndex + 1}/{words.length})
            </Text>
          </View>

          <View className="w-16" />
        </View>

        <View className="bg-white/20 h-2 rounded-full mt-3">
          <View
            className="bg-white h-full rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-8">
        <View className="bg-gray-50 rounded-xl p-6 mb-6">
          <TouchableOpacity
            onPress={toggleMeaning}
            className="items-center mb-4"
          >
            <Text className="text-4xl font-bold text-gray-800 mb-4">
              {currentWord.korean}
            </Text>

            <TouchableOpacity
              onPress={handlePlayWordAudio}
              className={`px-4 py-2 rounded-full ${
                isPlaying ? 'bg-blue-300' : 'bg-blue-500'
              }`}
              disabled={isPlaying}
            >
              <Text className="text-white font-semibold">🔊 音声再生</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMeaning} className="mb-4">
            {showMeaning ? (
              <Text className="text-xl text-center text-gray-700 bg-white p-4 rounded-lg">
                {currentWord.japanese}
              </Text>
            ) : (
              <Text className="text-gray-500 text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                タップして意味を表示
              </Text>
            )}
          </TouchableOpacity>

          {(currentWord.exampleKorean || currentWord.exampleJapanese) && (
            <View>
              <TouchableOpacity
                onPress={toggleExample}
                className="bg-blue-100 px-4 py-2 rounded-lg mb-3"
              >
                <Text className="text-blue-700 font-semibold text-center">
                  {showExample ? '例文を隠す' : '例文を見る'}
                </Text>
              </TouchableOpacity>

              {showExample && (
                <View className="bg-white p-4 rounded-lg space-y-3">
                  {currentWord.exampleKorean && (
                    <View>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-gray-600 text-sm">
                          韓国語例文
                        </Text>
                        <TouchableOpacity
                          onPress={handlePlayExampleAudio}
                          className={`px-2 py-1 rounded ${
                            isPlaying ? 'bg-blue-300' : 'bg-blue-500'
                          }`}
                          disabled={isPlaying}
                        >
                          <Text className="text-white text-xs">🔊</Text>
                        </TouchableOpacity>
                      </View>
                      <View className="flex-row flex-wrap mb-3">
                        {segmentKoreanText(currentWord.exampleKorean).map(
                          (segment, idx) => {
                            const ref = getRefForIndex(idx);
                            const highlight = findWordInExample(
                              currentWord.korean,
                              segment,
                            );
                            const isCurrentWord = !!highlight;

                            return (
                              <TouchableOpacity
                                key={idx}
                                ref={ref}
                                onPress={() => handleWordTap(segment, ref)}
                                disabled={isCurrentWord}
                              >
                                <Text
                                  className={`text-lg ${
                                    isCurrentWord
                                      ? 'bg-yellow-200 font-bold'
                                      : 'text-gray-800'
                                  }`}
                                >
                                  {segment}{' '}
                                </Text>
                              </TouchableOpacity>
                            );
                          },
                        )}
                      </View>
                    </View>
                  )}

                  {currentWord.exampleJapanese && (
                    <View>
                      <Text className="text-gray-600 text-sm mb-1">
                        日本語訳
                      </Text>
                      <Text className="text-lg text-gray-700">
                        {currentWord.exampleJapanese}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-lg ${
              currentIndex === 0 ? 'bg-gray-300' : 'bg-gray-500'
            }`}
          >
            <Text
              className={`font-semibold ${
                currentIndex === 0 ? 'text-gray-500' : 'text-white'
              }`}
            >
              前へ
            </Text>
          </TouchableOpacity>

          {existingSrs ? (
            <View className="px-6 py-3 rounded-lg bg-gray-200">
              <Text className="font-semibold text-gray-700 text-center">
                {(() => {
                  const daysToReview = calculateDaysToReview(
                    existingSrs.nextReviewDate || 0,
                  );
                  return daysToReview === 0
                    ? '今日復習予定'
                    : `${daysToReview}日後に復習予定`;
                })()}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleMarkForReview}
              className="px-6 py-3 rounded-lg bg-orange-200"
            >
              <Text className="font-semibold text-orange-700">復習に追加</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">
              {currentIndex === words.length - 1 ? '完了' : '次へ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <WordTooltip
        visible={tooltipVisible}
        word={tooltipWord}
        onClose={closeTooltip}
        fromView={tooltipFromRef}
      />
    </SafeAreaView>
  );
}
