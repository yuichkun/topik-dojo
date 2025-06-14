import { Model, Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import TestQuestion from './TestQuestion';

export default class TestResult extends Model {
  static table = TableName.TEST_RESULTS;

  @field('grade') grade!: number;
  @field('unit') unit!: number;
  @field('test_type') testType!: string;
  @field('correct_answers') correctAnswers!: number;
  @field('total_questions') totalQuestions!: number;
  @field('accuracy_rate') accuracyRate!: number;
  @field('duration_seconds') durationSeconds?: number;
  @field('test_date') testDate!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children(TableName.TEST_QUESTIONS) testQuestions!: Query<TestQuestion>;

  // テスト実施日をDateオブジェクトで取得
  get testDateObj(): Date {
    return new Date(this.testDate);
  }

  // 所要時間を分単位で取得
  get durationMinutes(): number | null {
    return this.durationSeconds ? Math.round(this.durationSeconds / 60) : null;
  }

  // テストタイプの判定
  get isListeningTest(): boolean {
    return this.testType === 'listening';
  }

  get isReadingTest(): boolean {
    return this.testType === 'reading';
  }

  // スコアレベルの判定
  get scoreLevel(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.accuracyRate >= 90) return 'excellent';
    if (this.accuracyRate >= 70) return 'good';
    if (this.accuracyRate >= 50) return 'fair';
    return 'poor';
  }

  // 不正解数を計算
  get incorrectAnswers(): number {
    return this.totalQuestions - this.correctAnswers;
  }

  // パーセンテージ形式の正答率を取得
  get accuracyPercentage(): string {
    return `${this.accuracyRate.toFixed(1)}%`;
  }
}