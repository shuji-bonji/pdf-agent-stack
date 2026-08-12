# Issue 下書き: ユースケース詳細ページの執筆（一次情報の収集後に着手）

**優先度: 5（最後尾・ブロックあり）**

> **🏁 完了（2026-08-11・全 6 本 × ja/en = 12 ページ・未コミット）**
>
> - ブロック解除の根拠 = Issue 03/06 で採取した一次情報（Trust Report・Publish Report・
>   4 値判定 5 検体・veraPDF 判定・PAdES B-B/B-T/B-LTA 対検体・UA 不合格 10 規則）
> - spec-research だけ実走が無かったため追加採取: `search_spec("document timestamp")` 4 件 +
>   `get_requirements(7.5.6)` = 10 要求（shall 8 / may 2・R-7.5.6-1 引用）
> - 全ページが約束の型（シナリオ → 登場 MCP/Skill → シーケンス図 → プロンプト例 → 結果の読み方）
>   + 実測例の節。実行日（2026-08-11）と検体の性質を明記・例文の捏造なし・T1/T2/T3 の語法を遵守
> - 6 ページ計 58 行のスタブ → 907 行
> - 残: サイトビルド確認・コミット・deploy（ホスト）



> **⛔ blocked: 一次情報が揃うまで着手しない。**
> 詳細ページの型は「シナリオ → 登場 MCP/Skill → シーケンス図 → プロンプト例 → 結果の読み方」。
> このうちプロンプト例と結果は**実際に走らせたログ**からしか書けない。
> 想像で書いた実行例はサイトの「測ってあるものだけ載せる」方針に反する。

## 現象

- `use-cases/` 配下の詳細 6 ページ（incoming-audit / publish-pipeline / pdfa-archive / accessibility / batch-audit / spec-research）が全て 7 行のスタブ（執筆中）
- 外部レビュー 2 件がともに「サイト最大のギャップ」と指摘。指摘自体は妥当

## 着手条件（一次情報の定義）

各ページにつき最低限:

1. 実在の検体 PDF（またはこのプロジェクトで生成した PDF）での**実行ログ一式**（呼んだツール・引数・応答）
2. 実測で得た Trust Report / Publish Report（Issue 03 の作業で得られるものを流用）
3. 結果の読み方に使う実際の判定値（4 値判定・veraPDF 判定・T1/T2/T3 の言い切り強度）

## 消化順（条件が揃ったら）

1. incoming-audit（pdf-trust の実行ログがそのまま素材になる）
2. publish-pipeline（pdf-publish の write → read-back → verify 1 周分）
3. pdfa-archive（veraPDF 判定込み・電帳法文脈）
4. 残り 3 本（accessibility / batch-audit / spec-research）

## 受入基準

- 掲載する実行例・Report がすべて実測由来であること
- ja / en 両方が揃うこと（en は同一検体の英語実行 or 翻訳メモリ方針に従う）
