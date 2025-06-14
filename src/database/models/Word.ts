import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Word extends Model {
  static table = 'words';

  @field('korean') korean!: string;
  @field('japanese') japanese!: string;
  @field('example_korean') exampleKorean?: string;
  @field('example_japanese') exampleJapanese?: string;
  @field('grade') grade!: number;
  @field('grade_word_number') gradeWordNumber!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // ユニット番号を計算するヘルパーメソッド
  get unitNumber(): number {
    return Math.ceil(this.gradeWordNumber / 10);
  }

  // ユニット内での位置を取得
  get positionInUnit(): number {
    return ((this.gradeWordNumber - 1) % 10) + 1;
  }

  // 音声ファイルパスを取得
  get wordAudioPath(): string {
    return `audio/words/${this.id}.mp3`;
  }

  get exampleAudioPath(): string {
    return `audio/examples/${this.id}.mp3`;
  }
}