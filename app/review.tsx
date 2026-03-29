import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import database from '../src/database/client';
import {
  getReviewWords,
  updateSrsForRemembered,
  updateSrsForForgotten,
} from '../src/database/queries/srsQueries';
import { useWordAudio } from '../src/hooks/useWordAudio';
import type { Word, SrsManagement } from '../src/database/schema';

interface ReviewWordData {
  word: Word;
  srs: SrsManagement;
}

export default function ReviewScreen() {
  const router = useRouter();

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

  const { playWordAudio, playExampleAudio, isPlaying } = useWordAudio();

  useEffect(() => {
    let cancelled = false;

    const loadReviewWords = async () => {
      try {
        setLoading(true);
        setError(null);

        const words = await getReviewWords(database);

        if (cancelled) return;

        setReviewWords(words);
      } catch (err) {
        if (!cancelled) {
          console.error('復習データ取得エラー:', err);
          setError('復習データの読み込みに失敗しました');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReviewWords();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentWordData = reviewWords[currentIndex];
  const currentWord = currentWordData?.word;
  const remainingCount = reviewWords.length - currentIndex;

  useEffect(() => {
    if (currentWord && !isCompleted) {
      playWordAudio(currentWord.korean);
    }
  }, [currentWord?.id, playWordAudio, isCompleted]);

  const handleFeedback = useCallback(
    async (remembered: boolean) => {
      if (!currentWordData || isProcessing) return;

      setIsProcessing(true);
      try {
        const updateFunction = remembered
          ? updateSrsForRemembered
          : updateSrsForForgotten;
        const updatedSrs = await updateFunction(
          database,
          currentWordData.word.id,
        );

        if (!updatedSrs) {
          setError('データの更新に失敗しました');
          setIsProcessing(false);
          return;
        }

        setReviewedCount(prev => prev + 1);
        if (remembered) {
          setRememberedCount(prev => prev + 1);
        }

        if (currentIndex < reviewWords.length - 1) {
          setCurrentIndex(prev => prev + 1);
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

  const handleRemembered = useCallback(() => {
    handleFeedback(true);
  }, [handleFeedback]);

  const handleForgotten = useCallback(() => {
    handleFeedback(false);
  }, [handleFeedback]);

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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="mt-4 text-gray-600">復習データを読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (reviewWords.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-green-500 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/20 px-3 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">← 戻る</Text>
            </TouchableOpacity>
            <Text className="text-white text-center font-bold text-lg flex-1">
              復習
            </Text>
            <View className="w-16" />
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-6">✨</Text>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            復習する単語はありません
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            復習対象の単語が登録されるまで{'\n'}学習やテストを続けましょう
          </Text>
          <TouchableOpacity
            className="bg-green-500 px-8 py-4 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-lg">トップに戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    const forgottenCount = reviewedCount - rememberedCount;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-green-500 px-4 py-3">
          <View className="flex-row justify-center items-center">
            <Text className="text-white text-center font-bold text-lg">
              復習完了
            </Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-6">🎉</Text>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            本日の復習完了！
          </Text>
          <Text className="text-gray-500 mb-8">お疲れ様でした</Text>

          <View className="bg-gray-50 rounded-xl p-6 w-full mb-8">
            <Text className="text-center text-gray-600 mb-4 font-semibold">
              復習結果
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-3xl font-bold text-gray-800">
                  {reviewedCount}
                </Text>
                <Text className="text-gray-500 mt-1">復習した単語</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-green-600">
                  {rememberedCount}
                </Text>
                <Text className="text-gray-500 mt-1">覚えた</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-red-500">
                  {forgottenCount}
                </Text>
                <Text className="text-gray-500 mt-1">覚えてない</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-green-500 px-8 py-4 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-lg">トップに戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent =
    ((reviewWords.length - remainingCount + 1) / reviewWords.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ヘッダー */}
      <View className="bg-green-500 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 px-3 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">← 戻る</Text>
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text className="text-white text-center font-bold text-lg">
              復習
            </Text>
            <Text className="text-white/80 text-center">
              残り {remainingCount}語
            </Text>
          </View>

          <View className="w-16" />
        </View>

        {/* 進捗バー */}
        <View className="bg-white/20 h-2 rounded-full mt-3">
          <View
            className="bg-white h-full rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      {/* メインコンテンツ */}
      <ScrollView className="flex-1 px-6 py-8">
        {/* 単語カード */}
        <View className="bg-gray-50 rounded-xl p-6 mb-6">
          {/* 韓国語単語 */}
          <TouchableOpacity
            onPress={toggleMeaning}
            className="items-center mb-4"
          >
            <Text className="text-4xl font-bold text-gray-800 mb-4">
              {currentWord.korean}
            </Text>

            {/* 音声再生ボタン */}
            <TouchableOpacity
              onPress={handlePlayWordAudio}
              className={`px-4 py-2 rounded-full ${
                isPlaying ? 'bg-green-300' : 'bg-green-500'
              }`}
              disabled={isPlaying}
            >
              <Text className="text-white font-semibold">🔊 音声再生</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 日本語訳 */}
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

          {/* 例文セクション */}
          {(currentWord.exampleKorean || currentWord.exampleJapanese) && (
            <View>
              <TouchableOpacity
                onPress={toggleExample}
                className="bg-green-100 px-4 py-2 rounded-lg mb-3"
              >
                <Text className="text-green-700 font-semibold text-center">
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
                            isPlaying ? 'bg-green-300' : 'bg-green-500'
                          }`}
                          disabled={isPlaying}
                        >
                          <Text className="text-white text-xs">🔊</Text>
                        </TouchableOpacity>
                      </View>
                      <Text className="text-lg text-gray-800 mb-3">
                        {currentWord.exampleKorean}
                      </Text>
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

      {/* フィードバックボタン */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          {/* 覚えてないボタン */}
          <TouchableOpacity
            onPress={handleForgotten}
            disabled={isProcessing}
            className={`flex-1 py-4 rounded-lg mr-3 ${
              isProcessing ? 'bg-gray-300' : 'bg-red-500'
            }`}
          >
            <Text
              className={`font-bold text-center text-lg ${
                isProcessing ? 'text-gray-500' : 'text-white'
              }`}
            >
              覚えてない
            </Text>
          </TouchableOpacity>

          {/* 覚えたボタン */}
          <TouchableOpacity
            onPress={handleRemembered}
            disabled={isProcessing}
            className={`flex-1 py-4 rounded-lg ml-3 ${
              isProcessing ? 'bg-gray-300' : 'bg-green-500'
            }`}
          >
            <Text
              className={`font-bold text-center text-lg ${
                isProcessing ? 'text-gray-500' : 'text-white'
              }`}
            >
              覚えた
            </Text>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View className="items-center mt-2">
            <Text className="text-gray-500 text-sm">処理中...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
