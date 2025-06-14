import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import { modelClasses } from './models';
import { DATABASE_CONFIG } from './constants';

// SQLiteアダプターの設定
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // JSI (JavaScript Interface) を有効化（パフォーマンス向上）
  dbName: DATABASE_CONFIG.name, // データベースファイル名を設定から取得（.dbは自動付与される）
});

// データベースインスタンスの作成
const database = new Database({
  adapter,
  modelClasses,
});

export default database;