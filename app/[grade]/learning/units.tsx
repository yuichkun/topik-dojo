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

type UnitDisplay = Unit & { displayName: string };

export default function UnitSelectionScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const isDarkMode = useColorScheme() === 'dark';

  const gradeNumber = Number(grade) || 1;

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
    router.push(`/${gradeNumber}/learning/${unitId}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator
          size="large"
          color="#3B82F6"
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
          className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
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
          <Text className="text-blue-500 text-base">← 戻る</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-800">
          {gradeNumber}級 学習
        </Text>

        <TouchableOpacity className="p-2" onPress={handleHomePress}>
          <Text className="text-blue-500 text-base">ホーム</Text>
        </TouchableOpacity>
      </View>

      {/* ユニット選択エリア */}
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row flex-wrap justify-between">
          {units.map(unit => (
            <TouchableOpacity
              key={unit.id}
              className="w-[48%] border border-gray-300 rounded-lg py-6 mb-4 items-center bg-white shadow-sm"
              onPress={() => handleUnitPress(unit.id)}
            >
              <Text className="text-base font-medium text-gray-800">
                {unit.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
