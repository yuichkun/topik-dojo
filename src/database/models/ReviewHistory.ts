import { Model, Relation } from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  relation,
} from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import Word from './Word';

export default class ReviewHistory extends Model {
  static table = TableName.REVIEW_HISTORY;

  @field('word_id') wordId!: string;
  @field('feedback') feedback!: string;
  @field('previous_mastery_level') previousMasteryLevel?: number;
  @field('new_mastery_level') newMasteryLevel!: number;
  @field('review_date') reviewDate!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation(TableName.WORDS, 'word_id') word!: Relation<Word>;

  // 復習日をタイムスタンプとして取得
  get reviewDateTimestamp(): number {
    return this.reviewDate;
  }

  // フィードバックの判定
  get wasRemembered(): boolean {
    return this.feedback === 'remembered';
  }

  get wasForgotten(): boolean {
    return this.feedback === 'forgotten';
  }

  // 習得レベルの変化量を計算
  get masteryLevelChange(): number {
    if (this.previousMasteryLevel === undefined) {
      return this.newMasteryLevel; // 初回復習の場合
    }
    return this.newMasteryLevel - this.previousMasteryLevel;
  }

  // レベルアップしたかどうかを判定
  get didLevelUp(): boolean {
    return this.masteryLevelChange > 0;
  }

  // レベルダウンしたかどうかを判定
  get didLevelDown(): boolean {
    return this.masteryLevelChange < 0;
  }

  // レベル変化なしかどうかを判定
  get didLevelStay(): boolean {
    return this.masteryLevelChange === 0;
  }

  // 復習結果のサマリーを取得
  get reviewSummary(): string {
    const feedbackText = this.wasRemembered ? '覚えた' : '覚えてない';
    const levelChange = this.masteryLevelChange;

    if (levelChange > 0) {
      return `${feedbackText} (レベル+${levelChange})`;
    } else if (levelChange < 0) {
      return `${feedbackText} (レベル${levelChange})`;
    } else {
      return `${feedbackText} (レベル変化なし)`;
    }
  }

  // 復習成果の評価
  get reviewPerformance(): 'improved' | 'maintained' | 'declined' {
    if (this.didLevelUp) return 'improved';
    if (this.didLevelDown) return 'declined';
    return 'maintained';
  }
}
