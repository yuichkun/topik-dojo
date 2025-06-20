# SRS（間隔反復学習）システム仕様書

このドキュメントはTOPIK道場の復習システムに関する唯一の正式な仕様書です。
復習機能に関する全ての実装はこの仕様に従ってください。

## 概要

TOPIK道場では、Anki SM-2アルゴリズムに基づいた簡易SRSシステムを採用しています。
「覚えた/覚えてない」の2択フィードバックで、効率的な復習スケジュールを自動生成します。

## 復習対象となる単語

### 1. テスト間違い問題
リスニング・リーディングテストで間違えた単語は自動的に復習対象に追加されます。

### 2. 学習モードでマークされた単語
学習画面で「復習に追加」ボタンでマークされた単語。テスト間違い時と同じ初期状態でSrsManagementに登録されます。

### 3. SRS間隔到達単語
前回の復習から指定された間隔が経過し、復習予定日（next_review_date）に到達した単語。

## データベース構造

### SRS_MANAGEMENTテーブル
```sql
CREATE TABLE srs_management (
    id TEXT PRIMARY KEY,                -- レコードID（WatermelonDB自動生成）
    word_id TEXT NOT NULL,              -- 単語ID（外部キー）
    mastery_level INTEGER DEFAULT 0,    -- 習得レベル（0-9: 0-8=復習対象, 9=習得完了）
    ease_factor REAL DEFAULT 2.5,      -- 易しさ係数（1.3-4.0）
    next_review_date INTEGER,           -- 次回復習日（UnixTimestamp）
    interval_days INTEGER DEFAULT 1,    -- 復習間隔（日数）
    mistake_count INTEGER DEFAULT 0,    -- 間違い回数
    last_reviewed INTEGER,              -- 最終復習日時（UnixTimestamp）
    created_at INTEGER NOT NULL,        -- 作成日時（UnixTimestamp）
    updated_at INTEGER NOT NULL,        -- 更新日時（UnixTimestamp）
);
```

## SRSアルゴリズム詳細

### 習得レベル（mastery_level）の段階

#### 学習段階（mastery_level 0-2）
固定間隔で復習を行います：
- **Level 0 → 1**: 1日後に復習
- **Level 1 → 2**: 3日後に復習  
- **Level 2 → 3**: 3日後に復習（その後、復習段階へ卒業）

#### 復習段階（mastery_level 3-8）
ease_factorを使用した動的間隔で復習：
- **Level 3**: 6日後（卒業初期値・固定）
- **Level 4-8**: `新間隔 = 前回間隔（interval_days） × ease_factor`
- **Level 9**: 習得完了で復習対象外

### フィードバック処理

#### 「覚えた」を選択した場合
```javascript
{
  mastery_level: 現在のレベル + 1,              // 最大9まで（習得完了）
  ease_factor: 現在の値（変更なし）,            // 維持
  interval_days: 新しい間隔,                   // 上記ルールで計算
  next_review_date: 今日 + interval_days,      // 次回復習日
  last_reviewed: 現在時刻
}
```

#### 「覚えてない」を選択した場合
```javascript
{
  mastery_level: Math.max(0, 現在のレベル - 1), // レベル下降
  ease_factor: Math.max(1.3, 現在の値 - 0.2),  // 係数低下
  interval_days: 1,                            // 間隔リセット
  next_review_date: 明日,                      // 1日後に再復習
  mistake_count: 現在の値 + 1,                 // 間違い回数増加
  last_reviewed: 現在時刻
}
```

### 制限値
- **最小ease_factor**: 1.3
- **最大間隔**: 365日（1年）
- **最大mastery_level**: 9

## 復習対象登録処理

### テスト間違い時の処理

### A) 単語が復習リストに未登録の場合
新規SRS_MANAGEMENTレコードを作成：
```javascript
{
  word_id: "間違えた単語ID",
  mastery_level: 0,
  ease_factor: 2.5,
  next_review_date: 明日,
  interval_days: 1,
  mistake_count: 1,
  last_reviewed: null
}
```

### B) 単語が既に復習リストに登録済みの場合
「覚えてない」と同じ処理を適用（上記参照）

### 学習モードでの「復習に追加」処理

#### A) 単語が復習リストに未登録の場合
テスト間違い時と同じ初期状態で新規SRS_MANAGEMENTレコードを作成：
```javascript
{
  word_id: "学習中の単語ID",
  mastery_level: 0,
  ease_factor: 2.5,
  next_review_date: 明日,
  interval_days: 1,
  mistake_count: 0,  // 学習モードでは0からスタート
  last_reviewed: null
}
```

#### B) 単語が既に復習リストに登録済みの場合
学習画面では「○日後に復習予定」と表示し、復習ボタンを非活性化。

## 復習優先度の計算

復習画面での出題順序は以下の要素で決定：

1. **期限超過度**: `(現在日時 - next_review_date) / (24 * 60 * 60 * 1000)`
2. **間違い回数**: `mistake_count * 10`
3. **最終復習からの経過日数**: `(現在日時 - last_reviewed) / (24 * 60 * 60 * 1000)`

```javascript
priority_score = 期限超過度 * 100 + 間違い回数 * 10 + 経過日数
```

## 実装例：間隔計算関数

```javascript
function calculateNextInterval(srsData) {
  const { mastery_level, ease_factor, interval_days } = srsData;
  
  // 学習段階（0-2）は固定間隔
  if (mastery_level === 0) return 1;
  if (mastery_level === 1) return 3;
  if (mastery_level === 2) return 3;
  
  // 復習段階（3以降）
  if (mastery_level === 3) return 6; // 卒業初期値
  
  // Level 4-8はease_factor計算
  const newInterval = Math.round(interval_days * ease_factor);
  return Math.min(newInterval, 365); // 最大365日
}
```

## 具体的なシナリオ例

### シナリオ：新規単語の学習過程

| 日付 | イベント | Level | ease_factor | 間隔 | 次回復習 |
|------|----------|-------|-------------|------|----------|
| 6/20 | テスト間違い | 0 | 2.5 | 1日 | 6/21 |
| 6/21 | 復習「覚えた」 | 1 | 2.5 | 3日 | 6/24 |
| 6/24 | 復習「覚えた」 | 2 | 2.5 | 3日 | 6/27 |
| 6/27 | 復習「覚えた」 | 3 | 2.5 | 6日 | 7/3 |
| 7/3 | 復習「覚えた」 | 4 | 2.5 | 15日 | 7/18 |
| 7/18 | 復習「覚えた」 | 5 | 2.5 | 38日 | 8/25 |

このように、順調に覚えていけば復習間隔が指数関数的に延長され、効率的な学習が可能になります。

---
*最終更新: 2025/06/20*