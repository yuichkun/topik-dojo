import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import { ReviewScreenProps } from '../navigation/types';
import { Word, SrsManagement } from '../database/models';
import { 
  getReviewWords,
  updateSrsForRemembered,
  updateSrsForForgotten,
} from '../database/queries/srsQueries';

interface ReviewWordData {
  word: Word;
  srs: SrsManagement;
}

export default function ReviewScreen({ navigation }: ReviewScreenProps) {
  // 状態管理
  const [reviewWords, setReviewWords] = useState<ReviewWordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 復習データ取得
  useEffect(() => {
    const loadReviewWords = async () => {
      try {
        setLoading(true);
        const words = await getReviewWords();

        if (words.length === 0) {
          // 復習対象がない場合
          Alert.alert(
            '復習完了',
            '本日の復習対象がありません。',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ],
          );
          return;
        }

        setReviewWords(words);
        setError(null);
      } catch (err) {
        console.error('復習データ取得エラー:', err);
        setError('復習データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadReviewWords();
  }, [navigation]);

  // 現在の単語表示時に音声自動再生
  useEffect(() => {
    if (reviewWords.length > 0 && currentIndex < reviewWords.length) {
      playWordAudio();
    }
  }, [currentIndex, reviewWords]);

  // 現在の単語データ
  const currentWordData = reviewWords[currentIndex];
  const currentWord = currentWordData?.word;
  const remainingCount = reviewWords.length - currentIndex;

  // 音声再生
  const playWordAudio = () => {
    if (currentWord) {
      try {
        // テスト用に固定のファイルを再生
        SoundPlayer.playAsset(require('../assets/audio/words/word_1.mp3'));
      } catch (_error) {
        // 音声再生失敗時はログのみ記録（アラートは表示しない）
        console.warn('音声の再生に失敗しました');
      }
    }
  };

  // 例文音声再生
  const playExampleAudio = () => {
    if (currentWord) {
      try {
        // テスト用に固定のファイルを再生
        SoundPlayer.playAsset(require('../assets/audio/examples/word_1.mp3'));
      } catch (_error) {
        console.warn('例文音声の再生に失敗しました');
      }
    }
  };

  // 意味表示切り替え
  const toggleMeaning = () => {
    setShowMeaning(!showMeaning);
  };

  // 例文表示切り替え
  const toggleExample = () => {
    setShowExample(!showExample);
  };

  // フィードバック処理の共通ロジック
  const handleFeedback = async (remembered: boolean) => {
    if (!currentWordData || isProcessing) return;

    setIsProcessing(true);
    try {
      const updateFunction = remembered ? updateSrsForRemembered : updateSrsForForgotten;
      const updatedSrs = await updateFunction(currentWordData.srs);

      if (!updatedSrs) {
        Alert.alert('エラー', 'データの更新に失敗しました');
        return;
      }

      // 次の単語へ進む
      moveToNext();
    } catch (err) {
      console.error('フィードバック処理エラー:', err);
      Alert.alert('エラー', 'データの更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 次の単語へ移動
  const moveToNext = () => {
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
      setShowExample(false);
    } else {
      // 復習完了
      Alert.alert(
        '復習完了',
        '本日の復習が完了しました！お疲れ様でした。',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    }
  };

  // 「覚えた」ボタンハンドラ
  const handleRemembered = () => {
    handleFeedback(true);
  };

  // 「覚えてない」ボタンハンドラ
  const handleForgotten = () => {
    handleFeedback(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">復習データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">復習データがありません</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ヘッダー */}
      <View className="bg-green-500 px-4 py-3 pt-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
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
            style={{ 
              width: `${((reviewWords.length - remainingCount + 1) / reviewWords.length) * 100}%` 
            }}
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
            <Text className="text-4xl font-bold text-gray-800 mb-2">
              {currentWord.korean}
            </Text>

            {/* 音声再生ボタン */}
            <TouchableOpacity
              onPress={playWordAudio}
              className="bg-green-500 px-4 py-2 rounded-full"
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
                          onPress={playExampleAudio}
                          className="bg-green-500 px-2 py-1 rounded"
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