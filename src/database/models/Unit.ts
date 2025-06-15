import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import type Word from './Word';

export default class Unit extends Model {
  static table = TableName.UNITS;

  @field('grade') grade!: number;
  @field('unit_number') unitNumber!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('words') words!: Word[];

  // 表示名を生成するヘルパーメソッド
  get displayName(): string {
    const start = (this.unitNumber - 1) * 10 + 1;
    const end = this.unitNumber * 10;
    return `${start}-${end}`;
  }

  // ユニット内の単語数を取得
  get wordCount(): number {
    return this.words.length;
  }
}