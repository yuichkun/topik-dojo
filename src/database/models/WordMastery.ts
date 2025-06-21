import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import Word from './Word';

export default class WordMastery extends Model {
  static table = TableName.WORD_MASTERY;

  @field('word_id') wordId!: string;
  @field('test_type') testType!: string;
  @field('mastered_date') masteredDate!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation(TableName.WORDS, 'word_id') word!: Relation<Word>;
}