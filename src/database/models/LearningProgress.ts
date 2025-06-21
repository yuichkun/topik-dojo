import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';

export default class LearningProgress extends Model {
  static table = TableName.LEARNING_PROGRESS;

  @field('progress_date') progressDate!: string;
  @field('grade') grade!: number;
  @field('mastered_words_count') masteredWordsCount!: number;
  @field('total_words_count') totalWordsCount!: number;
  @field('progress_rate') progressRate!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // 進捗日をタイムスタンプで取得
  get progressDateTimestamp(): number {
    return Date.parse(this.progressDate);
  }

  // 未習得単語数を計算
  get unMasteredWordsCount(): number {
    return this.totalWordsCount - this.masteredWordsCount;
  }

  // 進捗率をパーセンテージ文字列で取得
  get progressPercentage(): string {
    return `${this.progressRate.toFixed(1)}%`;
  }

  // 進捗レベルの判定
  get progressLevel(): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (this.progressRate < 25) return 'beginner';
    if (this.progressRate < 50) return 'intermediate';
    if (this.progressRate < 80) return 'advanced';
    return 'expert';
  }

  // 級レベルの判定
  get gradeLevel(): 'elementary' | 'intermediate' | 'advanced' {
    if (this.grade <= 2) return 'elementary';    // 1級、2級
    if (this.grade <= 4) return 'intermediate';  // 3級、4級
    return 'advanced';                           // 5級、6級
  }

  // 習得状況の評価
  get masteryStatus(): 'excellent' | 'good' | 'fair' | 'need_improvement' {
    if (this.progressRate >= 90) return 'excellent';
    if (this.progressRate >= 70) return 'good';
    if (this.progressRate >= 50) return 'fair';
    return 'need_improvement';
  }

  // 残り習得必要単語数（100%達成まで）
  get remainingWordsToComplete(): number {
    return Math.max(0, this.totalWordsCount - this.masteredWordsCount);
  }

  // 次のマイルストーン（25%刻み）までの残り単語数
  get wordsToNextMilestone(): number {
    const nextMilestone = Math.ceil(this.progressRate / 25) * 25;
    if (nextMilestone >= 100) return this.remainingWordsToComplete;
    
    const wordsNeededForMilestone = Math.ceil((nextMilestone / 100) * this.totalWordsCount);
    return Math.max(0, wordsNeededForMilestone - this.masteredWordsCount);
  }

  // 次のマイルストーンのパーセンテージ
  get nextMilestonePercentage(): number {
    const nextMilestone = Math.ceil(this.progressRate / 25) * 25;
    return Math.min(nextMilestone, 100);
  }
}