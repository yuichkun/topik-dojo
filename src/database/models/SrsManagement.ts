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
  @field('status') status!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation(TableName.WORDS, 'word_id') word!: Relation<Word>;

  // 次回復習日をDateオブジェクトで取得
  get nextReviewDateObj(): Date | null {
    return this.nextReviewDate ? new Date(this.nextReviewDate) : null;
  }

  // 最終復習日をDateオブジェクトで取得
  get lastReviewedObj(): Date | null {
    return this.lastReviewed ? new Date(this.lastReviewed) : null;
  }

  // 今日復習すべきかどうかを判定
  get isDueToday(): boolean {
    if (!this.nextReviewDate) return false;
    const today = new Date();
    const nextReview = new Date(this.nextReviewDate);
    return nextReview <= today;
  }

  // SRSステータスの判定
  get isLearning(): boolean {
    return this.status === 'learning';
  }

  get isGraduated(): boolean {
    return this.status === 'graduated';
  }

  get isMastered(): boolean {
    return this.status === 'mastered';
  }
}