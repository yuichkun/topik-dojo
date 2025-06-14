import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import TestResult from './TestResult';
import Word from './Word';

export default class TestQuestion extends Model {
  static table = TableName.TEST_QUESTIONS;

  @field('test_result_id') testResultId!: string;
  @field('word_id') wordId!: string;
  @field('is_correct') isCorrect!: boolean;
  @field('user_answer') userAnswer?: string;
  @field('correct_answer') correctAnswer!: string;
  @field('response_time_ms') responseTimeMs?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation(TableName.TEST_RESULTS, 'test_result_id') testResult!: Relation<TestResult>;
  @relation(TableName.WORDS, 'word_id') word!: Relation<Word>;

  // 回答時間を秒単位で取得
  get responseTimeSeconds(): number | null {
    return this.responseTimeMs ? this.responseTimeMs / 1000 : null;
  }

  // 回答結果の判定
  get isIncorrect(): boolean {
    return !this.isCorrect;
  }

  // 回答時間のレベル判定（ミリ秒基準）
  get responseTimeLevel(): 'fast' | 'normal' | 'slow' | 'very_slow' | null {
    if (!this.responseTimeMs) return null;
    
    if (this.responseTimeMs <= 2000) return 'fast';        // 2秒以下
    if (this.responseTimeMs <= 5000) return 'normal';      // 5秒以下
    if (this.responseTimeMs <= 10000) return 'slow';       // 10秒以下
    return 'very_slow';                                     // 10秒超過
  }

  // ユーザーが回答したかどうかを判定
  get hasUserAnswer(): boolean {
    return !!this.userAnswer;
  }

  // 回答が正解と一致しているかを文字列比較
  get isAnswerMatch(): boolean {
    return this.userAnswer === this.correctAnswer;
  }

  // 表示用の回答時間フォーマット
  get formattedResponseTime(): string | null {
    if (!this.responseTimeMs) return null;
    
    const seconds = this.responseTimeMs / 1000;
    return `${seconds.toFixed(1)}秒`;
  }
}