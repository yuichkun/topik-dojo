// テーブル名の定数定義（型安全性向上）
export enum TableName {
  UNITS = 'units',
  WORDS = 'words',
  SRS_MANAGEMENT = 'srs_management',
  WORD_MASTERY = 'word_mastery',
  LEARNING_PROGRESS = 'learning_progress',
}

// データベース設定の定数定義
export const DATABASE_CONFIG = {
  name: 'TopikDojo',
  testName: ':memory:',
} as const;