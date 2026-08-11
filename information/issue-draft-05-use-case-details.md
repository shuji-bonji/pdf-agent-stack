# Issue 下書き: ユースケース詳細ページの執筆（一次情報の収集後に着手）

**優先度: 5（最後尾・ブロックあり）**

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
