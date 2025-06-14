# データベース設計

## 概要
TOPIK道場アプリのSQLiteデータベース設計

**重要**: このデータベースはクライアント（アプリ）内蔵型です。サーバーレス構成のため、全データはアプリに内蔵されたSQLiteデータベースで管理されます。

**ORM**: WatermelonDB を使用して大量データ（12,000語）の高速処理とReact Nativeでの最適なパフォーマンスを実現します。WatermelonDBは内部でSQLiteを使用するため、基本的なテーブル設計・ER図を活用できます。

**WatermelonDB実装パターン**:
- **主キー**: すべてのテーブルで自動生成される`id`（TEXT型）を使用
- **外部キー**: `word_id`等の参照フィールドもTEXT型で統一
- **日時データ**: DATETIMEではなくUnixTimestamp（INTEGER型）で保存
- **1:1関係**: 外部キーフィールド + `@relation`デコレータで実装
- **自動フィールド**: `created_at`, `updated_at`は全テーブルで自動管理

**パフォーマンス最適化**: 現在はパフォーマンス最適化（インデックス追加等）は考慮しない。基本的なDB設計のみを行い、必要に応じて後から最適化を検討する。

## ユースケース

### 統合ユースケース

#### 1. SRS復習システム
**機能概要:** 簡易SRSアルゴリズムによる復習管理  
**関連画面:** 01-top.md（復習対象数表示）, 11-review.md（SRS実行・更新）  
**データ操作:**
- 読み取り: 本日復習すべき単語数の算出
- 読み取り: 復習対象単語の一覧取得
- 読み取り: 各単語のSRS管理データ取得
- 書き込み: SRS管理データの更新（習得レベル・次回復習日・間違い回数など）
- 書き込み: 復習セッション履歴の記録

#### 2. 語彙データ管理
**機能概要:** 12,000語の語彙データの管理・取得  
**関連画面:** 03-unit-selection.md（ユニット構成取得）, 05-listening-unit-selection.md（ユニット構成取得）, 06-reading-unit-selection.md（ユニット構成取得）, 07-learning.md（単語詳細データ取得）, 08-listening-test.md（テスト用単語データ・選択肢生成）, 09-reading-test.md（テスト用単語データ・選択肢生成）, 11-review.md（復習用単語詳細データ取得）  
**データ操作:**
- 読み取り: 各級のユニット数・構成情報の取得
- 読み取り: 指定ユニットの単語詳細データ（韓国語・日本語・例文・音声ファイル情報）
- 読み取り: 間違い選択肢生成用の同級語彙データ取得（ランダム）
- 読み取り: 級別総語彙数取得（進捗率計算用）

#### 3. 学習進捗管理
**機能概要:** ユーザーの学習状況・テスト結果の記録  
**関連画面:** 07-learning.md（学習進捗記録・取得）, 11-review.md（学習進捗履歴更新）  
**データ操作:**
- 読み取り: ユーザーの学習進捗状況取得
- 書き込み: 学習完了状況の保存
- 書き込み: 復習マークされた単語の記録
- 書き込み: 学習履歴の記録
- 書き込み: 学習進捗履歴の更新（日別・級別）

#### 4. テスト結果管理
**機能概要:** リスニング・リーディングテストの結果記録・統計  
**関連画面:** 08-listening-test.md（リスニングテスト結果記録）, 09-reading-test.md（リーディングテスト結果記録）, 10-results.md（テスト結果統計表示）  
**データ操作:**
- 書き込み: テスト結果（問題別詳細 + 全体スコア）の保存
- 書き込み: テスト履歴（日時、スコア、所要時間）の記録
- 書き込み: 間違えた問題の記録（復習用）
- 読み取り: 指定級の全テスト結果データ取得
- 読み取り: テスト結果履歴データの取得
- 書き込み: 進捗スナップショットの保存
- 読み取り: 進捗スナップショットの取得

## ER図

```mermaid
erDiagram
    %% 語彙マスターテーブル
    WORDS {
        string id PK "単語ID"
        string korean "韓国語"
        string japanese "日本語訳"
        string example_korean "韓国語例文"
        string example_japanese "日本語例文"
        integer grade "級(1-6)"
        integer grade_word_number "級内通し番号"
        integer created_at "作成日時"
        integer updated_at "更新日時"
    }
    
    
    %% 学習状況テーブル
    LEARNING_STATUS {
        integer status_id PK "ステータスID"
        string word_id FK "単語ID"
        boolean is_learned "学習済みフラグ"
        boolean is_marked_for_review "復習マーク"
        integer learned_date "学習完了日時"
        integer marked_date "復習マーク日時"
        integer learning_session_count "学習セッション回数"
        integer created_at "作成日時"
        integer updated_at "更新日時"
    }
    
    
    %% SRS管理テーブル
    SRS_MANAGEMENT {
        string id PK "レコードID"
        string word_id FK "単語ID"
        integer mastery_level "習得レベル(0-9)"
        real ease_factor "易しさ係数"
        integer next_review_date "次回復習日"
        integer interval_days "復習間隔(日)"
        integer mistake_count "間違い回数"
        integer last_reviewed "最終復習日時"
        string status "学習状態"
        integer created_at "作成日時"
        integer updated_at "更新日時"
    }
    
    %% 学習進捗テーブル
    LEARNING_PROGRESS {
        integer progress_id PK "進捗ID"
        date progress_date "進捗日付"
        integer grade "級"
        integer mastered_words_count "習得単語数"
        integer total_words_count "総単語数"
        decimal progress_rate "進捗率(%)"
        integer created_at "作成日時"
    }
    
    %% テスト結果テーブル
    TEST_RESULTS {
        integer test_id PK "テストID"
        integer grade "級"
        integer unit "ユニット"
        string test_type "リスニング/リーディング"
        integer correct_answers "正解数"
        integer total_questions "総問題数"
        decimal accuracy_rate "正答率(%)"
        integer duration_seconds "所要時間(秒)"
        integer test_date "テスト実施日時"
        integer created_at "作成日時"
    }
    
    %% テスト問題詳細テーブル
    TEST_QUESTIONS {
        integer question_id PK "問題ID"
        integer test_id FK "テストID"
        string word_id FK "単語ID"
        boolean is_correct "正解フラグ"
        string user_answer "ユーザー回答"
        string correct_answer "正解"
        integer response_time_ms "回答時間(ms)"
        integer created_at "作成日時"
    }
    
    %% 復習履歴テーブル
    REVIEW_HISTORY {
        integer review_id PK "復習ID"
        string word_id FK "単語ID"
        string feedback "覚えた/覚えてない"
        integer previous_mastery_level "変更前習得レベル"
        integer new_mastery_level "変更後習得レベル"
        integer review_date "復習日時"
        integer created_at "作成日時"
    }
    
    %% リレーション
    WORDS ||--|| SRS_MANAGEMENT : "1対1"
    WORDS ||--|| LEARNING_STATUS : "1対1"
    WORDS ||--o{ TEST_QUESTIONS : "1対多"
    WORDS ||--o{ REVIEW_HISTORY : "1対多"
    TEST_RESULTS ||--o{ TEST_QUESTIONS : "1対多"
```

## テーブル設計

### 1. WORDS（語彙マスターテーブル）
全12,000語の語彙データを格納する中核テーブル

**音声ファイル**: DBに保存せず、一定のルールで命名・読み込み
- 単語音声: `audio/words/{id}.mp3`
- 例文音声: `audio/examples/{id}.mp3`

```sql
CREATE TABLE words (
    id TEXT PRIMARY KEY,                -- 単語ID（WatermelonDB自動生成）
    korean TEXT NOT NULL,               -- 韓国語単語
    japanese TEXT NOT NULL,             -- 日本語訳
    example_korean TEXT,                -- 韓国語例文
    example_japanese TEXT,              -- 日本語例文
    grade INTEGER NOT NULL,             -- 級（1-6）
    grade_word_number INTEGER NOT NULL, -- 級内通し番号（1から開始）
    created_at INTEGER NOT NULL,        -- 作成日時（UnixTimestamp）
    updated_at INTEGER NOT NULL         -- 更新日時（UnixTimestamp）
);
```

**ユニット計算式:**
- `級内ユニット番号 = CEIL(grade_word_number / 10)` （例：grade_word_number=25 → ユニット3）
- `ユニット内位置 = ((grade_word_number - 1) % 10) + 1` （例：grade_word_number=25 → 5番目）

**データ例:**
- id="word_001", grade=1, grade_word_number=1 （1級1番目）
- id="word_401", grade=2, grade_word_number=1 （2級1番目）

### 2. SRS_MANAGEMENT（SRS管理テーブル）
各単語のSRS（間隔反復学習）データを管理

```sql
CREATE TABLE srs_management (
    id TEXT PRIMARY KEY,                -- レコードID（WatermelonDB自動生成）
    word_id TEXT NOT NULL,              -- 単語ID（外部キー）
    mastery_level INTEGER DEFAULT 0,    -- 習得レベル（0-9: 学習段階0-2, 復習段階3-9）
    ease_factor REAL DEFAULT 2.5,      -- 易しさ係数（1.3-4.0, デフォルト2.5）
    next_review_date INTEGER,           -- 次回復習日（UnixTimestamp）
    interval_days INTEGER DEFAULT 1,    -- 復習間隔（日数）
    mistake_count INTEGER DEFAULT 0,    -- 間違い回数
    last_reviewed INTEGER,              -- 最終復習日時（UnixTimestamp）
    status TEXT DEFAULT 'learning',     -- 学習状態（learning/graduated/mastered）
    created_at INTEGER NOT NULL,        -- 作成日時（UnixTimestamp）
    updated_at INTEGER NOT NULL,        -- 更新日時（UnixTimestamp）
    FOREIGN KEY (word_id) REFERENCES words(id)
);
```

**SRS間隔アルゴリズム（Anki SM-2準拠）:**

**学習段階（mastery_level 0-2）:**
- Level 0 → 1: 1日後
- Level 1 → 2: 3日後  
- Level 2 → 3: 卒業して復習段階へ

**復習段階（mastery_level 3-9）:**
- 基本計算式: `新間隔 = 前回間隔 × ease_factor`
- Level 3: 6日後（卒業初期値）
- Level 4以降: ease_factorによる自動調整

**フィードバック反映:**
- **覚えてない**: mastery_level-1, ease_factor-0.2, 間隔リセット
- **覚えた**: mastery_level+1, ease_factor維持, 間隔延長

**制限値:**
- 最小ease_factor: 1.3
- 最大間隔: 365日（1年）
- 最大mastery_level: 9（実質無制限習得）

**具体例（ease_factor=2.5の場合）:**
```
Level 3: 6日 → Level 4: 15日 → Level 5: 38日 
→ Level 6: 95日 → Level 7: 238日 → Level 8: 365日（上限）
```

### 3. LEARNING_PROGRESS（学習進捗テーブル）
日別・級別の学習進捗スナップショットを保存

```sql
CREATE TABLE learning_progress (
    progress_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 進捗ID（自動増分）
    progress_date DATE NOT NULL,        -- 進捗記録日
    grade INTEGER NOT NULL,             -- 級（1-6）
    mastered_words_count INTEGER DEFAULT 0,  -- 習得済み単語数
    total_words_count INTEGER NOT NULL, -- その級の総単語数
    progress_rate DECIMAL(5,2) DEFAULT 0,    -- 進捗率（%）
    created_at INTEGER NOT NULL,
    UNIQUE(progress_date, grade)        -- 日付+級の組み合わせでユニーク
);
```

### 4. TEST_RESULTS（テスト結果テーブル）
テストセッションの全体結果を記録

```sql
CREATE TABLE test_results (
    test_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- テストID（自動増分）
    grade INTEGER NOT NULL,             -- 級
    unit INTEGER NOT NULL,              -- ユニット
    test_type TEXT NOT NULL,            -- テスト種別（listening/reading）
    correct_answers INTEGER NOT NULL,   -- 正解数
    total_questions INTEGER NOT NULL,   -- 総問題数
    accuracy_rate DECIMAL(5,2),         -- 正答率（%）
    duration_seconds INTEGER,           -- 所要時間（秒）
    test_date INTEGER NOT NULL,        -- テスト実施日時
    created_at INTEGER NOT NULL
);
```

### 5. TEST_QUESTIONS（テスト問題詳細テーブル）
テスト内の各問題の詳細結果を記録

```sql
CREATE TABLE test_questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 問題ID（自動増分）
    test_id INTEGER NOT NULL,           -- テストID（外部キー）
    word_id TEXT NOT NULL,           -- 単語ID（外部キー）
    is_correct BOOLEAN NOT NULL,        -- 正解フラグ
    user_answer TEXT,                   -- ユーザーの回答
    correct_answer TEXT NOT NULL,       -- 正解
    response_time_ms INTEGER,           -- 回答時間（ミリ秒）
    created_at INTEGER NOT NULL,
    FOREIGN KEY (test_id) REFERENCES test_results(test_id),
    FOREIGN KEY (word_id) REFERENCES words(id)
);
```

### 6. REVIEW_HISTORY（復習履歴テーブル）
復習セッションでの個別単語フィードバックを記録

```sql
CREATE TABLE review_history (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 復習ID（自動増分）
    word_id TEXT NOT NULL,           -- 単語ID（外部キー）
    feedback TEXT NOT NULL,             -- フィードバック（remembered/forgotten）
    previous_mastery_level INTEGER,     -- 変更前習得レベル
    new_mastery_level INTEGER,          -- 変更後習得レベル
    review_date INTEGER NOT NULL,      -- 復習実施日時
    created_at INTEGER NOT NULL,
    FOREIGN KEY (word_id) REFERENCES words(id)
);
```

### 7. LEARNING_STATUS（学習状況テーブル）
学習画面での単語別学習状況を管理

```sql
CREATE TABLE learning_status (
    word_id TEXT PRIMARY KEY,        -- 単語ID（主キー兼外部キー）
    is_learned BOOLEAN DEFAULT FALSE,   -- 学習済みフラグ
    is_marked_for_review BOOLEAN DEFAULT FALSE,  -- 復習マーク
    learned_date INTEGER,              -- 学習完了日時
    marked_date INTEGER,               -- 復習マーク日時
    learning_session_count INTEGER DEFAULT 0,  -- 学習セッション回数
    created_at INTEGER NOT NULL,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id)
);
```


## 設計の考慮点

### データ整合性
- **外部キー制約**: 参照整合性を保証
- **UNIQUE制約**: 重複防止（learning_progressの日付+級など）
- **CHECK制約**: 値の妥当性確保（gradeは1-6、mastery_levelは0-5など）

### スケーラビリティ
- **INTEGER主キー**: 高速アクセスと省容量
- **タイムスタンプ**: 作成日時・更新日時を記録してデータ追跡可能
- **論理削除**: 物理削除ではなく論理削除でデータ履歴保持

### クエリ例

#### 1. 本日の復習対象取得
```sql
SELECT w.*, s.mastery_level, s.mistake_count
FROM words w
JOIN srs_management s ON w.word_id = s.word_id
WHERE s.next_review_date <= DATE('now')
  AND s.status = 'learning'
ORDER BY s.next_review_date ASC, s.mistake_count DESC
LIMIT 50;
```

#### 2. 級別進捗率取得
```sql
SELECT 
    progress_date,
    progress_rate,
    mastered_words_count,
    total_words_count
FROM learning_progress
WHERE grade = 3
ORDER BY progress_date DESC
LIMIT 30;
```

#### 3. テスト結果統計
```sql
SELECT 
    test_type,
    AVG(accuracy_rate) as avg_accuracy,
    COUNT(*) as test_count
FROM test_results
WHERE grade = 3
  AND test_date >= DATE('now', '-30 days')
GROUP BY test_type;
```

#### 4. ユニット単語取得
```sql
-- 指定ユニットの単語を取得（級内通し番号で計算）
SELECT *
FROM words
WHERE grade = 3
  AND grade_word_number BETWEEN (3-1)*10+1 AND 3*10  -- 3級ユニット3の例：21-30
ORDER BY grade_word_number;
```

#### 5. 復習マーク単語抽出
```sql
SELECT w.*, ls.marked_date
FROM words w
JOIN learning_status ls ON w.word_id = ls.word_id
WHERE ls.is_marked_for_review = TRUE
  AND w.grade = 3
ORDER BY ls.marked_date ASC;
```

#### 6. 間違い選択肢生成（同級ランダム）
```sql
-- 正解単語以外の同級単語からランダムで3つ選択
SELECT japanese
FROM words
WHERE grade = 3
  AND id != 'word_123'  -- 正解単語のid
ORDER BY RANDOM()
LIMIT 3;
```

---
*作成日: 2025/6/13*