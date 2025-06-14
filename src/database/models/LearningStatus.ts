import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import Word from './Word';

export default class LearningStatus extends Model {
  static table = TableName.LEARNING_STATUS;

  @field('word_id') wordId!: string;
  @field('is_learned') isLearned!: boolean;
  @field('is_marked_for_review') isMarkedForReview!: boolean;
  @field('learned_date') learnedDate?: number;
  @field('marked_date') markedDate?: number;
  @field('learning_session_count') learningSessionCount!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation(TableName.WORDS, 'word_id') word!: Relation<Word>;

  // 学習完了日をDateオブジェクトで取得
  get learnedDateObj(): Date | null {
    return this.learnedDate ? new Date(this.learnedDate) : null;
  }

  // 復習マーク日をDateオブジェクトで取得
  get markedDateObj(): Date | null {
    return this.markedDate ? new Date(this.markedDate) : null;
  }

  // 学習済みかつ復習マークされているかどうかを判定
  get isLearnedAndMarked(): boolean {
    return this.isLearned && this.isMarkedForReview;
  }

  // 学習頻度の判定（複数回学習された単語）
  get isFrequentlyStudied(): boolean {
    return this.learningSessionCount >= 3;
  }
}