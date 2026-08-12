---
description: ISO 32000 系仕様書の構造化参照 MCP — 条文・要件（shall/should/may）・定義・表・版間比較。ファイルは開かず判定もしない
---

# pdf-spec-mcp

> **正典の層 (norm)** — 仕様の「条文」を引く参照サーバー。ルールエンジンではない。**PDF ファイルを開くことはなく、準拠判定もしない**（判定は pdf-verify）。

- npm: [`@shuji-bonji/pdf-spec-mcp`](https://www.npmjs.com/package/@shuji-bonji/pdf-spec-mcp) / 現行 v0.4.5 / [GitHub](https://github.com/shuji-bonji/pdf-spec-mcp)
- このページは責務と使いどころの**解説**。全ツールの引数・戻り値は[ツールリファレンス](/ja/reference/mcp/pdf-spec)（`tools/list` から自動生成）へ
- ISO 32000-1/-2、ISO TS 32001〜32005、PDF/UA-1/-2、Tagged PDF ガイド等 **17 文書**を横断検索・構造化取得

## しないこと

- ファイル検査・準拠判定・ビジネスルール定義
- ISO 19005 (PDF/A)・ETSI PAdES はコーパス外（`list_specs` → `coverage.gaps` 参照）。**検索ヒットなし = 要求が存在しない、ではない**

## インストール

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

`PDF_SPEC_DIR`（必須）に PDF Association の sponsored 版仕様 PDF を配置。ファイル名パターンで自動判別される。**中核文書はすべて正規ルートで無償入手できる** — 入手先と手順は[導入手順 Step 2](/ja/guide/getting-started) を参照。コーパスが無いと本サーバーは 1 問も答えられない。

## 共通引数

多くのツールが `spec`（Spec ID。例 `"iso32000-2"` / `"pdf17"`。省略時は既定の ISO 32000-2）を受け取る。ID の一覧は `list_specs` で得られる。

## 出力の読み方 — 3 種類の「返しもの」

このサーバーの出力は大きく **仕様条文**・**要件**・**定義** の 3 種類に分かれる。どれも「規格が何と書いているか」の構造化であり、あなたのファイルについて何かを言うものではない。

::: tip 前提知識: ISO 規格の文書規約
NOTE は規範ではない・shall だけが適合の必要条件・定義は日常語を上書きする — といった ISO 共通の読み方を知らないと出力を誤読しやすいため、先に [ISO 仕様書の読み方（入門）](/ja/reference/iso-reading-primer) に目を通すことを勧める。
:::

### 仕様条文（`get_section` の出力）

節の本文を、原文の見た目ではなく**要素の列**として返す。

```jsonc
{
  "sectionNumber": "14.9.4",
  "title": "Replacement text",
  "pageRange": { "start": 812, "end": 814 },
  "content": [
    { "type": "heading",   "level": 4, "text": "…" },
    { "type": "paragraph", "text": "…" },
    { "type": "list",      "items": ["…"] },
    { "type": "table",     "headers": ["Key", "Type", "Value"], "rows": [["…"]] },
    { "type": "note",      "label": "NOTE 2", "text": "…" },   // NOTE/EXAMPLE は本文と区別される
    { "type": "code",      "text": "…" }
  ]
}
```

読み方のポイント: `content` は文書順である。**NOTE / EXAMPLE は `note` 要素として本文（paragraph）と区別される** — ISO では NOTE は参考情報であり規範的要求ではないため、根拠として引用する際はこの区別が効く。表は `table` 要素として構造のまま返るので、値の対応（キー・型・意味）を LLM が読み違えにくくなっている。

### 要件（`get_requirements` の出力）

条文の中から **shall / shall not / should / should not / may** を含む規範文だけを抽出し、1 文 = 1 要件で返す。

```jsonc
{
  "filter": { "section": "14.9.4", "level": "shall" },
  "totalRequirements": 12,
  "statistics": { "shall": 8, "should": 3, "may": 1 },   // レベル別の件数
  "requirements": [
    {
      "id": "iso32000-2-14.9.4-003",       // 引用・追跡用の安定 ID
      "level": "shall",                     // ISO/IEC Directives Part 2 準拠の 5 段階
      "text": "…shall be used only for…",  // 原文そのまま（改変しない — 引用可能）
      "section": "14.9.4",
      "sectionTitle": "Replacement text",
      "source": "table",                    // 表由来の要件のみ付く。無ければ地の文由来
      "table": "Table 182 — Entries in …", // 表由来の場合の文脈（どの表のどのエントリか）
      "key": "Subtype"
    }
  ]
}
```

読み方のポイント: `level` の 5 段階は義務（shall）・禁止（shall not）・推奨（should）・非推奨（should not）・許容（may）で、**shall だけが適合の必要条件**である。`text` は原文のまま返るのでそのまま引用できる。`source: "table"` 付きの要件は表のセルから持ち上げた文で、単独では意味が取れないため `table` / `key`（どの表のどのエントリを縛る要件か）が併記される — 引用時はこの文脈ごと示してください。

::: warning 要件 ≠ 判定
要件は「規格の要求」であって、特定の PDF がそれを満たすかは別問題である。ファイルの検査は pdf-verify へ。また、抽出は ISO 32000-2 等のコーパス内に限られる — PDF/A の要件がここに出ないのは「存在しない」からではない。
:::

### 定義（`get_definitions` の出力）

規格の第 3 節（Terms and definitions）から用語定義を返す。

```jsonc
{
  "totalDefinitions": 1,
  "searchTerm": "tagged PDF",
  "definitions": [
    {
      "term": "tagged PDF",
      "definition": "…",              // 定義本文（原文）
      "section": "3.66",              // 定義の節番号（引用用）
      "notes": ["Note 1 to entry: …"], // 定義に付随する注記（あれば）
      "source": "ISO 32000-2"          // 出典
    }
  ]
}
```

読み方のポイント: ISO の定義は**その規格の中での用語の意味を確定させる規範的な文**である。日常語と意味がずれる用語（例: conforming reader / interactive form / artifact）ほど、議論の前にここで確定させる価値がある。`notes` は定義への補足（Note to entry）で、定義本文とは区別される。

## ツール一覧

| ツール | 一行説明 |
|---|---|
| [`list_specs`](#list-specs) | 発見済み仕様の一覧とカバレッジ（gaps 含む） |
| [`get_structure`](#get-structure) | 目次構造の取得 |
| [`get_section`](#get-section) | 条番号指定で本文取得 |
| [`search_spec`](#search-spec) | キーワード横断検索 |
| [`get_requirements`](#get-requirements) | shall / should / may 要求事項の抽出 |
| [`get_definitions`](#get-definitions) | 用語定義の取得 |
| [`get_tables`](#get-tables) | 規格中の表の構造化取得 |
| [`compare_versions`](#compare-versions) | PDF 1.7 ↔ 2.0 の条文比較 |

## ツール別マニュアル

### list_specs

利用可能な仕様文書の一覧を返す。文書 ID・タイトル・ページ数・カテゴリに加え、**`coverage.gaps`（このコーパスに存在しない規範領域 = PDF/A, PAdES）**を返す。「要求が存在しない」と結論づける前に必ず gaps を読むこと。返された ID を他ツールの `spec` 引数に使う。

| 引数 | 型 | 説明 |
|---|---|---|
| `category` | string | カテゴリで絞り込み（standard / ts / pdfua / guide / appnote） |

### get_structure

仕様の目次（節番号・タイトル・ページ番号）を階層で返す。

| 引数 | 型 | 説明 |
|---|---|---|
| `spec` | string | Spec ID。省略時は既定 |
| `max_depth` | integer | 返す見出し深さの上限（1–10） |

### get_section

指定した節の本文を構造化して返す（見出し・段落・リスト・表・注記）。**親節を指定するとサブツリー全体**（全下位節を文書順で）が返るため、上位の節は応答が非常に大きくなりえる — 分かっている最も具体的な節番号を使うこと。

| 引数 | 型 | 説明 |
|---|---|---|
| `spec` | string | Spec ID。省略時は既定 |
| `section` **必須** | string | 節番号。例 `"12.5.6.10"` / `"Annex A"` |

### search_spec

キーワード・フレーズで仕様を検索し、該当節とスニペットを返す。初回は検索インデックス構築のため数秒かかることがある。まず完全フレーズ、次に単語 AND でマッチする。

::: warning ヒット 0 件の意味
「このコーパスでは答えられない」であって「そのような要求は存在しない」では**ない**。PDF/A・PAdES はコーパス外である。
:::

| 引数 | 型 | 説明 |
|---|---|---|
| `spec` | string | Spec ID。省略時は既定 |
| `query` **必須** | string | 検索語 |
| `max_results` | integer | 最大件数（1–50） |

### get_requirements

**あなたのファイルではなく「規格」を読む。** 規範的要求（shall / must / may）を文脈・節・要求レベル付きで抽出する。仕様が何を要求するかを教えるだけで、特定の PDF がそれを満たすかは決して答えない — ファイルの検査は pdf-verify の `validate_conformance` / `evaluate_policy` へ。

| 引数 | 型 | 説明 |
|---|---|---|
| `spec` | string | Spec ID。省略時は既定 |
| `section` | string | この節とその下位に限定 |
| `level` | string | 要求レベルで絞り込み（shall / shall not / should / should not / may） |

### get_definitions

仕様の第 3 節から用語定義（用語・定義文・注記・出典）を返す。

| 引数 | 型 | 説明 |
|---|---|---|
| `spec` | string | Spec ID。省略時は既定 |
| `term` | string | この用語に一致する定義に絞り込み |

### get_tables

指定節の表をヘッダ・行・キャプション付きで構造化して返す。親節を指定するとサブツリー全体の表が返る。

| 引数 | 型 | 説明 |
|---|---|---|
| `spec` | string | Spec ID。省略時は既定 |
| `section` **必須** | string | 表を含む節番号 |
| `table_index` | integer | この表のみ返す（0 始まり）。省略時は節内の全表 |

### compare_versions

PDF 1.7 (ISO 32000-1) と PDF 2.0 (ISO 32000-2) の節を比較し、一致（同一・移動）・追加（2.0 で新設）・削除（2.0 に無い）を返す。タイトルベースの自動マッチングである。

::: warning
`PDF_SPEC_DIR` に PDF 1.7（`PDF32000_2008.pdf`）と PDF 2.0 の両ファイルが必要である。
:::

| 引数 | 型 | 説明 |
|---|---|---|
| `section` | string | この節サブツリーに比較を限定 |
