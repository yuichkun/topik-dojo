# 画面遷移・シーケンス設計

## 全体画面フロー

```mermaid
graph TD
    A[トップ画面] --> B[級選択<br/>1級〜6級]
    A --> H[復習]
    B --> C[学習モード選択<br/>学習/テスト/成績]
    C --> D[ユニット選択<br/>1-10, 11-20...]
    C --> E[テストモード選択<br/>リスニング/リーディング]
    C --> F[成績確認<br/>円グラフ表示]
    D --> G[学習画面<br/>단어カード表示]
    E --> I[テストユニット選択]
    I --> J[テスト画面<br/>4択問題]
    J --> K[答え確認画面]
    K --> J
    H --> L[復習画面<br/>SRS優先度順]
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style J fill:#fff3e0
    style L fill:#e8f5e8
```

## 詳細シーケンス

### 1. 学習モードシーケンス

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as アプリ
    participant D as データベース
    participant S as 音声システム
    
    U->>A: 級選択（例：1級）
    U->>A: 学習選択
    U->>A: ユニット選択（例：1-10）
    A->>D: ユニットデータ取得
    D-->>A: 10単語データ返却
    A->>A: 1単語目表示
    A->>S: 単語音声自動再生
    U->>A: 意味タップ
    A->>A: 日本語訳表示
    U->>A: 例文意味タップ
    A->>A: 例文日本語訳表示
    U->>A: マークボタンタップ（オプション）
    A->>D: 復習対象として保存
    U->>A: 次へボタン/スワイプ
    A->>A: 2単語目表示
    Note over A: 10単語完了まで繰り返し
```

### 2. テストモードシーケンス

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as アプリ
    participant D as データベース
    participant Q as 問題生成システム
    
    U->>A: テストモード選択
    U->>A: リーディング/リスニング選択
    U->>A: ユニット選択
    A->>D: ユニットデータ取得
    A->>Q: 4択問題生成
    Q->>Q: ランダム選択肢作成
    Q-->>A: 問題データ返却
    A->>A: 問題表示
    U->>A: 回答選択
    A->>A: 答え確認画面表示
    A->>D: テスト結果保存
    U->>A: 次の問題へ
    Note over A: 10問完了まで繰り返し
    A->>A: テスト結果表示
```

### 3. 復習モードシーケンス

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as アプリ
    participant D as データベース
    participant S as SRSシステム
    
    U->>A: 復習選択
    A->>D: 復習対象データ取得
    A->>S: SRS優先度計算
    S-->>A: 優先度順ソート済みリスト
    A->>A: 最優先単語表示
    A->>A: 音声自動再生
    U->>A: 意味確認
    U->>A: 覚えた/覚えてない選択
    A->>S: フィードバック処理
    S->>S: 次回復習日計算
    S->>D: 復習データ更新
    A->>A: 次の復習単語表示
    Note over A: 復習対象完了まで繰り返し
```

## 戻るボタン・ナビゲーション仕様

### 戻るボタン動作
- **学習画面**: ユニット選択へ
- **テスト画面**: テストユニット選択へ  
- **復習画面**: トップ画面へ
- **その他**: 直前画面へ

### ホームボタン
- 全画面でトップ画面への直接遷移可能

---
*最終更新: 2025/6/13*