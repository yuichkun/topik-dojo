import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';

export default class LearningProgress extends Model {
  static table = TableName.LEARNING_PROGRESS;

  @field('date') date!: string;
  @field('grade') grade!: number;
  @field('listening_mastered_count') listeningMasteredCount!: number;
  @field('reading_mastered_count') readingMasteredCount!: number;
  @field('total_words_count') totalWordsCount!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}