# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOPIK道場は、日本人韓国語学習者向けのTOPIK（韓国語能力試験）対策専用単語帳アプリです。React Nativeで開発し、全語彙データ（約12,000語）をアプリに内蔵します。

## Important Rules

**質問は1度に必ず1つだけ行う** - 複数の質問を同時にせず、一つずつ丁寧に議論する

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