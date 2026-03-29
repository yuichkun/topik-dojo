# 学習モード選択画面 仕様書

## 画面概要
選択された級に対して、学習または成績確認を選択する画面。Bold Immersive構成。

## レイアウト構成
- **コバルトヘッダー**: 戻るボタン + 級表示 + 語彙数（rounded bottom 32px）
- **メインエリア**: 学習ヒーローカード + 成績カード

## UI要素詳細

### コバルトヘッダー
- **戻るボタン**: Manrope_500Medium 14px, white/55%
- **TOPIKラベル**: Manrope_500Medium 11px, white/45%, letterSpacing: 2, uppercase
- **級表示**: Epilogue_700Bold 48px, white, 「N級」形式
- **語彙数**: Manrope_400Regular 14px, white/55%, 「X,XXX語の語彙」

### 学習ヒーローカード（コバルト）
- **TRAININGラベル**: Manrope_500Medium 11px, white/45%, letterSpacing: 2, uppercase
- **タイトル**: Epilogue_700Bold 30px, white, 「学習を始める」
- **説明**: Manrope_400Regular 14px, white/55%, 「単語カード形式で語彙を覚える」
- **CTAボタン**: white背景, Manrope_600SemiBold 14px, cobalt文字, 「ユニットを選ぶ」
- **遷移先**: ユニット選択画面 `03-unit-selection.md`

### 成績カード（白、横並びレイアウト）
- **アイコン**: Ionicons trending-up, 28px, cobalt
- **タイトル**: Epilogue_600SemiBold 18px, on_background
- **説明**: Manrope_400Regular 12px, on_surface_variant, 「学習の記録を確認」
- **シェブロン**: Ionicons chevron-forward, 18px, outline_variant
- **遷移先**: 成績確認画面 `10-results.md`

## ナビゲーション

### 戻るボタン
- **動作**: トップ画面へ戻る
- **遷移先**: `01-top.md`

### テストへのアクセス
テストモードは `03-unit-selection.md` のユニットアクションシートから直接アクセスする。この画面には独立したテスト選択UIは置かない。

