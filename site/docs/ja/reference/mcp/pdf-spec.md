---
description: "pdf-spec-mcp v0.6.0 の全 8 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-spec-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
**v0.6.0** の `tools/list` ハンドシェイクから自動生成（8 ツール・2026-08-31）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
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

## search_spec

**Search the specification**

PDF 仕様（ISO 32000-2）をキーワード・フレーズで検索する。該当節を文脈スニペット付きで返す。初回は検索インデックス構築のため数秒かかることがあるが、構築した索引はディスクにキャッシュされ、以後のプロセスは温まった状態で始まる。ヒット 0 件は「このコーパスでは答えられない」であって「そのような要求は存在しない」では**ない** — ISO 19005（PDF/A）と ETSI PAdES はコーパス外である（list_specs → coverage.gaps を参照）。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `query` | string (minLength 1) | **必須** |  | 検索語。まず完全フレーズ、次に単語の AND でマッチする。 |
| `max_results` | integer (1–50) | 任意 |  | 返すヒットの最大数（1-50）。 |

## get_requirements

**Extract normative requirements**

あなたのファイルではなく**規格**を読む。PDF 仕様（ISO 32000-2）から規範的要求（shall/must/may）を抽出する。文の文脈・節・要求レベル付きの構造化要求を返す。仕様が何を要求するかを教えるだけで、特定の PDF がそれを満たすかは決して答えない — ファイルの検査は pdf-verify-mcp（validate_conformance / evaluate_policy）へ。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `spec` | string (minLength 1) | 任意 |  | Spec ID（例: "iso32000-2"・"pdf17"）。省略時は既定の仕様。 |
| `section` | string (minLength 1) | 任意 |  | この節とその下位節に限定する。 |
| `level` | string | 任意 |  | 要求レベルで絞り込む（shall, shall not, should, should not, may）。 |

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
