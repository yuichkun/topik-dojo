import { getListeningMasteredCount, getReadingMasteredCount } from './wordMasteryQueries';
import { getWordCountByGrade } from './wordQueries';
import { getRecentLearningProgress } from './learningProgressQueries';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export interface GradeResults {
  grade: number;
  listening: {
    masteredCount: number;
    totalCount: number;
    percentage: number;
  };
  reading: {
    masteredCount: number;
    totalCount: number;
    percentage: number;
  };
  totalWordsCount: number;
}

export interface DailyProgressData {
  date: string;
  listeningPercentage: number;
  readingPercentage: number;
  totalWordsCount: number;
}

export interface PieChartData {
  data: Array<{
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }>;
  centerText: string;
}

export async function getGradeResults(
  db: Database,
  grade: number,
): Promise<GradeResults> {
  const listeningMastered = await getListeningMasteredCount(db, grade);
  const readingMastered = await getReadingMasteredCount(db, grade);
  const totalWords = await getWordCountByGrade(db, grade);

  const listeningPct = totalWords > 0
    ? Math.round((listeningMastered / totalWords) * 1000) / 10
    : 0;
  const readingPct = totalWords > 0
    ? Math.round((readingMastered / totalWords) * 1000) / 10
    : 0;

  return {
    grade,
    listening: {
      masteredCount: listeningMastered,
      totalCount: totalWords,
      percentage: listeningPct,
    },
    reading: {
      masteredCount: readingMastered,
      totalCount: totalWords,
      percentage: readingPct,
    },
    totalWordsCount: totalWords,
  };
}

export async function getDailyProgressData(
  db: Database,
  grade: number,
): Promise<DailyProgressData[]> {
  const progress = await getRecentLearningProgress(db, grade);
  return progress
    .map((p) => ({
      date: p.date,
      listeningPercentage:
        p.totalWordsCount > 0
          ? Math.round((p.listeningMasteredCount / p.totalWordsCount) * 1000) / 10
          : 0,
      readingPercentage:
        p.totalWordsCount > 0
          ? Math.round((p.readingMasteredCount / p.totalWordsCount) * 1000) / 10
          : 0,
      totalWordsCount: p.totalWordsCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function generateListeningPieChartData(
  gradeResults: GradeResults,
): PieChartData {
  const { listening } = gradeResults;
  return {
    data: [
      {
        name: '習得済み',
        population: listening.masteredCount,
        color: '#10B981',
        legendFontColor: '#374151',
        legendFontSize: 14,
      },
      {
        name: '未習得',
        population: Math.max(0, listening.totalCount - listening.masteredCount),
        color: '#E5E7EB',
        legendFontColor: '#374151',
        legendFontSize: 14,
      },
    ],
    centerText: `${listening.percentage}%`,
  };
}

export function generateReadingPieChartData(
  gradeResults: GradeResults,
): PieChartData {
  const { reading } = gradeResults;
  return {
    data: [
      {
        name: '習得済み',
        population: reading.masteredCount,
        color: '#3B82F6',
        legendFontColor: '#374151',
        legendFontSize: 14,
      },
      {
        name: '未習得',
        population: Math.max(0, reading.totalCount - reading.masteredCount),
        color: '#E5E7EB',
        legendFontColor: '#374151',
        legendFontSize: 14,
      },
    ],
    centerText: `${reading.percentage}%`,
  };
}

export function generateStackedChartData(dailyData: DailyProgressData[]) {
  const labelInterval = dailyData.length > 30 ? 7 : 1;
  const labels = dailyData.map((d, i) =>
    i % labelInterval === 0 ? d.date.slice(5) : '',
  );

  return {
    labels,
    datasets: [
      {
        data: dailyData.map((d) => d.listeningPercentage),
        color: () => '#10B981',
        strokeWidth: 2,
      },
      {
        data: dailyData.map((d) => d.readingPercentage),
        color: () => '#3B82F6',
        strokeWidth: 2,
      },
    ],
  };
}
