import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PieChart, LineChart } from 'react-native-chart-kit';
import database from '../../src/database/client';
import {
  getGradeResults,
  getDailyProgressData,
  generateListeningPieChartData,
  generateReadingPieChartData,
  generateStackedChartData,
} from '../../src/database/queries/resultsQueries';
import type {
  GradeResults,
  DailyProgressData,
} from '../../src/database/queries/resultsQueries';

export default function ResultsScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeNum = Number(grade);

  const [gradeResults, setGradeResults] = useState<GradeResults | null>(null);
  const [dailyData, setDailyData] = useState<DailyProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [results, daily] = await Promise.all([
        getGradeResults(database, gradeNum),
        getDailyProgressData(database, gradeNum),
      ]);
      setGradeResults(results);
      setDailyData(daily);
    } catch (err) {
      console.error('Failed to load results data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [gradeNum]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBackPress = () => router.back();

  const Header = () => (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <TouchableOpacity onPress={handleBackPress} className="py-2">
        <Text className="text-blue-500 text-base">← 戻る</Text>
      </TouchableOpacity>
      <Text className="text-lg font-bold text-gray-800">{gradeNum}級 成績確認</Text>
      <View className="w-12" />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !gradeResults) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header />
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg text-gray-600 mb-4 text-center">
            {error || 'データの読み込みに失敗しました'}
          </Text>
          <TouchableOpacity
            onPress={loadData}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gradeResults.totalWordsCount === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header />
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg text-gray-600 mb-2 text-center">
            まだテストを実施していません
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            テストを実施すると成績が表示されます
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const listeningPieData = generateListeningPieChartData(gradeResults);
  const readingPieData = generateReadingPieChartData(gradeResults);

  const chartData = dailyData.length > 0
    ? { ...generateStackedChartData(dailyData), legend: undefined as string[] | undefined }
    : null;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffa726' },
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-gray-800 mb-6 text-center">
            習得率
          </Text>

          <View className="items-center mb-8">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              リスニング ({gradeResults.listening.masteredCount}/{gradeResults.totalWordsCount})
            </Text>
            <PieChart
              data={listeningPieData.data}
              width={screenWidth * 0.6}
              height={150}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              center={[0, 0]}
              hasLegend={true}
            />
            <Text className="text-2xl font-bold text-gray-800 mt-3">
              {listeningPieData.centerText}
            </Text>
          </View>

          <View className="items-center">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              リーディング ({gradeResults.reading.masteredCount}/{gradeResults.totalWordsCount})
            </Text>
            <PieChart
              data={readingPieData.data}
              width={screenWidth * 0.6}
              height={150}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              center={[0, 0]}
              hasLegend={true}
            />
            <Text className="text-2xl font-bold text-gray-800 mt-3">
              {readingPieData.centerText}
            </Text>
          </View>
        </View>

        {chartData && chartData.datasets[0].data.length > 0 && (
          <View className="py-6 border-t border-gray-200">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center px-4">
              習得進捗
            </Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              className="px-4"
              contentContainerStyle={styles.scrollContainer}
            >
              <View className="my-2 rounded-2xl">
                <LineChart
                  data={chartData}
                  width={Math.max(screenWidth - 32, dailyData.length * 12)}
                  height={260}
                  chartConfig={chartConfig}
                  bezier
                  formatYLabel={(value) => `${value}%`}
                  verticalLabelRotation={45}
                  yAxisInterval={1}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  fromZero={true}
                  segments={5}
                />
              </View>
            </ScrollView>
            {dailyData.length > 30 && (
              <Text className="text-xs text-gray-500 text-center mt-2 px-4">
                ※ 左右にスクロールして全期間を確認できます
              </Text>
            )}
          </View>
        )}

        {(!chartData || chartData.datasets[0].data.length === 0) && (
          <View className="px-4 py-6 border-t border-gray-200">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              習得進捗
            </Text>
            <View className="py-8">
              <Text className="text-center text-gray-500">
                進捗データがありません
              </Text>
              <Text className="text-center text-gray-400 text-sm mt-1">
                テストを実施すると進捗が記録されます
              </Text>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 20,
  },
});
