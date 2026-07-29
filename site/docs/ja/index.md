---
layout: home

hero:
  name: PDF Agent Stack
  text: PDF 専門家 AI エージェントの構築
  tagline: 読む・検証する・書く・仕様で裏付ける — AI エージェントのための PDF ツール群（4 つの MCP サーバと 2 つの Skill）
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/getting-started
    - theme: alt
      text: PDF Agent Stack とは
      link: /ja/guide/overview

features:
  - title: pdf-spec-mcp（正典）
    details: ISO 32000 ほか 17 文書の仕様リファレンス。仕様は何を要求するかに答える。ファイルは開かない。
    link: /ja/mcp/pdf-spec
  - title: pdf-reader-mcp（実体）
    details: PDF の中身を観測する 18 ツール。テキスト・表・構造ツリー・署名フィールド、そして「それはどこに描かれているか」。合否は言わない。
    link: /ja/mcp/pdf-reader
  - title: pdf-verify-mcp（真正性・準拠性）
    details: 暗号学的署名検証・改ざん検知・PAdES レベル・PDF/A / PDF/UA 検証・決定論的 4 値判定。
    link: /ja/mcp/pdf-verify
  - title: pdf-writer-mcp（生成）
    details: text / Markdown / 表からの PDF 生成と 20 種の編集。日本語フォント埋め込み対応。
    link: /ja/mcp/pdf-writer
  - title: pdf-trust Skill（入口）
    details: 受け取った PDF の信頼性監査を編成。Trust Report と 4 値判定を返す受入ゲート。
    link: /ja/skills/pdf-trust
  - title: pdf-publish Skill（出口）
    details: write → read-back → verify の品質ゲート付き納品パイプライン。Publish Report 付き。
    link: /ja/skills/pdf-publish
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

まずは pdf-reader だけで PDF を読んでみて、必要に応じて family を足していけます。
→ [導入手順（env / veraPDF / フォント）](/ja/guide/getting-started)
