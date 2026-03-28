# TOPIK 道場 - TOPIK 対策専用単語帳アプリ

TOPIK（韓国語能力試験）対策専用の単語帳アプリです。日本人韓国語学習者をターゲットとし、効率的な語彙学習とテスト対策を提供します。

## 📱 アプリ概要

- **対象ユーザー**: 日本人韓国語学習者・TOPIK 受験予定者
- **プラットフォーム**: Expo (React Native) / iOS・Android
- **データ保存**: 全データアプリ内蔵方式（約 400MB）
- **語彙数**: 全級合計 12,000 語、1,180 ユニット

## 🎯 主要機能

### 学習モード

- カード形式での語彙学習
- 音声再生機能（自動再生 + 手動再生）
- 意味・例文のタップ表示
- 復習対象としてマークする機能

### テストモード

- **リーディングテスト**: 韓国語 → 日本語 4 択
- **リスニングテスト**: 音声 → 日本語 4 択
- 同級の単語からランダム選択肢生成

### 復習モード

- **簡易 SRS システム**: 「覚えた/覚えてない」の 2 択フィードバック
- 間隔制御（1 日後 → 3 日後 → 1 週間後 → 2 週間後など）
- 復習優先度順（忘れやすい単語を先に）

### 成績確認

- リスニング/リーディング正答率表示
- 円グラフによる可視化

## 📊 語彙データ構成

| 級   | 語彙数   | ユニット数   | 備考     |
| ---- | -------- | ------------ | -------- |
| 1 級 | 400 語   | 40 ユニット  | 基礎語彙 |
| 2 級 | 1,400 語 | 140 ユニット | 初級完成 |
| 3 級 | 2,000 語 | 200 ユニット | 中級前半 |
| 4 級 | 2,000 語 | 200 ユニット | 中級後半 |
| 5 級 | 3,000 語 | 300 ユニット | 高級前半 |
| 6 級 | 3,000 語 | 300 ユニット | 高級後半 |

## 📄 技術スタック

- **フレームワーク**: Expo SDK 55 (React Native 0.83.4, React 19.2.0)
- **言語**: TypeScript 5.7.3
- **ナビゲーション**: Expo Router (ファイルベースルーティング)
- **ORM**: Drizzle ORM + expo-sqlite
- **スタイリング**: NativeWind v4 (Tailwind CSS for React Native)
- **音声**: expo-audio
- **通知**: expo-notifications（ローカル通知・バッジ表示）
- **テスト**: Jest (jest-expo) + better-sqlite3

## 🛠️ 開発環境構築

### 前提条件

- Node.js 18 以上
- [Expo 開発環境](https://docs.expo.dev/get-started/set-up-your-environment/)を構築済みであること
- iOS: Xcode (macOS のみ)
- Android: Android Studio

### 初回セットアップ

```bash
# 依存関係をインストール（canary版のため --legacy-peer-deps が必要）
npm install --legacy-peer-deps

# ネイティブプロジェクトを生成（CNG）
npx expo prebuild
```

> **Note**: `ios/` と `android/` ディレクトリは Expo CNG (Continuous Native Generation) で自動生成されます。リポジトリには含まれていません。

### 開発サーバーの起動

```bash
# Expo開発サーバーを起動
npm start
```

### アプリの実行

```bash
# iOS（ネイティブビルド）
npm run ios

# Android（ネイティブビルド）
npm run android
```

### テスト

```bash
npm test
```

### データベース

```bash
# スキーマ変更後にマイグレーションファイル生成
npx drizzle-kit generate

# Drizzle Studio（ブラウザでDB閲覧）
npx drizzle-kit studio

# DBシード（テストデータ投入）
npm run db:seed
```

### 型チェック・Lint

```bash
npm run typecheck
npm run lint
```

## 📁 プロジェクト構造

```
topik-dojo/
├── app/                     # Expo Router 画面定義（ファイルベースルーティング）
│   ├── _layout.tsx         # ルートレイアウト
│   ├── index.tsx           # トップ画面（級選択）
│   └── [grade]/            # 級別ルート
├── src/
│   ├── database/           # Drizzle ORM スキーマ・クエリ
│   ├── screens/            # 画面コンポーネント
│   ├── hooks/              # カスタムフック
│   └── assets/             # 音声ファイル等
├── drizzle/                # Drizzle Kit生成ファイル
├── docs/                   # 設計ドキュメント
│   ├── screens/            # 画面仕様書（全11画面）
│   ├── screen-flows.md     # 画面遷移設計
│   ├── database-design.md  # データベース設計
│   └── srs-system.md       # SRSシステム仕様
├── scripts/                # ユーティリティスクリプト
├── requirements.md         # 要件定義書
└── CLAUDE.md               # 開発ガイドライン
```

## 📋 開発タスク

### 重要な調査事項

1. **TOPIK 語彙リスト取得元の調査** - 信頼できるスクレイピング対象サイトの選定
2. **コンテンツ生成コスト見積り** - 12,000 語の意味・例文・音声生成費用
3. **Anki アルゴリズム詳細調査** - 具体的な SRS 間隔計算方法の研究

## 🔗 参考リンク

- [Expo 公式ドキュメント](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [NativeWind](https://www.nativewind.dev/)
- [TOPIK 公式サイト](https://www.topik.go.kr/)

---

_作成日: 2025/6/13_
_更新日: 2026/3/28 - Expo SDK 55 移行_
