# データベース設計

## 概要
TOPIK道場アプリのSQLiteデータベース設計

**重要**: このデータベースはクライアント（アプリ）内蔵型です。サーバーレス構成のため、全データはアプリに内蔵されたSQLiteデータベースで管理されます。

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
        integer word_id PK "単語ID"
        string korean "韓国語"
        string japanese "日本語訳"
        string example_korean "韓国語例文"
        string example_japanese "日本語例文"
        integer grade "級(1-6)"
        string part_of_speech "品詞"
        datetime created_at "作成日時"
    }
    
    
    %% 学習状況テーブル
    LEARNING_STATUS {
        integer status_id PK "ステータスID"
        integer word_id FK "単語ID"
        boolean is_learned "学習済みフラグ"
        boolean is_marked_for_review "復習マーク"
        datetime learned_date "学習完了日時"
        datetime marked_date "復習マーク日時"
        integer learning_session_count "学習セッション回数"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }
    
    
    %% SRS管理テーブル
    SRS_MANAGEMENT {
        integer word_id PK "単語ID"
        integer mastery_level "習得レベル(0-5)"
        datetime next_review_date "次回復習日"
        integer interval_days "復習間隔(日)"
        integer mistake_count "間違い回数"
        datetime last_reviewed "最終復習日時"
        string status "学習状態"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }
    
    %% 学習進捗テーブル
    LEARNING_PROGRESS {
        integer progress_id PK "進捗ID"
        date progress_date "進捗日付"
        integer grade "級"
        integer mastered_words_count "習得単語数"
        integer total_words_count "総単語数"
        decimal progress_rate "進捗率(%)"
        datetime created_at "作成日時"
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
        datetime test_date "テスト実施日時"
        datetime created_at "作成日時"
    }
    
    %% テスト問題詳細テーブル
    TEST_QUESTIONS {
        integer question_id PK "問題ID"
        integer test_id FK "テストID"
        integer word_id FK "単語ID"
        boolean is_correct "正解フラグ"
        string user_answer "ユーザー回答"
        string correct_answer "正解"
        integer response_time_ms "回答時間(ms)"
        datetime created_at "作成日時"
    }
    
    %% 復習履歴テーブル
    REVIEW_HISTORY {
        integer review_id PK "復習ID"
        integer word_id FK "単語ID"
        string feedback "覚えた/覚えてない"
        integer previous_mastery_level "変更前習得レベル"
        integer new_mastery_level "変更後習得レベル"
        datetime review_date "復習日時"
        datetime created_at "作成日時"
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
- 単語音声: `audio/words/{word_id}.mp3`
- 例文音声: `audio/examples/{word_id}.mp3`

```sql
CREATE TABLE words (
    word_id INTEGER PRIMARY KEY,        -- 単語ID（1-12000の連番）
    korean TEXT NOT NULL,               -- 韓国語単語
    japanese TEXT NOT NULL,             -- 日本語訳
    example_korean TEXT,                -- 韓国語例文
    example_japanese TEXT,              -- 日本語例文
    grade INTEGER NOT NULL,             -- 級（1-6）
    part_of_speech TEXT,                -- 品詞（名詞、動詞等）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**ユニット計算式:**
- `unit = CEIL(word_id / 10)` （例：word_id=25 → unit=3）
- `unit_position = ((word_id - 1) % 10) + 1` （例：word_id=25 → 5番目）

### 2. SRS_MANAGEMENT（SRS管理テーブル）
各単語のSRS（間隔反復学習）データを管理

```sql
CREATE TABLE srs_management (
    word_id INTEGER PRIMARY KEY,        -- 単語ID（外部キー）
    mastery_level INTEGER DEFAULT 0,    -- 習得レベル（0-5）
    next_review_date DATETIME,          -- 次回復習日
    interval_days INTEGER DEFAULT 1,    -- 復習間隔（日数）
    mistake_count INTEGER DEFAULT 0,    -- 間違い回数
    last_reviewed DATETIME,             -- 最終復習日時
    status TEXT DEFAULT 'learning',     -- 学習状態（learning/mastered）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(word_id)
);
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    test_date DATETIME NOT NULL,        -- テスト実施日時
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5. TEST_QUESTIONS（テスト問題詳細テーブル）
テスト内の各問題の詳細結果を記録

```sql
CREATE TABLE test_questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 問題ID（自動増分）
    test_id INTEGER NOT NULL,           -- テストID（外部キー）
    word_id INTEGER NOT NULL,           -- 単語ID（外部キー）
    is_correct BOOLEAN NOT NULL,        -- 正解フラグ
    user_answer TEXT,                   -- ユーザーの回答
    correct_answer TEXT NOT NULL,       -- 正解
    response_time_ms INTEGER,           -- 回答時間（ミリ秒）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES test_results(test_id),
    FOREIGN KEY (word_id) REFERENCES words(word_id)
);
```

### 6. REVIEW_HISTORY（復習履歴テーブル）
復習セッションでの個別単語フィードバックを記録

```sql
CREATE TABLE review_history (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 復習ID（自動増分）
    word_id INTEGER NOT NULL,           -- 単語ID（外部キー）
    feedback TEXT NOT NULL,             -- フィードバック（remembered/forgotten）
    previous_mastery_level INTEGER,     -- 変更前習得レベル
    new_mastery_level INTEGER,          -- 変更後習得レベル
    review_date DATETIME NOT NULL,      -- 復習実施日時
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(word_id)
);
```

### 7. LEARNING_STATUS（学習状況テーブル）
学習画面での単語別学習状況を管理

```sql
CREATE TABLE learning_status (
    word_id INTEGER PRIMARY KEY,        -- 単語ID（主キー兼外部キー）
    is_learned BOOLEAN DEFAULT FALSE,   -- 学習済みフラグ
    is_marked_for_review BOOLEAN DEFAULT FALSE,  -- 復習マーク
    learned_date DATETIME,              -- 学習完了日時
    marked_date DATETIME,               -- 復習マーク日時
    learning_session_count INTEGER DEFAULT 0,  -- 学習セッション回数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(word_id)
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
-- 指定ユニットの単語を取得（word_idの範囲で計算）
SELECT *
FROM words
WHERE word_id BETWEEN (3-1)*10+1 AND 3*10  -- ユニット3の例：21-30
  AND grade = 3
ORDER BY word_id;
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
  AND word_id != 123  -- 正解単語のword_id
ORDER BY RANDOM()
LIMIT 3;
```

---
*作成日: 2025/6/13*