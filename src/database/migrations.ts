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
  ],
});