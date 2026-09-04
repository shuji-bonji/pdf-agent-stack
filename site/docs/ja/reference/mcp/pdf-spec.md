---
description: "pdf-spec-mcp v0.6.0 の全 8 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-spec-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
**v0.6.0** の `tools/list` ハンドシェイクから自動生成（8 ツール・2026-09-04）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
:::

**このページは自動生成リファレンス** — 全ツールの引数・型・既定値・戻り値を `tools/list`（正典 = サーバー実装）から写したもの。責務・設計思想・使いどころの解説は[解説ページ](/ja/mcp/pdf-spec)へ。

## ツール一覧

| ツール | 概要 |
|---|---|
| [`list_specs`](#list-specs) | 利用可能な PDF 仕様文書を一覧する。 |
| [`get_structure`](#get-structure) | PDF 仕様（ISO 32000-2）の節階層を取得する。 |
| [`get_section`](#get-section) | PDF 仕様（ISO 32000-2）の指定節の本文を取得する。 |
| [`search_spec`](#search-spec) | PDF 仕様（ISO 32000-2）をキーワード・フレーズで検索する。 |
| [`get_requirements`](#get-requirements) | あなたのファイルではなく**規格**を読む。 |
| [`get_definitions`](#get-definitions) | PDF 仕様（ISO 32000-2）の第 3 節から用語定義を取得する。 |
| [`get_tables`](#get-tables) | PDF 仕様（ISO 32000-2）の指定節から表構造を抽出する。 |
| [`compare_versions`](#compare-versions) | PDF 1.7（ISO 32000-1）と PDF 2.0（ISO 32000-2）の節を比較する。 |

## list_specs

**List available specifications**

利用可能な PDF 仕様文書を一覧する。文書 ID・タイトル・ページ数・カテゴリに加え、`coverage.gaps` — このコーパスに**存在しない**規範領域（PDF/A・PAdES）— を返す。「要求が存在しない」と結論づける前に gaps を読むこと。返された ID は他ツールの `spec` 引数に使う。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `category` | string | 任意 |  | カテゴリで絞り込む（standard, ts, pdfua, guide, appnote）。 |

::: details 呼び出し例 — 「PDF/A の適合要件を条文で示して」
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- 配列: 先頭だけ残す

ISO 19005 はコーパスに無いので、条文検索の前に `coverage.gaps` を見ます。パラメータは空オブジェクトです。

**パラメータ**

```jsonc
{}
```

**返る JSON**（`specs` 17 件は省略、`coverage.gaps` が本題）:

```jsonc
{
  "totalSpecs": 17,
  "coverage": {
    "note": "These normative areas are outside this corpus. A search returning no hits for them means \"cannot answer\", not \"no such requirement\".",
    "gaps": [
      {
        "area": "PDF/A — archival conformance",
        "standards": ["ISO 19005-1", "ISO 19005-2", "ISO 19005-3", "ISO 19005-4"],
        "consequence": "Requirements specific to PDF/A cannot be quoted or verified here. … A search returning nothing is not evidence that no requirement exists."
      },
      {
        "area": "PAdES — signature profiles",
        "standards": ["ETSI EN 319 142-1", "ETSI EN 319 142-2"],
        "consequence": "Baseline signature levels (B-B / B-T / B-LT / B-LTA) are defined by ETSI, not by ISO 32000-2. … ISO 32000-2 §12.8 covers signatures in general and is available."
      }
    ]
  }
}
```

PDF/A の判定は pdf-verify-mcp の `validate_conformance`（`flavour` は `"pdfa-*"`）に渡します。このサーバーで `search_spec` に `"PDF/A"` を渡しても、ヒット 0 件は「要求が無い」ではありません。
:::

## get_structure

**Get section hierarchy**

PDF 仕様（ISO 32000-2）の節階層を取得する。節番号・タイトル・ページ番号付きの目次を返す。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `max_depth` | integer (1–10) | 任意 |  | 返す見出しの最大深さ（1-10）。 |

## get_section

**Get section content**

PDF 仕様（ISO 32000-2）の指定節の本文を取得する。見出し・段落・リスト・表・注記を含む構造化コンテンツを返す。親節を指定するとサブツリー全体（全下位節・文書順）が返るため、最上位の節では応答が非常に大きくなりうる — 分かっている最も具体的な節番号を使うこと。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `section` | string (minLength 1) | **必須** |  | 節番号。例: "12.5.6.10" または "Annex A"。 |

::: details 呼び出し例 — 「タグ付き PDF の読み順はどの条文？」（§14.8.2.5.1）
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `section`: `"14.8.2.5.1"`
- 折返し: PDF 由来は空白に畳む

節番号は [`search_spec`](#search-spec) の `content order` の先頭ヒットです。親の `14.8.2.5` ではなく、分かった最も具体的な `14.8.2.5.1` を渡します。

**パラメータ**

```jsonc
{
  "section": "14.8.2.5.1"
}
```

**返る JSON**

```jsonc
{
  "sectionNumber": "14.8.2.5.1",
  "title": "General",
  "pageRange": { "start": 764, "end": 764 },
  "content": [
    { "type": "heading", "level": 5, "text": "14.8.2.5.1 General" },
    {
      "type": "paragraph",
      "text": "Page content order shall be defined by the sequencing of graphics objects within a page’s content stream."
    },
    {
      "type": "paragraph",
      "text": "Logical content order – the ordering for semantic purposes – shall be defined by a depth-first traversal of the document’s logical structure hierarchy."
    },
    {
      "type": "paragraph",
      "text": "The page content order in a tagged PDF should coincide with the logical content order."
    },
    {
      "type": "note",
      "label": "NOTE 1",
      "text": "Page content order is constrained by the need to render objects in an order that produces the desired visual appearance. …"
    }
  ]
}
```

`paragraph` の shall が要求、should は推奨、`note` は参考情報です。`note` 要素の文を、shall 違反の根拠にはしません。
:::

## search_spec

**Search the specification**

PDF 仕様（ISO 32000-2）をキーワード・フレーズで検索する。該当節を文脈スニペット付きで返す。初回は検索インデックス構築のため数秒かかることがあるが、構築した索引はディスクにキャッシュされ、以後のプロセスは温まった状態で始まる。ヒット 0 件は「このコーパスでは答えられない」であって「そのような要求は存在しない」では**ない** — ISO 19005（PDF/A）と ETSI PAdES はコーパス外である（list_specs → coverage.gaps を参照）。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `query` | string (minLength 1) | **必須** |  | 検索語。まず完全フレーズ、次に単語の AND でマッチする。 |
| `max_results` | integer (1–50) | 任意 |  | 返すヒットの最大数（1-50）。 |

::: details 呼び出し例 — 「PDF 2.0 で増分更新は何を要求している？」
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `query`: `"incremental update"`
- `max_results`: `5`
- 配列: 先頭だけ残す。PDF 由来の折返しは空白に畳む

英語のフレーズで探します。当たった節の要求は [`get_requirements`](#get-requirements) へ渡します。

**パラメータ**

```jsonc
{
  "query": "incremental update",
  "max_results": 5
}
```

**返る JSON**

```jsonc
{
  "query": "incremental update",
  "totalResults": 5,
  "results": [
    {
      "section": "7.5.6",
      "title": "Incremental updates",
      "page": 75,
      "score": 12,
      "snippet": "7.5.6 Incremental updates The contents of a PDF file can be updated incrementally without rewriting…"
    },
    {
      "section": "12.7.8.3.1",
      "title": "General",
      "page": 576,
      "score": 12,
      "snippet": "…A stream containing all the bytes in all incremental updates made to the underlying PDF document…"
    }
    // … ほか 3 件（7.5.4 / 12.8.1 / 7.5.1）
  ]
}
```

先頭ヒットは §7.5.6 です。要求だけが欲しいときはその節を [`get_requirements`](#get-requirements) に渡します。
:::

::: details 呼び出し例 — 「タグ付き PDF の読み順はどの条文？」
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `query`: `"content order"`
- `max_results`: `5`

日常語の `reading order` では、ストリームの読み方やシェーディングの頂点順など、別の節が先に出ます。規格の語は **logical content order** / **page content order** です。

**パラメータ**

```jsonc
{
  "query": "content order",
  "max_results": 5
}
```

**返る JSON**

```jsonc
{
  "query": "content order",
  "totalResults": 5,
  "results": [
    {
      "section": "14.8.2.5.1",
      "title": "General",
      "page": 764,
      "score": 39,
      "snippet": "14.8.2.5.1 General Page content order shall be defined by the sequencing of graphics objects within …"
    }
    // … ほか 4 件
  ]
}
```

本文が欲しいときは、分かった最も具体的な節番号で [`get_section`](#get-section) します。親の `14.8.2.5` ではなく `14.8.2.5.1` です。
:::

## get_requirements

**Extract normative requirements**

あなたのファイルではなく**規格**を読む。PDF 仕様（ISO 32000-2）から規範的要求（shall/must/may）を抽出する。文の文脈・節・要求レベル付きの構造化要求を返す。仕様が何を要求するかを教えるだけで、特定の PDF がそれを満たすかは決して答えない — ファイルの検査は pdf-verify-mcp（validate_conformance / evaluate_policy）へ。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `section` | string (minLength 1) | 任意 |  | この節とその下位節に限定する。 |
| `level` | string | 任意 |  | 要求レベルで絞り込む（shall, shall not, should, should not, may）。 |

::: details 呼び出し例 — 「PDF 2.0 で増分更新は何を要求している？」（§7.5.6）
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `section`: `"7.5.6"`
- 配列: 先頭だけ残す。PDF 由来の折返しは空白に畳む

節番号は [`search_spec`](#search-spec) の先頭ヒット（§7.5.6）です。`level` を省略すると shall / may などが混在して返ります。

**パラメータ**

```jsonc
{
  "section": "7.5.6"
}
```

**返る JSON**

```jsonc
{
  "filter": { "section": "7.5.6", "level": "all" },
  "totalRequirements": 10,
  "statistics": { "shall": 8, "may": 2 },
  "requirements": [
    {
      "id": "R-7.5.6-1",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "When updating a PDF file incrementally, changes shall be appended to the end of the file, leaving its original contents intact."
    },
    {
      "id": "R-7.5.6-2",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "A cross-reference section for an incremental update shall contain entries only for objects that have been changed, replaced, or deleted."
    }
    // … 残り 8 件。適合の必要条件は shall だけ
  ]
}
```

`text` は原文のままなので、引用に使えます。これは規格の要求です。検証対象の PDF がそれを満たすかは、pdf-verify-mcp の `validate_conformance` / `evaluate_policy` の答えです。
:::

## get_definitions

**Get term definitions**

PDF 仕様（ISO 32000-2）の第 3 節から用語定義を取得する。用語・定義文・注記・出典付きの構造化定義を返す。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `term` | string (minLength 1) | 任意 |  | この用語に一致する定義に絞り込む。 |

## get_tables

**Extract tables**

PDF 仕様（ISO 32000-2）の指定節から表構造を抽出する。ヘッダ・行・キャプション（任意）付きで表を返す。親節を指定するとサブツリー全体（全下位節）の表が返る。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `section` | string (minLength 1) | **必須** |  | 表を含む節の番号。 |
| `table_index` | integer (0–9007199254740991) | 任意 |  | この表だけを返す（0 始まり）。省略時は節内の全表。 |

## compare_versions

**Compare PDF 1.7 and PDF 2.0**

PDF 1.7（ISO 32000-1）と PDF 2.0（ISO 32000-2）の節を比較する。一致（同一または移動）・追加（2.0 で新設）・削除（2.0 に無い）を返す。タイトルベースの自動マッチングを使う。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `section` | string (minLength 1) | 任意 |  | この節のサブツリーに比較を限定する。 |

::: details 呼び出し例 — 「増分更新の節は PDF 1.7 と 2.0 でどう変わった？」
- 実測: v0.6.0
- `section`: `"7.5.6"`
- 前提: PDF 1.7 と 2.0 の両ファイルが `PDF_SPEC_DIR` にある

**パラメータ**

```jsonc
{
  "section": "7.5.6"
}
```

**返る JSON**

```jsonc
{
  "totalMatched": 1,
  "totalAdded": 0,
  "totalRemoved": 0,
  "matched": [
    {
      "section17": "7.5.6",
      "section20": "7.5.6",
      "title": "Incremental updates",
      "status": "same"
    }
  ],
  "added": [],
  "removed": []
}
```

節番号とタイトルは 1.7 と 2.0 で同じです。本文の差分までは返しません。要求の中身を見るなら、その節の [`get_requirements`](#get-requirements) を両仕様（`spec: "pdf17"` と省略時の `iso32000-2`）で取ります。
:::
