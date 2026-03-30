import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import database from '../../src/database/client';
import {
  getGradeResults,
  getDailyProgressData,
} from '../../src/database/queries/resultsQueries';
import type { GradeResults, DailyProgressData } from '../../src/database/queries/resultsQueries';
import { BackButton } from '../../src/components/ui';

// ─── Design Tokens ───────────────────────────────────────────

const C = {
  primary: '#002897',
  surface: '#f8f9fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e1e3e5',
  onBackground: '#191c1d',
  onSurfaceVariant: '#434653',
  outlineVariant: '#c3c6d5',
  onPrimary: '#ffffff',
};

const CHART_COLORS = {
  listening: '#002897',
  reading: '#0ea5e9',
};

// ─── Progress Ring (SVG-free) ───────────────────────────────

function ProgressRing({
  percentage,
  size,
  color,
  label,
}: {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}) {
  const radius = (size - 8) / 2;
  const segments = 60;
  const segmentAngle = 360 / segments;
  const filledSegments = Math.round((percentage / 100) * segments);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        {Array.from({ length: segments }).map((_, i) => {
          const angle = (i * segmentAngle - 90) * (Math.PI / 180);
          const x = size / 2 + radius * Math.cos(angle);
          const y = size / 2 + radius * Math.sin(angle);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x - 2,
                top: y - 2,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: i < filledSegments ? color : C.surfaceContainerHighest,
              }}
            />
          );
        })}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: size * 0.28, color: C.onBackground }}>
            {percentage}%
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 11,
          color: C.onSurfaceVariant,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginTop: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Stat Row ───────────────────────────────────────────────

function StatRow({
  label,
  mastered,
  total,
  color = C.primary,
}: {
  label: string;
  mastered: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? (mastered / total) * 100 : 0;
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: C.onSurfaceVariant }}>
          {label}
        </Text>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: C.onSurfaceVariant }}>
          {mastered} / {total}
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: C.surfaceContainerHighest, borderRadius: 1.5 }}>
        <View style={{ height: 3, width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: 1.5 }} />
      </View>
    </View>
  );
}

// ─── Progress Trend Chart ───────────────────────────────────

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 40, 151, ${opacity})`,
  labelColor: () => C.onSurfaceVariant,
  style: { borderRadius: 16 },
  propsForDots: { r: '3', strokeWidth: '1', stroke: C.primary },
  propsForBackgroundLines: { stroke: C.surfaceContainerHighest, strokeWidth: 1 },
};

function ProgressTrendChart({ dailyData }: { dailyData: DailyProgressData[] }) {
  if (dailyData.length < 2) return null;

  const labelInterval = Math.max(1, Math.ceil(dailyData.length / 5));
  const labels = dailyData.map((d, i) =>
    i % labelInterval === 0 ? d.date.slice(5) : '',
  );

  const allValues = [
    ...dailyData.map(d => d.listeningPercentage),
    ...dailyData.map(d => d.readingPercentage),
  ];
  const maxVal = Math.max(...allValues, 1);
  const ceilMax = Math.ceil(maxVal / 10) * 10 || 10;
  const segments = 5;
  const yLabels = Array.from({ length: segments + 1 }, (_, i) => {
    const val = (ceilMax / segments) * (segments - i);
    return `${val.toFixed(1)}%`;
  });

  const chartData = {
    labels,
    datasets: [
      { data: dailyData.map(d => d.listeningPercentage), color: () => CHART_COLORS.listening, strokeWidth: 2 },
      { data: dailyData.map(d => d.readingPercentage), color: () => CHART_COLORS.reading, strokeWidth: 2 },
    ],
  };
  const chartWidth = Math.max(screenWidth - 92, dailyData.length * 40);

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium', fontSize: 11, color: C.onSurfaceVariant,
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16,
        }}
      >
        PROGRESS TREND
      </Text>
      <View style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 16, paddingVertical: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CHART_COLORS.listening }} />
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant }}>リスニング</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CHART_COLORS.reading }} />
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: C.onSurfaceVariant }}>リーディング</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {/* Fixed Y-axis labels */}
          <View style={{ width: 44, justifyContent: 'space-between', paddingBottom: 28, paddingTop: 4 }}>
            {yLabels.map((label, i) => (
              <Text
                key={i}
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 10,
                  color: C.onSurfaceVariant,
                  textAlign: 'right',
                  paddingRight: 4,
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Scrollable chart */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              withHorizontalLabels={false}
              withVerticalLabels
              fromZero
              segments={5}
              style={{ borderRadius: 12 }}
            />
          </ScrollView>
        </View>
        {dailyData.length > 7 && (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: C.outlineVariant, textAlign: 'center', marginTop: 8 }}>
            左右にスクロールして全期間を確認
          </Text>
        )}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
          <BackButton onPress={onBack} />
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: 'Epilogue_700Bold', fontSize: 48, color: C.surfaceContainerHighest, marginBottom: 16 }}>0%</Text>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 8 }}>
          まだテストを実施していません
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: C.outlineVariant, textAlign: 'center' }}>
          テストに合格した単語が記録されます
        </Text>
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function ResultsScreen() {
  const router = useRouter();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeNum = Number(grade);
  const insets = useSafeAreaInsets();

  const [gradeResults, setGradeResults] = useState<GradeResults | null>(null);
  const [dailyData, setDailyData] = useState<DailyProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleBack = () => router.back();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface }}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: C.onSurfaceVariant, marginTop: 16 }}>
          読み込み中...
        </Text>
      </View>
    );
  }

  if (error || !gradeResults) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: C.onBackground, textAlign: 'center', marginBottom: 24 }}>
          {error || 'データの読み込みに失敗しました'}
        </Text>
        <TouchableOpacity
          onPress={loadData}
          style={{ backgroundColor: C.primary, borderRadius: 4, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: C.onPrimary }}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gradeResults.listening.masteredCount === 0 && gradeResults.reading.masteredCount === 0) {
    return <EmptyState onBack={handleBack} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <StatusBar barStyle="dark-content" />

      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <BackButton onPress={handleBack} />
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: C.onSurfaceVariant }}>
            {gradeResults.grade}級
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: 'Epilogue_700Bold', fontSize: 30, color: C.onBackground,
            letterSpacing: -0.5, marginBottom: 32,
          }}
        >
          成績
        </Text>

        {/* Ring gauges */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 }}>
          <ProgressRing percentage={gradeResults.listening.percentage} size={140} strokeWidth={8} color={CHART_COLORS.listening} label="LISTENING" />
          <ProgressRing percentage={gradeResults.reading.percentage} size={140} strokeWidth={8} color={CHART_COLORS.reading} label="READING" />
        </View>

        {/* Breakdown */}
        <View style={{ backgroundColor: C.surfaceContainerLowest, borderRadius: 16, padding: 24 }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium', fontSize: 11, color: C.onSurfaceVariant,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20,
            }}
          >
            BREAKDOWN
          </Text>
          <StatRow label="リスニング" mastered={gradeResults.listening.masteredCount} total={gradeResults.totalWordsCount} color={CHART_COLORS.listening} />
          <StatRow label="リーディング" mastered={gradeResults.reading.masteredCount} total={gradeResults.totalWordsCount} color={CHART_COLORS.reading} />
        </View>

        <ProgressTrendChart dailyData={dailyData} />
      </ScrollView>

    </View>
  );
}
