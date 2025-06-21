import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 3,
  tables: [
    // ユニットテーブル
    tableSchema({
      name: 'units',
      columns: [
        { name: 'grade', type: 'number' },
        { name: 'unit_number', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // 語彙マスターテーブル
    tableSchema({
      name: 'words',
      columns: [
        { name: 'korean', type: 'string' },
        { name: 'japanese', type: 'string' },
        { name: 'example_korean', type: 'string', isOptional: true },
        { name: 'example_japanese', type: 'string', isOptional: true },
        { name: 'grade', type: 'number' },
        { name: 'unit_id', type: 'string' },
        { name: 'unit_order', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // SRS管理テーブル
    tableSchema({
      name: 'srs_management',
      columns: [
        { name: 'word_id', type: 'string' },
        { name: 'mastery_level', type: 'number' },
        { name: 'ease_factor', type: 'number' },
        { name: 'next_review_date', type: 'number', isOptional: true },
        { name: 'interval_days', type: 'number' },
        { name: 'mistake_count', type: 'number' },
        { name: 'last_reviewed', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),


    // 語彙習得管理テーブル
    tableSchema({
      name: 'word_mastery',
      columns: [
        { name: 'word_id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'mastered_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // 学習進捗テーブル
    tableSchema({
      name: 'learning_progress',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'grade', type: 'number' },
        { name: 'listening_mastered_count', type: 'number' },
        { name: 'reading_mastered_count', type: 'number' },
        { name: 'total_words_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
});