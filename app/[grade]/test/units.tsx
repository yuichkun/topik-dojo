import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import database from '../../../src/database/client';
import { getUnitsByGrade } from '../../../src/database/queries/unitQueries';
import type { Unit } from '../../../src/database/schema';

type TestType = 'reading' | 'listening';
type UnitDisplay = Unit & { displayName: string };

export default function TestUnitSelectionScreen() {
  const router = useRouter();
  const { grade, testType } = useLocalSearchParams<{
    grade: string;
    testType: string;
  }>();
  const isDarkMode = useColorScheme() === 'dark';

  const gradeNumber = Number(grade) || 1;
  const currentTestType: TestType =
    testType === 'listening' ? 'listening' : 'reading';
  const isReading = currentTestType === 'reading';

  const [units, setUnits] = useState<UnitDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadUnits = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUnitsByGrade(database, gradeNumber);
        if (!cancelled) {
          setUnits(
            result.map(unit => ({
              ...unit,
              displayName: `${(unit.unitNumber - 1) * 10 + 1}-${
                unit.unitNumber * 10
              }`,
            })),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e
              : new Error('データの読み込みに失敗しました'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadUnits();
    return () => {
      cancelled = true;
    };
  }, [gradeNumber]);

  const handleBackPress = () => {
    router.back();
  };

  const handleHomePress = () => {
    router.push('/');
  };

  const handleUnitPress = (unitId: string) => {
    if (isReading) {
      router.push(`/${gradeNumber}/test/reading/${unitId}`);
    } else {
      router.push(`/${gradeNumber}/test/listening/${unitId}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator
          size="large"
          color={isReading ? '#14B8A6' : '#8B5CF6'}
          testID="activity-indicator"
        />
        <Text className="mt-4 text-gray-600">
          ユニット情報を読み込んでいます...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-4">
        <Text className="text-red-500 text-lg mb-4">エラーが発生しました</Text>
        <Text className="text-gray-600 text-center">{error.message}</Text>
        <TouchableOpacity
          className={`mt-6 px-6 py-3 rounded-lg ${
            isReading ? 'bg-teal-500' : 'bg-purple-500'
          }`}
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#ffffff"
      />

      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={handleBackPress}>
          <Text
            className={`text-base ${
              isReading ? 'text-teal-500' : 'text-purple-500'
            }`}
          >
            ← 戻る
          </Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-800">
          {gradeNumber}級 {isReading ? 'リーディング' : 'リスニング'}テスト
        </Text>

        <TouchableOpacity className="p-2" onPress={handleHomePress}>
          <Text
            className={`text-base ${
              isReading ? 'text-teal-500' : 'text-purple-500'
            }`}
          >
            ホーム
          </Text>
        </TouchableOpacity>
      </View>

      {/* 説明テキスト */}
      <View
        className={`px-4 py-3 border-b ${
          isReading
            ? 'bg-teal-50 border-teal-100'
            : 'bg-purple-50 border-purple-100'
        }`}
      >
        <Text
          className={`text-sm text-center ${
            isReading ? 'text-teal-700' : 'text-purple-700'
          }`}
        >
          {isReading
            ? 'ハングル文字を見て日本語訳を4択から選択してください'
            : '音声を聞いて日本語訳を4択から選択してください'}
        </Text>
      </View>

      {/* ユニット選択エリア */}
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row flex-wrap justify-between">
          {units.map(unit => (
            <TouchableOpacity
              key={unit.id}
              className={`w-[48%] border-2 rounded-lg py-6 mb-4 items-center shadow-sm ${
                isReading
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-purple-200 bg-purple-50'
              }`}
              onPress={() => handleUnitPress(unit.id)}
            >
              <Text
                className={`text-base font-medium ${
                  isReading ? 'text-teal-800' : 'text-purple-800'
                }`}
              >
                ユニット {unit.displayName}
              </Text>
              <Text
                className={`text-xs mt-1 ${
                  isReading ? 'text-teal-600' : 'text-purple-600'
                }`}
              >
                10問
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
