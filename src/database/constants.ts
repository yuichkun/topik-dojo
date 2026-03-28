export enum TableName {
  UNITS = 'units',
  WORDS = 'words',
  SRS_MANAGEMENT = 'srs_management',
  LEARNING_STATUS = 'learning_status',
  TEST_RESULTS = 'test_results',
  TEST_QUESTIONS = 'test_questions',
  REVIEW_HISTORY = 'review_history',
  LEARNING_PROGRESS = 'learning_progress',
}

export const DATABASE_CONFIG = {
  name: 'TopikDojo.db',
} as const;
