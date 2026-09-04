---
description: npx での導入手順 — 各 MCP サーバーの設定例、必須環境変数（PDF_SPEC_DIR / PDF_WRITER_FONT 等）、動作確認プロンプト
---

# 導入手順

前提: Node.js 20+。全サーバー `npx` で起動できるためグローバルインストールは不要です。

## Step 1 — 最小構成（pdf-reader）

```jsonc
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"],
    },
  },
}
```

環境変数なしで動きます。まず PDF を 1 つ読んで動作確認してください。

## Step 2 — pdf-spec

### 仕様コーパスの配置

**このステップを飛ばすと pdf-spec は 1 問も答えられません。** pdf-spec-mcp は仕様 PDF 本体を同梱しません（ISO 文書のため再配布できません）。仕様の原文は利用者が入手して配置します — 幸い、**中核文書はすべて正規ルートで無償入手できます。**

| 入手先                                                                                                            | 含まれる文書                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [PDF Association: Sponsored ISO standards](https://pdfa.org/sponsored-standards/) → **ISO 32000-2 バンドル**      | ISO 32000-2:2020（Errata Collection 3 収録）+ ISO TS 32001 / 32002 / 32003 / 32004 |
| 同ページ → **PDF/UA バンドル**                                                                                    | ISO 14289-1:2014（PDF/UA-1）+ ISO 14289-2:2024（PDF/UA-2）+ ISO TS 32005           |
| [Adobe 公開版 PDF32000_2008.pdf](https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf) | ISO 32000-1:2008（PDF 1.7）                                                        |

sponsored 版は、Adobe・Apryse・Foxit などスポンサー企業の拠出により PDF Association が**無償公開している正規の ISO 文書**です（無償ですが海賊版の類ではありません）。
ダウンロードした PDF を 1 つのディレクトリに置き、pdf-spec-mcp の設定に`PDF_SPEC_DIR` としてそのディレクトリを指定すれば、ファイル名パターンで自動判別されます。
（例: `PDF32000_2008.pdf`, `ISO_32000-2_2020...pdf`, `ISO-14289-1-2014-sponsored.pdf` など 17 文書）。

### `PDF_SPEC_DIR` の設定

```jsonc
{
  "mcpServers": {
    "pdf-spec": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-spec-mcp@latest"],
      "env": { "PDF_SPEC_DIR": "/path/to/pdf-specs" },
    },
  },
}
```

::: warning
`PDF_SPEC_DIR` は必須です。このコーパスは PDF Agent Stack の**規範知識の根拠そのもの** — 条文を引用して言い切れる（T1）のは、手元に原文があるからです。ISO 19005 (PDF/A) と ETSI PAdES はコーパス外です — 何が引けないかは `list_specs` の `coverage.gaps` を確認してください。
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
        "PDF_VERIFY_TRUST_ANCHORS": "/path/to/trust-anchors",
      },
    },
  },
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
      "env": { "PDF_WRITER_FONT": "/path/to/NotoSansJP-Regular.otf" },
    },
  },
}
```

`PDF_WRITER_FONT` を設定すると各ツールの `fontPath` を省略できます。出力は必ず `outputPath`（絶対パス）を指定してください — 省略すると PDF 全体が base64 で返り、応答が溢れます。

## Step 5 — スモークテスト

各サーバー 1 ツールずつ叩いて確認します。

| サーバー   | 確認プロンプト例                                           |
| ---------- | ---------------------------------------------------------- |
| pdf-reader | 「この PDF のページ数とメタデータを見せて」                |
| pdf-spec   | 「ISO 32000-2 で注釈の /Contents は何を要求されている？」  |
| pdf-verify | 「この PDF の完全性を検証して」                            |
| pdf-writer | 「"Hello 日本語" と書いた PDF を ~/tmp/test.pdf に作って」 |

## Step 6 — Skill の導入

[pdf-trust](/ja/skills/pdf-trust)（受入監査）・[pdf-publish](/ja/skills/pdf-publish)（納品）・[pdf-read](/ja/skills/pdf-read)（読み取り）を Skill として追加すると、複数 MCP の編成が定型化されます。

- pdf-trust は pdf-verify が**必須**。`evaluate_policy` を使うので最低 v0.7.0+、**v0.21.0+ 推奨**（この版で `verify_signatures` / `detect_pades_level` の JSON 最上位が配列から辞書に変わった）
- pdf-publish は pdf-writer が必須。品質ゲート水準 `conformance` では pdf-verify も必須（`scope` が入った **v0.20.0+ 推奨**）
- pdf-read は pdf-reader が必須（**v0.14.0+ 推奨**）

## 環境変数一覧

| 変数                       | サーバー   | 必須               | 用途                                                |
| -------------------------- | ---------- | ------------------ | --------------------------------------------------- |
| `PDF_SPEC_DIR`             | pdf-spec   | **必須**           | 仕様 PDF コーパスのディレクトリ                     |
| `PDF_SPEC_CACHE_DIR`       | pdf-spec   | 任意               | 索引のディスクキャッシュ（v0.5.0+。既定 `${XDG_CACHE_HOME:-~/.cache}/pdf-spec-mcp`）。`PDF_SPEC_CACHE=off` で無効 |
| `PDF_READER_CONCURRENCY`   | pdf-reader | 任意               | `read_url` のリモート取得の同時実行数。既定 `4` |
| `PDF_READER_RENDER_TIMEOUT_MS` | pdf-reader | 任意           | `render_page` の 1 ページあたりの制限時間。既定 20,000 ms |
| `PDF_VERIFY_VERAPDF`       | pdf-verify | 任意               | veraPDF 実行パス（無ければ PATH 探索 → 内蔵ルール） |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | 任意               | 信頼アンカー証明書のディレクトリ                    |
| `PDF_WRITER_FONT`          | pdf-writer | CJK 出力に実質必須 | 既定フォント（単一フェイス .ttf/.otf）              |

既定値まで含めた一覧は [環境変数リファレンス](/ja/reference/env-vars) にあります。
