import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Version 2: UNITSテーブル追加とWORDSテーブル修正
    {
      toVersion: 2,
      steps: [
        // 1. UNITSテーブルを作成
        createTable({
          name: 'units',
          columns: [
            { name: 'grade', type: 'number' },
            { name: 'unit_number', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        
        // 2. WORDSテーブルに新しいカラムを追加
        addColumns({
          table: 'words',
          columns: [
            { name: 'unit_id', type: 'string' },
            { name: 'unit_order', type: 'number' },
          ],
        }),
      ],
    },
    
    // Version 3: WORD_MASTERYテーブル追加とLEARNING_PROGRESSテーブル修正
    {
      toVersion: 3,
      steps: [
        // 1. WORD_MASTERYテーブルを作成
        createTable({
          name: 'word_mastery',
          columns: [
            { name: 'word_id', type: 'string' },
            { name: 'test_type', type: 'string' },
            { name: 'mastered_date', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});