# Expo 移行サマリー

bare React Native から Expo SDK 55 への全面移行についてまとめた資料です。

_作成日: 2026/3/28_

---

## 1. 移行概要

### 何が変わったか

bare React Native 0.80.0 プロジェクトを **Expo SDK 55** (React Native 0.83.4, React 19.2.0) に全面移行しました。設定ファイル、データベース層、ナビゲーション、テスト基盤のすべてを作り直しています。

### 移行の背景

- **WatermelonDB の非互換**: React Native 0.80+ の New Architecture に WatermelonDB 0.27.1 が対応しておらず、DB 層の置き換えが必須だった
- **New Architecture 必須化**: RN 0.83 以降は New Architecture がデフォルト。bare プロジェクトでの対応コストが高い
- **Expo CNG の恩恵**: `ios/` / `android/` をリポジトリ管理する必要がなくなり、ネイティブ設定は `app.config.ts` の plugins で一元管理できる
- **開発体験の向上**: Expo Router によるファイルベースルーティング、`expo prebuild` によるネイティブプロジェクト自動生成

### 移行の規模

プロジェクト全体の作り直しに近い規模です。DB 層（WatermelonDB → Drizzle ORM）、ナビゲーション（React Navigation → Expo Router）、音声再生（react-native-sound-player → expo-audio）、テスト基盤（react-native preset → jest-expo + better-sqlite3）をすべて入れ替えました。

---

## 2. 技術スタック変更一覧

| 項目           | Before                     | After                                    |
| -------------- | -------------------------- | ---------------------------------------- |
| フレームワーク | React Native 0.80.0 (bare) | Expo SDK 55 (CNG)                        |
| React          | 19.1.0                     | 19.2.0                                   |
| DB/ORM         | WatermelonDB 0.27.1        | expo-sqlite + Drizzle ORM 0.45.2         |
| ナビゲーション | React Navigation 7.x       | Expo Router (ファイルベースルーティング) |
| 音声再生       | react-native-sound-player  | expo-audio                               |
| スタイリング   | NativeWind v4              | NativeWind v4（変更なし）                |
| テスト         | jest + react-native preset | jest-expo + better-sqlite3               |
| ビルド         | xcodebuild / gradlew 直接  | expo prebuild + native build             |
| TypeScript     | 5.0.4                      | 5.7.3                                    |
| Babel          | @react-native/babel-preset | babel-preset-expo                        |
| 設定ファイル   | app.json                   | app.config.ts (動的設定)                 |

---

## 3. プロジェクト構造の変化

### Before（bare React Native）

```
topik-dojo/
├── ios/                        # Xcode プロジェクト（git管理）
├── android/                    # Android プロジェクト（git管理）
├── App.tsx                     # エントリーポイント
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.tsx    # React Navigation 設定
│   │   └── types.ts           # ナビゲーション型定義
│   ├── constants/
│   │   └── screens.ts         # 画面名定数
│   ├── database/
│   │   └── models/             # WatermelonDB モデル（デコレータベース）
│   └── screens/                # 画面コンポーネント
├── app.json                    # 静的設定
└── babel.config.js             # @react-native/babel-preset
```

### After（Expo SDK 55）

```
topik-dojo/
├── app/                        # Expo Router（ファイルベースルーティング）
│   ├── _layout.tsx             # ルートレイアウト
│   ├── index.tsx               # トップ画面（級選択）
│   └── [grade]/                # 級別ルート
│       ├── _layout.tsx         # 級レイアウト
│       ├── learning/
│       │   ├── index.tsx       # 学習モード選択
│       │   ├── units.tsx       # ユニット選択
│       │   └── [unitId].tsx    # 学習画面
│       ├── test/
│       │   ├── index.tsx       # テストモード選択
│       │   ├── units.tsx       # テストユニット選択
│       │   ├── listening/[unitId].tsx
│       │   └── reading/[unitId].tsx
│       └── review.tsx          # 復習画面
├── src/
│   ├── database/
│   │   ├── schema.ts           # Drizzle ORM スキーマ定義
│   │   ├── client.ts           # 本番用 DB クライアント (expo-sqlite)
│   │   ├── test-client.ts      # テスト用 DB クライアント (better-sqlite3)
│   │   ├── migrations.ts       # マイグレーション
│   │   ├── constants.ts        # DB 定数
│   │   ├── models/             # モデルヘルパー
│   │   └── queries/            # クエリ関数
│   ├── screens/                # 画面コンポーネント（ロジック）
│   ├── hooks/                  # カスタムフック
│   └── assets/                 # 音声ファイル等
├── drizzle/                    # Drizzle Kit 生成ファイル
├── docs/                       # 設計ドキュメント
├── scripts/                    # ユーティリティスクリプト
├── app.config.ts               # Expo 動的設定
├── drizzle.config.ts           # Drizzle Kit 設定
├── tailwind.config.js          # Tailwind CSS 設定
├── babel.config.js             # babel-preset-expo + nativewind/babel
├── metro.config.js             # withNativeWind で Metro 統合
└── global.css                  # Tailwind スタイルインポート
```

### 主な変更点

- **`App.tsx`** → 削除。エントリーポイントは `app/_layout.tsx` に移行
- **`src/navigation/`** → 削除。Expo Router がファイル構造からルーティングを自動生成
- **`src/constants/screens.ts`** → 削除。画面名定数は不要に
- **`src/database/models/`** → WatermelonDB デコレータモデルから `src/database/schema.ts` の Drizzle テーブル定義に置き換え
- **`ios/`, `android/`** → `.gitignore` に追加。CNG で `npx expo prebuild` から自動生成
- **`app.json`** → `app.config.ts` に変更（動的設定対応）

---

## 4. 起動方法

### 初回セットアップ

```bash
# 依存インストール（Expo SDK 55 canary版のため --legacy-peer-deps が必要）
npm install --legacy-peer-deps

# ネイティブプロジェクト生成（初回 or ネイティブ設定変更時）
npx expo prebuild
```

### アプリ起動

```bash
# iOS（ネイティブビルド）
npx expo run:ios
# or
npm run ios

# Android（ネイティブビルド）
npx expo run:android
# or
npm run android

# Metro 開発サーバーのみ
npx expo start
```

### クリーンビルド

ネイティブ設定を変更した場合、ネイティブディレクトリを再生成します。

```bash
npx expo prebuild --clean
```

---

## 5. 日常の開発フロー

### 画面追加

`app/` ディレクトリにファイルを追加するだけで自動的にルートが生成されます。React Navigation のような手動ルーティング設定は不要です。

```
app/[grade]/new-screen.tsx  →  /[grade]/new-screen として自動登録
```

### DB スキーマ変更

1. `src/database/schema.ts` を編集
2. `npx drizzle-kit generate` でマイグレーションファイル生成
3. `src/database/test-client.ts` の DDL も合わせて更新

### テスト

```bash
npm test
```

テスト環境では `better-sqlite3` のインメモリ DB を使い、実際のデータベース操作をテストします。DB のモックは使いません。

`npm rebuild better-sqlite3` がテスト前に必要な場合があります（プラットフォーム不一致時）。

### 型チェック・Lint

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
```

### シードデータ投入

```bash
npm run db:seed
```

### Drizzle Studio（DB 閲覧）

```bash
npx drizzle-kit studio
```

---

## 6. デプロイ方法

### 開発ビルド（ローカル）

```bash
npx expo run:ios
npx expo run:android
```

### EAS Build（クラウドビルド）

```bash
# EAS CLI インストール
npm install -g eas-cli

# ログイン
eas login

# ビルド設定初期化
eas build:configure

# 開発ビルド
eas build --platform ios --profile development
eas build --platform android --profile development

# プロダクションビルド
eas build --platform ios --profile production
eas build --platform android --profile production
```

### OTA アップデート（JS 変更のみの場合）

```bash
eas update --branch production --message "description"
```

### ストア提出

```bash
eas submit --platform ios
eas submit --platform android
```

---

## 7. 注意事項・既知の制約

### npm install

`npm install` には必ず `--legacy-peer-deps` を付けてください。Expo SDK 55 が canary 版のため、一部パッケージの peer dependency が解決できません。

### better-sqlite3 のリビルド

テスト実行前に `npm rebuild better-sqlite3` が必要になる場合があります。「invalid ELF header」エラーが出たらこのコマンドを実行してください。

### 未実装の画面

Results 画面（成績確認）は未実装です。今後のタスクとして残っています。

### 音声ファイル

現在テスト用の 6 ファイルのみ同梱しています。12,000 語分の音声ローディング戦略は別途検討が必要です。

### CNG（Continuous Native Generation）

`ios/` と `android/` は `.gitignore` に含まれています。ネイティブ設定の変更は `app.config.ts` の `plugins` で管理してください。直接 Xcode プロジェクトや Gradle ファイルを編集しても、`npx expo prebuild --clean` で上書きされます。

### CI

GitHub Actions で lint, typecheck, test, Android ビルドが自動実行されます（`.github/workflows/ci.yml`）。iOS ビルドは macOS ランナーが必要なためコメントアウト中です。

---

## 8. 移行で削除されたもの

| 削除対象                            | 理由                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `App.tsx`                           | Expo Router の `app/_layout.tsx` がエントリーポイントになったため |
| `src/navigation/AppNavigator.tsx`   | Expo Router のファイルベースルーティングに置き換え                |
| `src/navigation/types.ts`           | ナビゲーション型定義が不要に                                      |
| `src/constants/screens.ts`          | 画面名定数が不要に（ファイルパスがルート名）                      |
| `ios/` ディレクトリ                 | CNG で自動生成。`.gitignore` に追加                               |
| `android/` ディレクトリ             | CNG で自動生成。`.gitignore` に追加                               |
| WatermelonDB 関連パッケージ         | expo-sqlite + Drizzle ORM に置き換え                              |
| `@nozbe/watermelondb`               | DB 層を Drizzle ORM に移行                                        |
| `react-native-sound-player`         | expo-audio に置き換え                                             |
| `@react-native/babel-preset`        | babel-preset-expo に置き換え                                      |
| `@babel/plugin-proposal-decorators` | WatermelonDB のデコレータが不要になったため                       |
