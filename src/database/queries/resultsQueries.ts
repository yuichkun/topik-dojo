import database from '../index';
import { Word } from '../models';
import { TableName } from '../constants';
import { Q } from '@nozbe/watermelondb';
import { getListeningMasteredCount, getReadingMasteredCount } from './wordMasteryQueries';
import { getRecentLearningProgress } from './learningProgressQueries';

/**
 * 成績データの型定義
 */
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

/**
 * 日毎進捗データの型定義
 */
export interface DailyProgressData {
  date: string;
  listeningPercentage: number;
  readingPercentage: number;
  totalWordsCount: number;
}

/**
 * 円グラフ用データの型定義
 */
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

/**
 * 指定級の成績データを取得
 * @param grade 級
 * @returns 成績データ
 */
export async function getGradeResults(grade: number): Promise<GradeResults> {
  try {
    // 習得済み語彙数を取得
    const listeningMasteredCount = await getListeningMasteredCount(grade);
    const readingMasteredCount = await getReadingMasteredCount(grade);
    
    // 総語彙数を取得
    const totalWordsCount = await getTotalWordsCount(grade);

    // 習得率を計算
    const listeningPercentage = totalWordsCount > 0 
      ? Number(((listeningMasteredCount / totalWordsCount) * 100).toFixed(1))
      : 0;
    
    const readingPercentage = totalWordsCount > 0 
      ? Number(((readingMasteredCount / totalWordsCount) * 100).toFixed(1))
      : 0;

    return {
      grade,
      listening: {
        masteredCount: listeningMasteredCount,
        totalCount: totalWordsCount,
        percentage: listeningPercentage,
      },
      reading: {
        masteredCount: readingMasteredCount,
        totalCount: totalWordsCount,
        percentage: readingPercentage,
      },
      totalWordsCount,
    };
  } catch (error) {
    console.error('Failed to get grade results:', error);
    return {
      grade,
      listening: { masteredCount: 0, totalCount: 0, percentage: 0 },
      reading: { masteredCount: 0, totalCount: 0, percentage: 0 },
      totalWordsCount: 0,
    };
  }
}

/**
 * 指定級の総語彙数を取得
 * @param grade 級
 * @returns 総語彙数
 */
export async function getTotalWordsCount(grade: number): Promise<number> {
  try {
    const count = await database.collections
      .get<Word>(TableName.WORDS)
      .query(Q.where('grade', grade))
      .fetchCount();

    return count;
  } catch (error) {
    console.error('Failed to get total words count:', error);
    return 0;
  }
}

/**
 * 指定級の日毎進捗データを取得（全期間）
 * @param grade 級
 * @returns 日毎進捗データ配列
 */
export async function getDailyProgressData(grade: number): Promise<DailyProgressData[]> {
  try {
    const progressRecords = await getRecentLearningProgress(grade);

    const dailyData: DailyProgressData[] = progressRecords.map(progress => {
      const listeningPercentage = progress.totalWordsCount > 0 
        ? Number(((progress.listeningMasteredCount / progress.totalWordsCount) * 100).toFixed(1))
        : 0;
      
      const readingPercentage = progress.totalWordsCount > 0 
        ? Number(((progress.readingMasteredCount / progress.totalWordsCount) * 100).toFixed(1))
        : 0;

      return {
        date: progress.date,
        listeningPercentage,
        readingPercentage,
        totalWordsCount: progress.totalWordsCount,
      };
    });

    // 日付昇順でソート
    return dailyData.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Failed to get daily progress data:', error);
    return [];
  }
}

/**
 * リスニング習得率の円グラフデータを生成
 * @param gradeResults 成績データ
 * @returns 円グラフデータ
 */
export function generateListeningPieChartData(gradeResults: GradeResults): PieChartData {
  const percentage = gradeResults.listening.percentage;
  const remaining = 100 - percentage;

  return {
    data: [
      {
        name: '習得済み',
        population: percentage,
        color: '#10B981', // より優しい緑色
        legendFontColor: '#4B5563',
        legendFontSize: 14,
      },
      {
        name: '未習得',
        population: remaining,
        color: '#E5E7EB', // より優しいグレー色
        legendFontColor: '#4B5563',
        legendFontSize: 14,
      },
    ],
    centerText: `${percentage}%`,
  };
}

/**
 * リーディング習得率の円グラフデータを生成
 * @param gradeResults 成績データ
 * @returns 円グラフデータ
 */
export function generateReadingPieChartData(gradeResults: GradeResults): PieChartData {
  const percentage = gradeResults.reading.percentage;
  const remaining = 100 - percentage;

  return {
    data: [
      {
        name: '習得済み',
        population: percentage,
        color: '#3B82F6', // より優しい青色
        legendFontColor: '#4B5563',
        legendFontSize: 14,
      },
      {
        name: '未習得',
        population: remaining,
        color: '#E5E7EB', // より優しいグレー色
        legendFontColor: '#4B5563',
        legendFontSize: 14,
      },
    ],
    centerText: `${percentage}%`,
  };
}

/**
 * 積み重ね式グラフ用のデータを生成
 * @param dailyData 日毎進捗データ
 * @returns 積み重ね式グラフデータ
 */
export function generateStackedChartData(dailyData: DailyProgressData[]) {
  // データが多い場合は7日ごとに表示（週単位）
  const labelInterval = dailyData.length > 30 ? 7 : 1;
  
  const labels = dailyData.map((data, index) => {
    // ラベル間隔に基づいて表示/非表示を決定
    if (index % labelInterval !== 0) {
      return '';
    }
    
    // data.date is already in YYYY-MM-DD format
    const [, month, day] = data.date.split('-');
    // スペース節約のためMM/DD形式を使用
    return `${month}/${day}`;
  });

  const listeningData = dailyData.map(data => data.listeningPercentage);
  const readingData = dailyData.map(data => data.readingPercentage);

  return {
    labels,
    datasets: [
      {
        data: listeningData,
        color: () => '#10B981', // 優しい緑色（リスニング）
        strokeWidth: 2,
      },
      {
        data: readingData,
        color: () => '#3B82F6', // 優しい青色（リーディング）
        strokeWidth: 2,
      },
    ],
    legend: ['リスニング', 'リーディング'],
  };
}