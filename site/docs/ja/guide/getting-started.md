# 導入手順

前提: Node.js 20+。全サーバ `npx` で起動できるためグローバルインストールは不要です。

## Step 1 — 最小構成（pdf-reader）

```jsonc
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"]
    }
  }
}
```

環境変数なしで動きます。まず PDF を 1 つ読んで動作確認してください。

## Step 2 — pdf-spec（仕様コーパスの配置）

pdf-spec-mcp は仕様 PDF 本体を同梱しません（再配布不可のため）。PDF Association の無償 sponsored 版を入手し、1 つのディレクトリに置きます。ファイル名パターンで自動判別されます（例: `PDF32000_2008.pdf`, `ISO_32000-2_2020...pdf`, `ISO-14289-1-2014-sponsored.pdf` など 17 文書）。

```jsonc
{
  "mcpServers": {
    "pdf-spec": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-spec-mcp@latest"],
      "env": { "PDF_SPEC_DIR": "/path/to/pdf-specs" }
    }
  }
}
```

::: warning
`PDF_SPEC_DIR` は必須です。ISO 19005 (PDF/A) と ETSI PAdES はコーパス外です — 何が引けないかは `list_specs` の `coverage.gaps` を確認してください。
:::

## Step 3 — pdf-verify（veraPDF と信頼アンカー）

そのままでも動きます（内蔵 ~15 ルールの PDF/A サブセット + PDF/UA 12 ルール）。本格運用では veraPDF を導入してください。

1. [veraPDF](https://verapdf.org/) をインストール
2. PATH に通すか、`PDF_VERIFY_VERAPDF` に実行パスを指定

```jsonc
{
  "mcpServers": {
    "pdf-verify": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-verify-mcp@latest"],
      "env": {
        "PDF_VERIFY_VERAPDF": "/usr/local/bin/verapdf",
        "PDF_VERIFY_TRUST_ANCHORS": "/path/to/trust-anchors"
      }
    }
  }
}
```

`PDF_VERIFY_TRUST_ANCHORS`（PEM/DER 証明書のディレクトリ）を設定すると署名者の証明書チェーンを評価できます。未設定の場合、署名の「valid」は**暗号計算が合っている**ことだけを意味し、署名者が本人であることは意味しません（`trust: not_evaluated`）。

## Step 4 — pdf-writer（日本語フォント）

標準フォント（Helvetica）は **ASCII のみ**です。日本語を出すには埋め込み可能な単一フェイスフォント（`.ttf` / `.otf`、Variable font 不可）が必要です。[Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) の static 版を推奨します。

```jsonc
{
  "mcpServers": {
    "pdf-writer": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-writer-mcp@latest"],
      "env": { "PDF_WRITER_FONT": "/path/to/NotoSansJP-Regular.otf" }
    }
  }
}
```

`PDF_WRITER_FONT` を設定すると各ツールの `fontPath` を省略できます。出力は必ず `outputPath`（絶対パス）を指定してください — 省略すると PDF 全体が base64 で返り、応答が溢れます。

## Step 5 — スモークテスト

各サーバ 1 ツールずつ叩いて確認します。

| サーバ | 確認プロンプト例 |
|---|---|
| pdf-reader | 「この PDF のページ数とメタデータを見せて」 |
| pdf-spec | 「ISO 32000-2 で注釈の /Contents は何を要求されている？」 |
| pdf-verify | 「この PDF の完全性を検証して」 |
| pdf-writer | 「"Hello 日本語" と書いた PDF を ~/tmp/test.pdf に作って」 |

## Step 6 — Skill の導入

[pdf-trust](/ja/skills/pdf-trust)（受入監査）と [pdf-publish](/ja/skills/pdf-publish)（納品）を Skill として追加すると、複数 MCP の編成が定型化されます。pdf-trust は pdf-verify **v0.7.0+ が必須**（`evaluate_policy` を使うため）です。

## 環境変数一覧

| 変数 | サーバ | 必須 | 用途 |
|---|---|---|---|
| `PDF_SPEC_DIR` | pdf-spec | **必須** | 仕様 PDF コーパスのディレクトリ |
| `PDF_VERIFY_VERAPDF` | pdf-verify | 任意 | veraPDF 実行パス（無ければ PATH 探索 → 内蔵ルール） |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | 任意 | 信頼アンカー証明書のディレクトリ |
| `PDF_WRITER_FONT` | pdf-writer | CJK 出力に実質必須 | 既定フォント（単一フェイス .ttf/.otf） |
