# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOPIK道場は、日本人韓国語学習者向けのTOPIK（韓国語能力試験）対策専用単語帳アプリです。React Nativeで開発し、全語彙データ（約12,000語）をアプリに内蔵します。

## Important Rules

**質問は1度に必ず1つだけ行う** - 複数の質問を同時にせず、一つずつ丁寧に議論する

**絶対に推測で要件を追加しない** - 明示的に指示されていない機能や仕様を勝手に追加することを禁止する。既存の要件や仕様書に明記されている内容のみを実装し、不明な点があれば必ず確認を求める。

## 🚨 作業開始時の必読ファイル

**Claude Codeでこのプロジェクトの作業を開始する際は、必ず以下のファイルを最初に読み込んでプロジェクト全体像を把握すること:**

1. **詳細仕様**: `requirements.md` - プロジェクトの基本要件・仕様
2. **画面遷移**: `docs/screen-flows.md` - 全体的な画面フロー・シーケンス
3. **各画面仕様書**: `docs/screens/` - 各画面の詳細設計（全11画面完成）
4. **設計課題**: `docs/design-issues-checklist.md` - 仕様の矛盾点・未解決課題

**注意**: `docs/original-materials/memo.md` は初期の原案であり、現在の正式な仕様ではない

## 画面設計完成状況

全11画面の設計が完了：
- **01-top.md** - トップ画面（級選択）
- **02-learning-mode-selection.md** - 学習モード選択画面
- **03-unit-selection.md** - 学習用ユニット選択画面
- **04-test-mode-selection.md** - テストモード選択画面
- **05-listening-unit-selection.md** - リスニングテストユニット選択画面
- **06-reading-unit-selection.md** - リーディングテストユニット選択画面
- **07-learning.md** - 学習画面
- **08-listening-test.md** - リスニングテスト画面
- **09-reading-test.md** - リーディングテスト画面
- **10-results.md** - 成績確認画面
- **11-review.md** - 復習画面

## Key Requirements

- **プラットフォーム**: React Native (iOS/Android)
- **データ保存**: 全データアプリ内蔵（約400MB）
- **ターゲット**: 日本人TOPIK受験者
- **語彙数**: 全級合計12,000語、1,180ユニット
- **復習システム**: 簡易SRS（覚えた/覚えてない 2択）
- **マネタイズ**: 広告収入検討中
- **通知**: ローカル通知でバッジ表示

## Pending Tasks

### 【重要】要調査事項
1. **TOPIK語彙リスト取得元の調査** - 信頼できるスクレイピング対象サイトの選定
2. **コンテンツ生成コスト見積り** - 12,000語の意味・例文・音声生成費用
3. **Ankiアルゴリズム詳細調査** - 具体的なSRS間隔計算方法の研究
4. **技術選定** - React Nativeライブラリ選択
5. **UI/UX詳細設計** - memo.mdの画面モックアップを元にした詳細仕様
6. **類似語選択アルゴリズム** - テスト4択で似た意味の間違い選択肢生成方法

## Project Structure

*To be documented as development progresses*

## Development Commands

*To be added as the project structure is established*

---
*Created: 2025/6/13*