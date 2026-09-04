---
description: ISO 32000 系仕様書の構造化参照 MCP — 条文・要件（shall/should/may）・定義・表・版間比較。ファイルは開かず判定もしない
---

# pdf-spec-mcp

**PDF の仕様書を AI が引けるようにするサーバーです。** ISO 32000-1/-2、ISO TS 32001〜32005、PDF/UA-1/-2、Tagged PDF ガイドなど 17 文書を横断検索し、条文・要求事項（shall/should/may）・定義・表を構造化して返します。

- npm: [`@shuji-bonji/pdf-spec-mcp`](https://www.npmjs.com/package/@shuji-bonji/pdf-spec-mcp) / 現行 v0.6.0 / [GitHub](https://github.com/shuji-bonji/pdf-spec-mcp)
- このページは責務と使いどころの解説です。全ツールの引数・戻り値は[ツールリファレンス](/ja/reference/mcp/pdf-spec)（`tools/list` から自動生成）へ

::: warning 仕様 PDF は同梱していません
`PDF_SPEC_DIR` に、無償入手できる原文をご自身で配置してください（→ [導入手順 Step 2](/ja/guide/getting-started)）  
**コーパスとなる中核文書はすべて正規ルートで無償入手できます。**  
このコーパスが無いと、このサーバーは検索できません。
:::

## これ 1 台でできること

「PDF 2.0 で増分更新は何を要求している？」、「タグ付き PDF の読み順はどの条文？」といった**仕様の疑問に、LLMが原文を引いて答えられる**ようになります。  
1,000 ページ近い ISO 規格を人が探す代わりに、AI が条文 ID 付きで示します。  
実装や監査の判断を、記憶や検索エンジンではなく規格原文に着地させたいときに使います。

## Skill 連携でできること

このMCPサーバーは、4 つの層（MCPサーバー）のうち**正典**（= 正しさの基準となる原文）の層にあり、「規格が何を要求するか」のみを供給します。  
判定は pdf-verify、観測は pdf-reader、生成は pdf-writer の仕事です。

```mermaid
graph LR
  CORPUS[("仕様 PDF 17 文書<br>利用者が配置")] --> SPEC
  TARGET[/"検査・生成の対象 PDF"/] --> READER & VERIFY & WRITER

  subgraph SELF["このMCPサーバー"]
    SPEC[["pdf-spec-mcp<br>正典: 規格が何を要求するか"]]
  end

  READER[["pdf-reader-mcp<br>実体"]]
  VERIFY[["pdf-verify-mcp<br>判定"]]
  WRITER[["pdf-writer-mcp<br>生成"]]

  TRUST{{"pdf-trust<br>受入監査"}} -.->|編成| SPEC & VERIFY & READER
  PUBLISH{{"pdf-publish<br>納品パイプライン"}} -.->|編成| SPEC & VERIFY & WRITER
```

図中の形は要素の種別を表します（→ [図の読み方](/ja/reference/glossary#図の読み方-形の凡例)）  
**検証対象の PDF は、このサーバーには渡しません。**  
参照するのは、`PDF_SPEC_DIR` に、ご自身で配置した仕様 PDF だけです。

| Skill                                 | このサーバーの役割                                           | 必須か |
| ------------------------------------- | ------------------------------------------------------------ | ------ |
| [pdf-trust](/ja/skills/pdf-trust)     | 逸脱が見つかったとき、その根拠を ISO 32000 の条文 ID で示す  | 任意   |
| [pdf-publish](/ja/skills/pdf-publish) | 修正ループが上限に達したとき、残違反リストに条文根拠を添える | 任意   |

単体で使う主なユースケースは[仕様調査](/ja/use-cases/spec-research)です。

## できないこと

- **仕様PDFのコーパス以外の範囲は引けません。  
  例えば、** ISO 19005（PDF/A）・ETSI PAdES は収録していません。
- **ユーザが作成したファイルについては何も言えません。**  
  返すのは規格の文であって、特定の PDF がそれを満たすかは pdf-verify の答えです。
- `compare_versions` は PDF 1.7（`PDF32000_2008.pdf`）と PDF 2.0 の**両方**が配置されていないと動きません。

## しないこと

- ファイル検査・準拠判定・ビジネスルール定義

## インストール

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

`PDF_SPEC_DIR`（必須）に PDF Association の sponsored 版仕様 PDF を配置してください。ファイル名パターンで自動判別されます。入手先と手順は[導入手順 Step 2](/ja/guide/getting-started) を参照してください。

## コーパスのキャッシュ

v0.5.0 から、文書全体を走査する 2 つの操作は、初回構築のあとディスクにキャッシュされます。対象は `search_spec` の検索索引と、`section` を指定しない `get_requirements` の全走査です。以後のプロセスはこの 2 つに、6〜14 秒ではなく 1 秒未満で答えます。

置き場所の既定は `${XDG_CACHE_HOME:-~/.cache}/pdf-spec-mcp` で、コーパス全体で約 18 MB です。キーにサーバーの版・pdfjs の版・PDF の SHA-256 が入るので、更新やファイルの差し替えでは作り直します。キャッシュは利用者の PDF から利用者の機械上に作る派生物で、配布はしません。

全仕様の索引を先に構築する（1 分程度）

```sh
npx -y @shuji-bonji/pdf-spec-mcp@latest --build-cache
```

置き場所を変える・無効にする:

```jsonc
{
  "mcpServers": {
    "pdf-spec": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-spec-mcp@latest"],
      "env": {
        "PDF_SPEC_DIR": "/path/to/pdf-specs",
        "PDF_SPEC_CACHE_DIR": "/path/to/cache",
        "PDF_SPEC_CACHE": "off",
      },
    },
  },
}
```

## 共通引数

多くのツールが `spec`（Spec ID, 例 `"iso32000-2"` / `"pdf17"`, 省略時は既定の ISO 32000-2）を受け取ります。
ID の一覧は `list_specs` で得られます。

## 出力の 3 種類

出力は大きく **仕様条文**・**要件**・**定義** の 3 つに分かれます。

| 種類                                         | 説明                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **仕様条文**（`get_section` / `get_tables`） | 節の本文を、見出し・段落・リスト・表・注記の**要素の列**として返します。NOTE / EXAMPLE は本文と別の要素になります                 |
| **要件**（`get_requirements`）               | 条文中の shall / shall not / should / should not / may を含む規範文を 1 文 = 1 要件で返します。**shall だけが適合の必要条件**です |
| **定義**（`get_definitions`）                | 第 3 節（Terms and definitions）の用語定義を返します。規格上の意味が日常語と違う用語は、議論の前にここで定義を確認してください    |

どれも「規格が何と書いているか」の構造化であり、あなたのファイルについて何かを言うものではありません。JSON の形と読み違えやすい箇所は [pdf-spec の出力の読み方](/ja/reference/pdf-spec-output) にまとめてあります。

::: tip 前提知識: ISO 規格の文書規約
NOTE（注記）と EXAMPLE（例）は参考情報であり、要求事項ではありません。また要求レベルには、 shall / should / may / can
とあり、shall だけが適合の必要条件です。こうした ISO 共通の読み方を知らないと出力を誤読しやすいため、先に [ISO 仕様書の読み方（入門）](/ja/reference/iso-reading-primer) に目を通すことをお勧めします。
:::

## ツール一覧

引数・型・既定値は[ツールリファレンス](/ja/reference/mcp/pdf-spec)にあります（`tools/list` から自動生成）。

| ツール                                                            | 一行説明                                    |
| ----------------------------------------------------------------- | ------------------------------------------- |
| [`list_specs`](/ja/reference/mcp/pdf-spec#list-specs)             | 発見済み仕様の一覧とカバレッジ（gaps 含む） |
| [`get_structure`](/ja/reference/mcp/pdf-spec#get-structure)       | 目次構造の取得                              |
| [`get_section`](/ja/reference/mcp/pdf-spec#get-section)           | 条番号指定で本文取得                        |
| [`search_spec`](/ja/reference/mcp/pdf-spec#search-spec)           | キーワード横断検索                          |
| [`get_requirements`](/ja/reference/mcp/pdf-spec#get-requirements) | shall / should / may 要求事項の抽出         |
| [`get_definitions`](/ja/reference/mcp/pdf-spec#get-definitions)   | 用語定義の取得                              |
| [`get_tables`](/ja/reference/mcp/pdf-spec#get-tables)             | 規格中の表の構造化取得                      |
| [`compare_versions`](/ja/reference/mcp/pdf-spec#compare-versions) | PDF 1.7 ↔ 2.0 の条文比較                    |

## 使い方の要点

各ツールの「プロンプト → 引数 → 返る JSON」は [ツールリファレンス](/ja/reference/mcp/pdf-spec) の該当ツール末尾にあります。JSON の形は [pdf-spec の出力の読み方](/ja/reference/pdf-spec-output)、一連の流れは[仕様調査](/ja/use-cases/spec-research)です。

### 手元のコーパスを先に見る

最初に `list_specs` を呼びます。何が入っていて、何が入っていないかは `coverage.gaps` に出ます。PDF/A と PAdES はコーパスの外です。「その要求は無い」と言う前に、gaps を読んでください。

### 条文の本文を取る

見たい節の番号が分かっているときは `get_section` です。分かっていないときは `search_spec` で探します。

`get_section` に親の節を渡すと、その下の節が文書の順ですべて返ります。章の番号だけを指定すると、応答が大きくなりすぎます。分かっている範囲で、いちばん細い番号を使ってください。

`search_spec` は、まずフレーズそのもの、次に単語の AND で当たります。コーパスは英語なので、検索語も規格の英語にします。

::: warning ヒットが 0 件のとき
「このコーパスでは答えられない」という意味です。「そのような要求は存在しない」ではありません。PDF/A と PAdES はコーパスの外です。
:::

### 要求事項だけを抜く

shall / should / may だけが欲しいときは `get_requirements` です。`level` で絞れます。読むのは**規格**であって、手元の PDF ではありません。そのファイルが満たすかどうかは、pdf-verify の `validate_conformance` と `evaluate_policy` が答えます。

### 1.7 と 2.0 の違いを見る

`compare_versions` は、節のタイトルを手がかりに PDF 1.7 と 2.0 を対応づけ、次の 3 種を返します。

| 種類 | 意味 |
| --- | --- |
| 一致 | 同じ節、または場所が変わった節 |
| 追加 | 2.0 で新しくできた節 |
| 削除 | 2.0 に無い節 |

PDF 1.7 と 2.0 の両方のファイルが `PDF_SPEC_DIR` に必要です。
