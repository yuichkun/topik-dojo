# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOPIK 道場は、日本人韓国語学習者向けの TOPIK（韓国語能力試験）対策専用単語帳アプリです。Expo (React Native) で開発し、全語彙データ（約 12,000 語）をアプリに内蔵します。

## Important Rules

**質問は 1 度に必ず 1 つだけ行う** - 複数の質問を同時にせず、一つずつ丁寧に議論する

**絶対に推測で要件を追加しない** - 明示的に指示されていない機能や仕様を勝手に追加することを禁止する。既存の要件や仕様書に明記されている内容のみを実装し、不明な点があれば必ず確認を求める。

## 🚨 作業開始時の必読ファイル

**Claude Code でこのプロジェクトの作業を開始する際は、必ず以下のファイルを最初に読み込んでプロジェクト全体像を把握すること:**

1. **詳細仕様**: `requirements.md` - プロジェクトの基本要件・仕様
2. **画面遷移**: `docs/screen-flows.md` - 全体的な画面フロー・シーケンス
3. **各画面仕様書**: `docs/screens/` - 各画面の詳細設計（全 11 画面完成）
4. **データベース設計**: `docs/database-design.md` - SQLite データベース設計・ER 図
5. **SRS システム**: `docs/srs-system.md` - 復習システムの詳細仕様（単一の正式仕様）

**注意**: `docs/original-materials/memo.md` は初期の原案であり、現在の正式な仕様ではない

## 画面設計完成状況

全 11 画面の設計が完了：

- **01-top.md** - トップ画面（級選択）
- **02-learning-mode-selection.md** - 学習モード選択画面
- **03-unit-selection.md** - 学習用ユニット選択画面
- **04-test-mode-selection.md** - テストモード選択画面
- **test-unit-selection.md** - テストユニット選択画面（読解/聴解統合）
- **07-learning.md** - 学習画面
- **08-listening-test.md** - リスニングテスト画面
- **09-reading-test.md** - リーディングテスト画面
- **10-results.md** - 成績確認画面
- **11-review.md** - 復習画面

## Key Requirements

- **フレームワーク**: Expo SDK 55 (React Native 0.83.4, React 19.2.0)
- **言語**: TypeScript 5.7.3
- **ナビゲーション**: Expo Router (ファイルベースルーティング)
- **ORM**: Drizzle ORM + expo-sqlite
- **スタイリング**: NativeWind v4 (Tailwind CSS for React Native)
- **音声**: expo-audio
- **通知**: expo-notifications（ローカル通知・バッジ表示）
- **データ保存**: 全データアプリ内蔵（約 400MB）
- **ターゲット**: 日本人 TOPIK 受験者
- **語彙数**: 全級合計 12,000 語、1,180 ユニット
- **復習システム**: 簡易 SRS（覚えた/覚えてない 2 択）
- **マネタイズ**: 広告収入検討中

## Pending Tasks

### 【重要】要調査事項

1. **TOPIK 語彙リスト取得元の調査** - 信頼できるスクレイピング対象サイトの選定
2. **コンテンツ生成コスト見積り** - 12,000 語の意味・例文・音声生成費用
3. **Anki アルゴリズム詳細調査** - 具体的な SRS 間隔計算方法の研究

## Project Structure

```
topik-dojo/
├── app/                     # Expo Router 画面定義（ファイルベースルーティング）
│   ├── _layout.tsx         # ルートレイアウト
│   ├── index.tsx           # トップ画面（級選択）
│   └── [grade]/            # 級別ルート
│       ├── _layout.tsx     # 級レイアウト
│       ├── learning/       # 学習モード
│       │   ├── index.tsx   # 学習モード選択
│       │   ├── units.tsx   # ユニット選択
│       │   └── [unitId].tsx # 学習画面
│       ├── test/           # テストモード
│       │   ├── index.tsx   # テストモード選択
│       │   ├── units.tsx   # テストユニット選択
│       │   ├── listening/[unitId].tsx  # リスニングテスト
│       │   └── reading/[unitId].tsx    # リーディングテスト
│       └── review.tsx      # 復習画面
├── src/
│   ├── database/
│   │   ├── schema.ts       # Drizzle ORMスキーマ定義
│   │   ├── client.ts       # 本番用DBクライアント (expo-sqlite)
│   │   ├── test-client.ts  # テスト用DBクライアント (better-sqlite3)
│   │   ├── migrations.ts   # マイグレーション
│   │   ├── constants.ts    # DB定数
│   │   ├── models/         # モデルヘルパー
│   │   └── queries/        # クエリ関数
│   ├── screens/            # 画面コンポーネント（ロジック）
│   ├── hooks/              # カスタムフック
│   └── assets/             # 音声ファイル等
├── drizzle/                # Drizzle Kit生成ファイル
├── docs/                   # 設計ドキュメント
│   ├── screens/            # 画面仕様書（全11画面）
│   ├── screen-flows.md     # 画面遷移設計
│   ├── database-design.md  # データベース設計
│   └── srs-system.md       # SRSシステム仕様
├── scripts/                # ユーティリティスクリプト
│   └── seed-db.ts          # DBシードスクリプト
├── requirements.md         # 要件定義書
├── CLAUDE.md               # 開発ガイドライン（このファイル）
├── app.json                # Expo設定
├── drizzle.config.ts       # Drizzle Kit設定
├── tailwind.config.js      # Tailwind CSS設定
├── babel.config.js         # Babel設定（NativeWind統合）
├── metro.config.js         # Metro設定（NativeWind統合）
└── global.css              # Tailwindスタイルインポート
```

**注意**: `ios/` と `android/` は `.gitignore` に追加済み。Expo CNG (Continuous Native Generation) により `npx expo prebuild` で自動生成されるため、リポジトリには含めない。

## Development Commands

### テスト実行

```bash
npm test
```

#### テスト作成時の重要ルール

**データベースを絶対にモックしない** - テスト環境では `better-sqlite3` + Drizzle ORM を使用し、テスト DB が毎回 cleanup されるようにセットアップしてある。DB クエリやスキーマをモック化せず、実際のデータベース操作をテストに含める。テストプリセットは `jest-expo` を使用。

### アプリ起動

```bash
# iOS（ネイティブビルド）
npm run ios          # = expo run:ios

# Android（ネイティブビルド）
npm run android      # = expo run:android

# Expo開発サーバー
npm start            # = expo start
```

### ネイティブプロジェクト生成（CNG）

```bash
# ios/ と android/ を生成（初回 or ネイティブ設定変更時）
npx expo prebuild

# クリーンビルド（ネイティブディレクトリを再生成）
npx expo prebuild --clean
```

### データベース（Drizzle Kit）

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
npm run typecheck    # = tsc --noEmit
npm run lint         # = eslint .
```

### スタイリング（NativeWind v4）

このプロジェクトでは Tailwind CSS を React Native で使用できる NativeWind v4 を採用しています。

#### 基本的な使い方

```jsx
// className プロパティでTailwindクラスを指定
<View className="flex-1 bg-white p-4">
  <Text className="text-xl font-bold text-gray-800">テキスト</Text>
  <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
    <Text className="text-white font-semibold">ボタン</Text>
  </TouchableOpacity>
</View>
```

#### 条件付きスタイル

```jsx
<TouchableOpacity
  className={`
    px-4 py-2 rounded-lg
    ${isActive ? 'bg-blue-500' : 'bg-gray-300'}
  `}
>
```

#### 重要な設定ファイル

- `tailwind.config.js` - Tailwind 設定（`nativewind/preset` 使用）
- `global.css` - Tailwind スタイルのインポート
- `babel.config.js` - `babel-preset-expo` + `nativewind/babel` プリセット
- `metro.config.js` - `withNativeWind` で Metro 統合

#### 開発時の注意点

- スタイル変更後は Metro bundler の再起動が必要な場合があります
- `npx expo start --clear` でキャッシュをクリアして再起動
- テスト環境では `jest.config.js` で CSS import をモック化済み

### npm インストール時の注意

```bash
# Expo SDK 55 canary版のため --legacy-peer-deps が必要
npm install --legacy-peer-deps
```

---

_Created: 2025/6/13_
_Updated: 2026/3/28 - Expo SDK 55 移行_
