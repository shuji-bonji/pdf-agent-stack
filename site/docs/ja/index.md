---
layout: home
description: AI エージェントのための PDF ツール群 — 読む・検証する・書く・仕様で裏付ける 4 つの MCP サーバーと 3 つの Skill

hero:
  name: PDF Agent Stack
  text: PDF 専門家 AI エージェントの構築
  tagline: 読む・検証する・書く・仕様で裏付ける — AI エージェントのための PDF ツール群（4 つの MCP サーバーと 3 つの Skill）
  image:
    src: /images/logo.svg
    alt: PDF Agent Stack
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/getting-started
    - theme: alt
      text: PDF Agent Stack とは
      link: /ja/guide/overview

features:
  - title: pdf-spec-mcp — 仕様の原文を引く
    details: ISO 32000 ほか 17 文書の条文・定義・要求事項（shall / should / may）を返します。検証対象の PDF は開きません。
    link: /ja/mcp/pdf-spec
  - title: pdf-reader-mcp — ファイルに入っているものを返す
    details: テキスト・表・構造ツリー・署名フィールド・XMP の宣言を、ページ上の位置とともに返す 20 ツール。規格に適合しているかどうかは判定しません。
    link: /ja/mcp/pdf-reader
  - title: pdf-verify-mcp — 本物か、規格に適合しているかを判定する
    details: 署名の暗号検証・改ざん検知・PAdES レベルの観測・PDF/A / PDF/UA の検証（veraPDF）。evaluate_policy が 4 値（trust_and_use / use_with_caution / human_review_required / reject）を返します。
    link: /ja/mcp/pdf-verify
  - title: pdf-writer-mcp — PDF を生成・編集する
    details: text / Markdown / 表から PDF を生成し、結合・分割・注釈・メタデータなど 20 種の編集を行います。日本語フォントを埋め込めます。
    link: /ja/mcp/pdf-writer
  - title: pdf-trust Skill — 受け取った PDF を監査する
    details: pdf-verify / pdf-reader / pdf-spec を順に呼び、署名・改ざん・規格適合を調べて Trust Report と 4 値判定を返します。
    link: /ja/skills/pdf-trust
  - title: pdf-publish Skill — 検証してから納品する
    details: pdf-writer で書き、pdf-reader で読み戻し、pdf-verify（veraPDF）で採点します。採点に通らなければ納品せず、結果を Publish Report に書きます。
    link: /ja/skills/pdf-publish
  - title: pdf-read Skill — 大きな PDF から必要な箇所を読む
    details: 文書の性質を測ってから読み方（構造ツリー / 検索して絞る / 画像にする）を選び、読めなかった箇所を Read Report に書きます。
    link: /ja/skills/pdf-read
---

## クイックスタート

```jsonc
// Claude Desktop / Claude Code の設定に追加
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"]
    }
  }
}
```

まずは pdf-reader だけで PDF を読んでみて、必要に応じて他のサーバーを足していけます。
→ [導入手順（env / veraPDF / フォント）](/ja/guide/getting-started)
