import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import Word from './Word';

export default class SrsManagement extends Model {
  static table = TableName.SRS_MANAGEMENT;

  @field('word_id') wordId!: string;
  @field('mastery_level') masteryLevel!: number;
  @field('ease_factor') easeFactor!: number;
  @field('next_review_date') nextReviewDate?: number;
  @field('interval_days') intervalDays!: number;
  @field('mistake_count') mistakeCount!: number;
  @field('last_reviewed') lastReviewed?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation(TableName.WORDS, 'word_id') word!: Relation<Word>;

  // 次回復習日をタイムスタンプとして取得
  get nextReviewDateTimestamp(): number | null {
    return this.nextReviewDate || null;
  }

  // 最終復習日をタイムスタンプとして取得
  get lastReviewedTimestamp(): number | null {
    return this.lastReviewed || null;
  }

  // 今日復習すべきかどうかを判定
  get isDueToday(): boolean {
    if (!this.nextReviewDate) return false;
    const today = Date.now();
    return this.nextReviewDate <= today;
  }

  // SRSステータスの判定（mastery_levelベース）
  get isLearning(): boolean {
    return this.masteryLevel < 9;
  }

  get isMastered(): boolean {
    return this.masteryLevel >= 9;
  }
}