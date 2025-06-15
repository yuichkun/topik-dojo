import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { TableName } from '../constants';
import type Unit from './Unit';

export default class Word extends Model {
  static table = TableName.WORDS;

  @field('korean') korean!: string;
  @field('japanese') japanese!: string;
  @field('example_korean') exampleKorean?: string;
  @field('example_japanese') exampleJapanese?: string;
  @field('grade') grade!: number;
  @field('unit_id') unitId!: string;
  @field('unit_order') unitOrder!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('units', 'unit_id') unit!: Unit;

  // 音声ファイルパスを取得
  get wordAudioPath(): string {
    return `audio/words/${this.id}.mp3`;
  }

  get exampleAudioPath(): string {
    return `audio/examples/${this.id}.mp3`;
  }
}