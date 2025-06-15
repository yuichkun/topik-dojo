import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LearningScreenProps } from '../navigation/types';
import { Word } from '../database/models';
import { getWordsByUnit } from '../database/queries/unitQueries';

export default function LearningScreen({ route, navigation }: LearningScreenProps) {
  const { level, unitNumber } = route.params;
  
  // 状態管理
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // 単語データ取得
  useEffect(() => {
    const loadWords = async () => {
      try {
        setLoading(true);
        const wordsData = await getWordsByUnit(level, unitNumber);
        
        if (wordsData.length === 0) {
          setError('単語データの読み込みに失敗しました');
          return;
        }
        
        setWords(wordsData);
        setError(null);
      } catch (err) {
        console.error('単語データ取得エラー:', err);
        setError('単語データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadWords();
  }, [level, unitNumber]);

  // 現在の単語
  const currentWord = words[currentIndex];

  // 次の単語へ
  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
      setShowExample(false);
    } else {
      // 学習完了
      Alert.alert(
        '学習完了',
        `${level}級 ユニット${getUnitRange()} の学習が完了しました。`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // 前の単語へ
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowMeaning(false);
      setShowExample(false);
    }
  };

  // 復習に追加
  const handleMarkForReview = () => {
    if (currentWord) {
      const newMarked = new Set(markedForReview);
      if (newMarked.has(currentWord.id)) {
        newMarked.delete(currentWord.id);
      } else {
        newMarked.add(currentWord.id);
      }
      setMarkedForReview(newMarked);
      
      // TODO: 実際のデータベース更新処理を追加
      console.log('復習マーク更新:', currentWord.id, !markedForReview.has(currentWord.id));
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

  // 音声再生（プレースホルダー）
  const playWordAudio = () => {
    if (currentWord) {
      // TODO: 実際の音声再生処理を追加
      console.log('単語音声再生:', currentWord.wordAudioPath);
      Alert.alert('音声再生', `${currentWord.korean} の音声を再生します`);
    }
  };

  // 例文音声再生（プレースホルダー）
  const playExampleAudio = () => {
    if (currentWord) {
      // TODO: 実際の音声再生処理を追加
      console.log('例文音声再生:', currentWord.exampleAudioPath);
      Alert.alert('音声再生', `例文の音声を再生します`);
    }
  };

  // ユニット範囲の計算
  const getUnitRange = () => {
    const start = (unitNumber - 1) * 10 + 1;
    const end = unitNumber * 10;
    return `${start}-${end}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">単語を読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-semibold">戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentWord) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">単語データがありません</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* ヘッダー */}
      <View className="bg-blue-500 px-4 py-3 pt-12">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white/20 px-3 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">← 戻る</Text>
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <Text className="text-white text-center font-bold text-lg">
              {level}級 ユニット{getUnitRange()}
            </Text>
            <Text className="text-white/80 text-center">
              ({currentIndex + 1}/{words.length})
            </Text>
          </View>
          
          <View className="w-16" />
        </View>
        
        {/* 進捗バー */}
        <View className="bg-white/20 h-2 rounded-full mt-3">
          <View
            className="bg-white h-full rounded-full"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </View>
      </View>

      {/* メインコンテンツ */}
      <ScrollView className="flex-1 px-6 py-8">
        {/* 単語カード */}
        <View className="bg-gray-50 rounded-xl p-6 mb-6">
          {/* 韓国語単語 */}
          <TouchableOpacity onPress={toggleMeaning} className="items-center mb-4">
            <Text className="text-4xl font-bold text-gray-800 mb-2">
              {currentWord.korean}
            </Text>
            
            {/* 音声再生ボタン */}
            <TouchableOpacity 
              onPress={playWordAudio}
              className="bg-blue-500 px-4 py-2 rounded-full"
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
                        <Text className="text-gray-600 text-sm">韓国語例文</Text>
                        <TouchableOpacity
                          onPress={playExampleAudio}
                          className="bg-blue-500 px-2 py-1 rounded"
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
                      <Text className="text-gray-600 text-sm mb-1">日本語訳</Text>
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

      {/* フッター操作ボタン */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          {/* 前へボタン */}
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-lg ${
              currentIndex === 0 
                ? 'bg-gray-300' 
                : 'bg-gray-500'
            }`}
          >
            <Text className={`font-semibold ${
              currentIndex === 0 ? 'text-gray-500' : 'text-white'
            }`}>
              前へ
            </Text>
          </TouchableOpacity>

          {/* 復習に追加ボタン */}
          <TouchableOpacity
            onPress={handleMarkForReview}
            className={`px-6 py-3 rounded-lg ${
              markedForReview.has(currentWord.id)
                ? 'bg-orange-500'
                : 'bg-orange-200'
            }`}
          >
            <Text className={`font-semibold ${
              markedForReview.has(currentWord.id)
                ? 'text-white'
                : 'text-orange-700'
            }`}>
              {markedForReview.has(currentWord.id) ? '復習済み' : '復習に追加'}
            </Text>
          </TouchableOpacity>

          {/* 次へボタン */}
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
    </View>
  );
}