// テーブル名の定数定義（型安全性向上）
export enum TableName {
  WORDS = 'words',
  SRS_MANAGEMENT = 'srs_management',
  CATEGORIES = 'categories',
  WORD_CATEGORIES = 'word_categories',
  STUDY_SESSIONS = 'study_sessions',
  TEST_RESULTS = 'test_results',
  SETTINGS = 'settings',
}

// データベース設定の定数定義
export const DATABASE_CONFIG = {
  name: 'TopikDojo',
  testName: ':memory:',
} as const;