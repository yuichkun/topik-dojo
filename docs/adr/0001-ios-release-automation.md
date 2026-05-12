# ADR-0001: iOS リリース自動化（tag push で EAS Build + Submit）

**Status:** Accepted
**Date:** 2026-05-12

## Context

TOPIK 道場 iOS アプリは 2026-04-01 に App Store で v1.0 (build 8) として公開されました。それまでのリリースフローは、開発者がローカル PC から手動で `eas build` および `eas submit` を実行する半手動運用でした。

継続的なリリース運用に向けて、以下の要求が挙がりました:

- Git タグ（例: `v1.0.1`）を push したら、自動的に iOS の署名済みビルドが作成され、App Store Connect (TestFlight) まで提出されること
- 「タグを push する」以外の手動作業を可能な限り排除すること

本 ADR は、その自動化を実装するにあたって行った設計判断を記録します。決定は相互に関連するので、ひとつの ADR にまとめています。

### 自動化開始時点での既存資産

- **EAS 上**:
  - Project `@yuichi_yogo/topik-dojo` 実在、`extra.eas.projectId` も整合
  - iOS Distribution Certificate / Provisioning Profile / App Store Connect API Key が EAS のサーバー上に登録済み（過去 4 本のビルドで使用実績あり）
  - `eas.json` 設定: `appVersionSource: "remote"` + production プロファイル `autoIncrement: true`
- **Apple 側**:
  - App ID `6761349664`、Bundle ID `com.topikdojo`、Team `Escentier, LLC` (`d5f9ea33-035c-4174-823b-4688ce48a231`)
  - v1.0 を build 8 で App Store 公開済み
  - **既使用 buildNumber の最大値 = 8**（TestFlight: 5/7/8、Distribution: 8）
- **GitHub Actions**:
  - 既存 workflow は `ci.yml`（PR 用、self-hosted Mac で unsigned simulator ビルド）、`claude.yml`、`claude-code-review.yml` のみ
  - release 用 workflow は存在しなかった
- **ローカル**:
  - `~/.expo/state.json` に Expo CLI セッショントークンが存在（Browser-Flow-Authentication 由来）
  - iOS 署名関連の素材はローカルには無い（全部 EAS サーバー側）

## Decisions

### 決定 1: ビルド基盤は EAS Build（クラウド）を継続使用する

**選択:** EAS Build でクラウドビルド、EAS Submit で App Store Connect に提出

**代替案:**

- Self-hosted Mac runner（既に CI 用に存在）で `xcodebuild` + `fastlane` を組んで自前で全て管理
- GitHub Actions の `macos-latest` runner で `xcodebuild`

**採用理由:**

- 過去 4 本のリリースが既に EAS Build 経由で作られており、Distribution Certificate / Provisioning Profile / ASC API Key が EAS のサーバー上に整っている。流用すれば追加の credentials 管理コストがゼロ
- Self-hosted や macOS runner で xcodebuild を採用すると、これらの credentials をローカル or runner 上で別途管理し直す必要があり、初回セットアップが重い
- EAS が credentials を集約管理する形のままにしておけば、将来別のメンバーや別の CI から実行する際にも手順が単純

### 決定 2: `appVersionSource` を `remote` から `local` に切り替える

**選択:** `eas.json` の `cli.appVersionSource` を `"remote"` から `"local"` に変更し、`production.autoIncrement` を削除する

**経緯:**

当初は既存設定（`"remote"` + `autoIncrement: true`）を温存したまま、タグから marketing version を流し込む方法を模索しました。しかし調査の結果、`appVersionSource: "remote"` モードで marketing version を更新する公式手段である `eas build:version:set` コマンドが**対話プロンプト専用**であり、`--non-interactive` や引数経由でのバージョン指定をサポートしていないことが判明しました。CI で `expect` スクリプトのような hack で自動化することは可能ですが、壊れやすく公式サポート外です。

**代替案:**

- `remote` のまま、リリース前に手元で対話的に `eas build:version:set` を叩いて version を設定する半自動運用
- Expo の内部 GraphQL API を直接叩いて version を更新する（非公開 API のため非推奨）

**採用理由:**

- `local` に切り替えれば、`app.config.ts` の中で `process.env.APP_VERSION` を読む単純な仕組みが使えるので、CI から完全に制御できる
- EAS のサーバー側で管理されていた version/buildNumber 状態は削除されず参照されなくなるだけ。後で `remote` に戻すことも理論上は可能

**結果として失うもの:**

- 戻すときに EAS のサーバー側カウンタ（現時点で 8 で止まっている）が Apple 側の実際の最大値より小さい状態になっているため、再度 `eas build:version:set` で同期し直す必要がある

### 決定 3: marketing version は git タグから抽出、buildNumber は `github.run_number * 100 + github.run_attempt`

**選択:**

- `expo.version` を `${GITHUB_REF_NAME#v}` 由来にする（タグから `v` を除いた値）
- `expo.ios.buildNumber` を `github.run_number * 100 + github.run_attempt` にする

**buildNumber 戦略の代替案:**

1. **`github.run_number` のみ（オフセット無し）**
2. **`100 + github.run_number`**（当初検討した案）
3. **日付ベース**（例: `202605121356`）
4. **EAS の `build:version:get` で取得 +1**

**採用理由（buildNumber について）:**

- 案 1 単独はダメ。新規 workflow ファイルでは `github.run_number` が 1 から始まる（既存 workflow とは独立にカウントされる仕様）。Apple 側の現状最大 buildNumber 8 と衝突する
- 案 2 は run_number が単調増加する点では問題ないが、**workflow 再実行（Re-run）時に `github.run_number` が増えない**ため、同じタグの再試行で同一 buildNumber が再生成され、Apple に「buildNumber 既使用」で弾かれて復旧不能になり得る（codex review で指摘・[#30](https://github.com/yuichkun/topik-dojo/pull/30) 参照）
- 案 3（日付ベース）は衝突しないが、数字が大きく見た目が異質で、手動 build 4〜8 との連続性が乏しい
- 案 4 は `appVersionSource: "local"` の下では EAS が値を更新しない（=参照しないモードのため）ので、毎回同じ「8」を返す。+1 しても常に 9 になり 2 回目で衝突する → 破綻
- 採用案（`run_number * 100 + run_attempt`）は:
  - 初回（run 1, attempt 1）→ 101 となり Apple max 8 から余裕を持って離れる
  - 再実行時は `github.run_attempt` が増えるので衝突しない（run 1, attempt 2 → 102, attempt 3 → 103 ...）
  - 新規 run は百の位以上が必ず大きくなる（run 2, attempt 1 → 201）
  - 3 桁中心で見やすく、「手動運用時代の 4〜8 と一目で区別できる」
  - `run_attempt < 100` の前提（実運用では決して起きない）が破られない限り単調増加と一意性が保たれる

### 決定 4: タグ形式は `v*.*.*` 厳密 semver のみ（glob トリガー + workflow 内ガード）

**選択:**

- workflow トリガー: `tags: - 'v*.*.*'`
- workflow 内に **strict semver チェックステップ** を入れ、`v<major>.<minor>.<patch>` 以外（prerelease や hyphen を含むタグ）は早期に失敗させる

**代替案:**

- glob だけで絞る（チェックステップ無し）
- `v*` 全般（prerelease タグ `v1.0.0-rc.1` も含める）
- `*` 何でも

**採用理由:**

- GitHub Actions の workflow `tags:` フィルタは **glob のみで正規表現非対応**。`v*.*.*` の `*` は `/` 以外の任意文字にマッチするので、`v1.0.0-rc.1` のような prerelease タグも素通りしてしまう（codex review で指摘・[#30](https://github.com/yuichkun/topik-dojo/pull/30) 参照）
- したがって glob だけでは strict semver 限定を表現できない。workflow 内で `[[ "${GITHUB_REF_NAME}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]` の正規表現チェックを行い、外れたタグは早期失敗させる構成にする
- 誤って関係ないタグ（例: `release-notes-1.0`）を push してもガードで止まるので安全
- prerelease タグサポートは、marketing version に `-rc.1` を含めると Apple の `CFBundleShortVersionString` 制約に抵触する可能性があり、複雑化を避けて初版では対応外とする
- 必要になったら後から条件を緩める方が、初回から広く受け付けるより安全

### 決定 5: Expo 認証は Personal Access Token (PAT) を使う

**選択:** Expo の Web ダッシュボードで PAT を発行し、GitHub の repo secret `EXPO_TOKEN` として登録

**代替案:** Robot Token（ロボットユーザーを作って、ロール制限付きトークンを発行）

**採用理由:**

- Expo 公式 CI ドキュメントが PAT を名指しで推奨している（[docs.expo.dev/build/building-on-ci](https://docs.expo.dev/build/building-on-ci/)）
- 本プロジェクトはソロ開発で、Robot Token のスコープ制御メリット（権限を細かく絞れる）が薄い
- PAT は発行手順がシンプル（ロボットユーザーの事前作成不要）

**注意点:**

- PAT が漏洩した場合、Expo アカウント全体に影響が及ぶ可能性がある。漏洩を検知したら速やかに `https://expo.dev/accounts/yuichi_yogo/settings/access-tokens` で revoke する必要がある

### 決定 6: workflow 内で `expo/expo-github-action@v8` を使う

**選択:** Expo 公式の GitHub Action で eas-cli セットアップと認証を一括化する

**代替案:** `npx eas-cli@latest` を step 内で直接呼ぶ

**採用理由:**

- 公式 Action がインストールキャッシュと `EXPO_TOKEN` の伝播を内部で扱ってくれる
- `npx @latest` は実行のたびにパッケージを取得するので、ネットワーク不調や latest にしたタイミングの破壊的変更で workflow が落ちるリスクがある
- 公式の経路を辿っておけば、将来 Expo 側で挙動が変わったときに追随しやすい

### 副次決定

- **Node.js バージョンは `'22'` を指定**: 既存の `package.json` の `engines.node` が `>=20`、既存 `ci.yml` でも Node 20 を使用。22 LTS は Expo SDK 55 に対する Expo 公式の推奨範囲内で、20 から段階的に上げる方針
- **`concurrency` guard を有効化**: `concurrency: { group: release-ios, cancel-in-progress: false }` を設定。複数の release workflow が同時に走るのを防ぎ、App Store Connect への二重アップロードによる reject を回避

## Consequences

### Positive

- タグ push 1 アクションで iOS リリースが完結する
- Apple 関連 credentials は引き続き EAS に集約されており、ローカルでの証明書管理は発生しない
- marketing version はタグから一意に決まるので、リリース後にどのコミットがリリースされたか追跡しやすい（タグが指すコミットがビルド対象）
- 設計判断の根拠が本 ADR に集約されているので、将来の開発者・AI エージェントが「なぜこうしたか」を辿れる

### Negative / Trade-offs

- `appVersionSource: "local"` への切替により、EAS のサーバー側 buildNumber 状態（8 で停止）は参照されなくなる
- `run_number * 100 + run_attempt` 方式は、release workflow ファイルを削除して再作成すると `run_number` がリセットされるので、その場合は Apple 側の最大値より大きいオフセット（例えば `(run_number + N) * 100 + run_attempt` のように底上げ）に formula を更新する必要がある
- 同じ workflow run の再実行を 99 回以上行うと（`run_attempt >= 100`）、次の run の buildNumber と衝突する可能性がある。実運用では起き得ない数だが、formula の制約として認識しておく
- buildNumber は marketing version をまたいで一意に増えていく方式（`v1.0.1` → build 101、`v1.0.2` → build 201 …）なので、marketing version と buildNumber の関係が直感的でない。慣れが必要

### Future considerations

- **Android リリース自動化**: 追加する場合は `eas.json` の `submit.production.android` 設定と、Google Play 用の `serviceAccountKey` をローカル → EAS に投入する必要がある。workflow にも Android ジョブを追加する
- **App Store 審査への自動 submit は実装していない**: EAS Submit は ASC へのアップロードまでで止まる。「審査提出」は ASC 上で手動で行う運用にしている
- **prerelease タグ対応**: `v1.0.0-rc.1` のような prerelease を tag push したくなった場合、marketing version から `-rc.x` を除去するロジックを workflow に足す or 別 profile（preview など）を使う等の検討が必要
- **GitHub Release 自動作成**: タグ push から GitHub Release（リリースノート付き）を自動生成する仕組みは入れていない。必要なら別途追加

## References

- [Expo Docs: Trigger builds from CI](https://docs.expo.dev/build/building-on-ci/)
- [Expo Docs: Programmatic Access](https://docs.expo.dev/accounts/programmatic-access/)
- [Expo Docs: App version management](https://docs.expo.dev/build-reference/app-versions/)
- [expo/expo-github-action](https://github.com/expo/expo-github-action)
