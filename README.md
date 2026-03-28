# TOPIK 道場

TOPIK（韓国語能力試験）対策専用の単語帳アプリです。日本人韓国語学習者をターゲットとし、効率的な語彙学習とテスト対策を提供します。

## 技術スタック

| 項目           | 技術                                            |
| -------------- | ----------------------------------------------- |
| フレームワーク | Expo SDK 55 (React Native 0.83.4, React 19.2.0) |
| 言語           | TypeScript 5.7.3                                |
| ナビゲーション | Expo Router (ファイルベースルーティング)        |
| ORM            | Drizzle ORM + expo-sqlite                       |
| スタイリング   | NativeWind v4 (Tailwind CSS for React Native)   |
| 音声           | expo-audio                                      |
| 通知           | expo-notifications（ローカル通知・バッジ表示）  |
| テスト         | Jest (jest-expo) + better-sqlite3               |

## 開発環境の準備

### 必要なもの

| 要件 | バージョン | 備考 |
| --- | --- | --- |
| Node.js | **20 以上** | `node -v` で確認。18 では動作しない |
| Xcode | **26 以上** | Expo SDK 55 / RN 0.83.4 の必須要件 |
| iOS Simulator ランタイム | Xcode に同梱のもの | Xcode 初回起動時に自動インストールされる |
| CocoaPods | 1.13 以上 | `pod --version` で確認 |
| Git | - | - |

Android Studio は不要です。このプロジェクトは iOS のみで開発しています。

### Xcode の確認

Xcode 26 が `xcode-select` で選択されていることを確認してください。

```bash
xcodebuild -version
# Xcode 26.x が表示されること

xcode-select -p
# /Applications/Xcode26.app/Contents/Developer のように Xcode 26 のパスが表示されること
```

異なるバージョンが表示される場合：

```bash
sudo xcode-select -s /Applications/<Xcode26のアプリ名>.app/Contents/Developer
```

### 初回セットアップ（クローンから起動まで）

```bash
# 1. クローン
git clone <repo-url>
cd topik-dojo

# 2. 依存インストール（--legacy-peer-deps は必須。Expo SDK 55 canary 版の peer dependency 競合を回避するため）
npm install --legacy-peer-deps

# 3. ネイティブプロジェクト生成（CocoaPods の install も自動実行される）
npx expo prebuild

# 4. iOS シミュレータで起動
npx expo run:ios
```

これで iPhone Simulator でアプリが起動します。

> **Note**: `ios/` と `android/` は Expo CNG (Continuous Native Generation) で自動生成されます。リポジトリには含まれていません。`app.config.ts` の設定から `npx expo prebuild` で毎回再生成できます。

### 実機で実行する場合

```bash
npx expo run:ios --device
```

Apple Developer アカウントと、Xcode でのデバイス登録が必要です。

## 日常の開発コマンド

| コマンド                    | 説明                                       |
| --------------------------- | ------------------------------------------ |
| `npx expo run:ios`          | iOS ビルド＆起動                           |
| `npx expo start`            | Metro 開発サーバー起動                     |
| `npx expo prebuild --clean` | ネイティブプロジェクト再生成（設定変更時） |
| `npm test`                  | テスト実行                                 |
| `npm run typecheck`         | 型チェック                                 |
| `npm run lint`              | Lint 実行                                  |
| `npm run db:seed`           | テストデータ投入                           |
| `npx drizzle-kit generate`  | スキーマ変更後にマイグレーション生成       |
| `npx drizzle-kit studio`    | Drizzle Studio（ブラウザで DB 閲覧）       |

## プロジェクト構造

```
topik-dojo/
├── app/                     # Expo Router 画面定義（ファイルベースルーティング）
│   ├── _layout.tsx          # ルートレイアウト
│   ├── index.tsx            # トップ画面（級選択）
│   └── [grade]/             # 級別ルート
│       ├── _layout.tsx      # 級レイアウト
│       ├── learning/        # 学習モード
│       │   ├── index.tsx    # 学習モード選択
│       │   ├── units.tsx    # ユニット選択
│       │   └── [unitId].tsx # 学習画面
│       ├── test/            # テストモード
│       │   ├── index.tsx    # テストモード選択
│       │   ├── units.tsx    # テストユニット選択
│       │   ├── listening/[unitId].tsx  # リスニングテスト
│       │   └── reading/[unitId].tsx    # リーディングテスト
│       └── review.tsx       # 復習画面
├── src/
│   ├── database/            # Drizzle ORM スキーマ・クライアント・クエリ
│   ├── hooks/               # カスタムフック（useUnits, useReviewCount, useWordAudio）
│   └── assets/              # 音声ファイル等
├── drizzle/                 # Drizzle Kit 生成ファイル
├── docs/                    # 設計ドキュメント
│   ├── screens/             # 画面仕様書（全 11 画面）
│   ├── screen-flows.md      # 画面遷移設計
│   ├── database-design.md   # データベース設計
│   └── srs-system.md        # SRS システム仕様
├── scripts/                 # ユーティリティスクリプト
├── app.config.ts            # Expo 動的設定
├── drizzle.config.ts        # Drizzle Kit 設定
├── tailwind.config.js       # Tailwind CSS 設定
├── babel.config.js          # Babel 設定（NativeWind 統合）
├── metro.config.js          # Metro 設定（NativeWind 統合）
├── global.css               # Tailwind スタイルインポート
├── requirements.md          # 要件定義書
└── CLAUDE.md                # AI 開発ガイドライン
```

## トラブルシューティング

### `npm install` が失敗する

Expo SDK 55 は canary 版のため、peer dependency の競合が起きます。必ず `--legacy-peer-deps` を付けてください。

```bash
npm install --legacy-peer-deps
```

### `npx expo prebuild` で "Please upgrade XCode" エラー

Xcode 26 が `xcode-select` で選択されていることを確認してください。

```bash
xcodebuild -version   # 26.x であること
xcode-select -p       # Xcode 26 のパスであること
```

### `npx expo prebuild` で pod install が失敗する（"Failed to validate worklets version"）

`react-native-worklets` のバージョンが合っていない可能性があります。

```bash
npm install react-native-worklets@0.7 --legacy-peer-deps
npx expo prebuild --clean
```

### `xcrun simctl` で "CoreSimulatorService connection became invalid" エラー

複数の Xcode バージョンを切り替えた場合に発生します。CoreSimulatorService をリセットしてください。

```bash
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
```

それでも解決しない場合、キャッシュの削除が必要です。

```bash
rm -rf ~/Library/Logs/CoreSimulator
rm -rf ~/Library/Developer/CoreSimulator
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
```

### テストで "invalid ELF header" エラー

`better-sqlite3` のネイティブバイナリがプラットフォームと合っていません。リビルドしてください。

```bash
npm rebuild better-sqlite3
```

## 設計ドキュメント

- [要件定義書](./requirements.md)
- [画面遷移設計](./docs/screen-flows.md)
- [データベース設計](./docs/database-design.md)
- [SRS システム仕様](./docs/srs-system.md)
- [画面仕様書](./docs/screens/)（全 11 画面）
- [Expo 移行サマリー](./docs/expo-migration-summary.md)

## 語彙データ構成

| 級   | 語彙数   | ユニット数   | 備考     |
| ---- | -------- | ------------ | -------- |
| 1 級 | 400 語   | 40 ユニット  | 基礎語彙 |
| 2 級 | 1,400 語 | 140 ユニット | 初級完成 |
| 3 級 | 2,000 語 | 200 ユニット | 中級前半 |
| 4 級 | 2,000 語 | 200 ユニット | 中級後半 |
| 5 級 | 3,000 語 | 300 ユニット | 高級前半 |
| 6 級 | 3,000 語 | 300 ユニット | 高級後半 |
