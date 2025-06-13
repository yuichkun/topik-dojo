# 画面設計 インデックス

## 画面構成

### メイン画面
- **01-top.md** - トップ画面（級選択）
- **02-learning-mode-selection.md** - 学習モード選択画面（学習/テスト/成績）

### 学習系画面
- **03-unit-selection.md** - 学習用ユニット選択画面

### テスト系画面
- **04-test-mode-selection.md** - テストモード選択画面（リスニング/リーディング）
- **05-listening-unit-selection.md** - リスニングテストユニット選択画面

### 未作成画面
- **06-reading-unit-selection.md** - リーディングテストユニット選択画面（未作成）
- **07-learning.md** - 学習画面（未作成）
- **08-listening-test.md** - リスニングテスト画面（未作成）
- **09-reading-test.md** - リーディングテスト画面（未作成）
- **10-results.md** - 成績画面（未作成）
- **11-review.md** - 復習画面（未作成）

## 画面遷移フロー

```
01-top
├── 02-learning-mode-selection
│   ├── 03-unit-selection → 07-learning
│   ├── 04-test-mode-selection
│   │   ├── 05-listening-unit-selection → 08-listening-test
│   │   └── 06-reading-unit-selection → 09-reading-test
│   └── 10-results
└── 11-review
```

## 作成状況

| 画面名 | ファイル名 | 状態 |
|--------|-----------|------|
| トップ | 01-top.md | ✅ 完成 |
| 学習モード選択 | 02-learning-mode-selection.md | ✅ 完成 |
| 学習用ユニット選択 | 03-unit-selection.md | ✅ 完成 |
| テストモード選択 | 04-test-mode-selection.md | ✅ 完成 |
| リスニングユニット選択 | 05-listening-unit-selection.md | ✅ 完成 |
| リーディングユニット選択 | 06-reading-unit-selection.md | ✅ 完成 |
| 学習画面 | 07-learning.md | ✅ 完成 |
| リスニングテスト | 08-listening-test.md | ✅ 完成 |
| リーディングテスト | 09-reading-test.md | ❌ 未作成 |
| 成績画面 | 10-results.md | ❌ 未作成 |
| 復習画面 | 11-review.md | ❌ 未作成 |

---
*更新日: 2025/6/13*