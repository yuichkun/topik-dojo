/**
 * 成績確認画面
 * 選択された級のテスト結果を可視化し、学習進捗を確認できる画面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { ResultsScreenProps } from '../navigation/types';
import {
  getGradeResults,
  getDailyProgressData,
  generateListeningPieChartData,
  generateReadingPieChartData,
  generateStackedChartData,
  GradeResults,
  DailyProgressData,
} from '../database/queries/resultsQueries';

const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { level } = route.params;
  const [gradeResults, setGradeResults] = useState<GradeResults | null>(null);
  const [dailyData, setDailyData] = useState<DailyProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 成績データと日毎進捗データを並行取得
      const [results, daily] = await Promise.all([
        getGradeResults(level),
        getDailyProgressData(level),
      ]);

      setGradeResults(results);
      setDailyData(daily);
    } catch (err) {
      console.error('Failed to load results data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    loadData();
  };

  // ローディング状態
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // エラー状態
  if (error || !gradeResults) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={handleBackPress} className="py-2">
            <Text className="text-blue-500 text-base">← 戻る</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">{level}級 成績確認</Text>
          <View className="w-12" />
        </View>

        {/* エラー表示 */}
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg text-gray-600 mb-4 text-center">
            {error || 'データの読み込みに失敗しました'}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // データなし状態
  if (gradeResults.totalWordsCount === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={handleBackPress} className="py-2">
            <Text className="text-blue-500 text-base">← 戻る</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">{level}級 成績確認</Text>
          <View className="w-12" />
        </View>

        {/* データなし表示 */}
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

  // 円グラフデータの生成
  const listeningPieData = generateListeningPieChartData(gradeResults);
  const readingPieData = generateReadingPieChartData(gradeResults);

  const chartData = dailyData.length > 0 ? {
    ...generateStackedChartData(dailyData),
    legend: undefined,
  } : null;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={handleBackPress} className="py-2">
          <Text className="text-blue-500 text-base">← 戻る</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">{level}級 成績確認</Text>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 円グラフエリア */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-gray-800 mb-6 text-center">
            習得率
          </Text>
          
          {/* リスニング円グラフ */}
          <View className="items-center mb-8">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              リスニング ({gradeResults.listening.masteredCount}/{gradeResults.totalWordsCount})
            </Text>
            <View className="items-center">
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
            </View>
            <Text className="text-2xl font-bold text-gray-800 mt-3">
              {listeningPieData.centerText}
            </Text>
          </View>

          {/* リーディング円グラフ */}
          <View className="items-center">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              リーディング ({gradeResults.reading.masteredCount}/{gradeResults.totalWordsCount})
            </Text>
            <View className="items-center">
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
            </View>
            <Text className="text-2xl font-bold text-gray-800 mt-3">
              {readingPieData.centerText}
            </Text>
          </View>
        </View>

        {/* 進捗グラフエリア */}
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

        {/* データなしメッセージ（進捗グラフ用） */}
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

        {/* 下部の余白 */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  scrollContainer: {
    paddingBottom: 20,
  },
};

export default ResultsScreen;