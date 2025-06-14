import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    // 語彙マスターテーブル
    tableSchema({
      name: 'words',
      columns: [
        { name: 'korean', type: 'string' },
        { name: 'japanese', type: 'string' },
        { name: 'example_korean', type: 'string', isOptional: true },
        { name: 'example_japanese', type: 'string', isOptional: true },
        { name: 'grade', type: 'number' },
        { name: 'grade_word_number', type: 'number' },
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
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // 学習状況テーブル
    tableSchema({
      name: 'learning_status',
      columns: [
        { name: 'word_id', type: 'string' },
        { name: 'is_learned', type: 'boolean' },
        { name: 'is_marked_for_review', type: 'boolean' },
        { name: 'learned_date', type: 'number', isOptional: true },
        { name: 'marked_date', type: 'number', isOptional: true },
        { name: 'learning_session_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // テスト結果テーブル
    tableSchema({
      name: 'test_results',
      columns: [
        { name: 'grade', type: 'number' },
        { name: 'unit', type: 'number' },
        { name: 'test_type', type: 'string' },
        { name: 'correct_answers', type: 'number' },
        { name: 'total_questions', type: 'number' },
        { name: 'accuracy_rate', type: 'number' },
        { name: 'duration_seconds', type: 'number', isOptional: true },
        { name: 'test_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // テスト問題詳細テーブル
    tableSchema({
      name: 'test_questions',
      columns: [
        { name: 'test_result_id', type: 'string' },
        { name: 'word_id', type: 'string' },
        { name: 'is_correct', type: 'boolean' },
        { name: 'user_answer', type: 'string', isOptional: true },
        { name: 'correct_answer', type: 'string' },
        { name: 'response_time_ms', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // 復習履歴テーブル
    tableSchema({
      name: 'review_history',
      columns: [
        { name: 'word_id', type: 'string' },
        { name: 'feedback', type: 'string' },
        { name: 'previous_mastery_level', type: 'number', isOptional: true },
        { name: 'new_mastery_level', type: 'number' },
        { name: 'review_date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // 学習進捗テーブル
    tableSchema({
      name: 'learning_progress',
      columns: [
        { name: 'progress_date', type: 'string' },
        { name: 'grade', type: 'number' },
        { name: 'mastered_words_count', type: 'number' },
        { name: 'total_words_count', type: 'number' },
        { name: 'progress_rate', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
});