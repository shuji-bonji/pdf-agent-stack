---
description: PDF Agent Stack の全体構成と各 MCP の責務境界 — 独立した 4 つの MCP と呼び出し順を決める Skill、4 層モデル、宣言・準拠・検証の区別、言い切り強度 T1/T2/T3、判定はコードが返し LLM は説明文だけを書く
---

# 全体構成と責務

PDF Agent Stack は、互いに依存しない 4 つの MCP サーバーと、それらを呼ぶ順番と結果の読み方を決める 3 つの Skill で構成されます。各 MCP は単独で動きます。

## 全体構成

```mermaid
graph LR
  AGENT(["AI エージェント<br>(Claude Code / Desktop など)"])

  subgraph FAMILY["PDF Agent Stack"]
    direction TB
    subgraph SKILL["Skill — 呼び出し順と結果の読み方"]
      TRUST{{"pdf-trust<br>受入監査"}}
      PUBLISH{{"pdf-publish<br>納品パイプライン"}}
      READ{{"pdf-read<br>読み取りパイプライン"}}
    end
    subgraph MCP["MCP — 計算・暗号（各サーバーは独立）"]
      SPEC[["pdf-spec<br>仕様の原文を引く"]]
      READER[["pdf-reader<br>入っているものを返す"]]
      VERIFY[["pdf-verify<br>本物か・適合かを判定する"]]
      WRITER[["pdf-writer<br>生成・編集する"]]
    end
    SKILL --> MCP
  end

  IN[/"受け取った PDF"/] --> AGENT
  NEED[/"作りたい PDF"/] --> AGENT
  DOC[/"読みたい PDF"/] --> AGENT
  AGENT <--> FAMILY
  FAMILY --> OUT(["Trust / Publish / Read Report<br>検証済み・納品可能な PDF と、取り出した内容"])

  SPECDOC[("ISO 32000 ほか<br>17 文書")] -.-> SPEC
  VERA[("veraPDF")] -.-> VERIFY
```

図中の形は要素の種別を表します（→ [図の読み方](/ja/reference/glossary#図の読み方-形の凡例)）。

エージェントは MCP を直接呼んでもよいですし、Skill を入れてもかまいません。Skill を入れると、複数の MCP を**どの順に呼び、返ってきた判定をどう読み、どの形式のレポートにまとめるか**が決まります。

外部依存は 2 つだけです。pdf-spec は仕様 PDF のコーパス（手元に集めた仕様原文の束。再配布不可のため同梱しない）を、pdf-verify は PDF/A・PDF/UA の判定を委ねる veraPDF を必要とします。reader と writer は外部に依存しません。

## 4 層モデル — どの Skill がどの MCP を呼ぶか

```mermaid
graph TB
  subgraph Skills["Skill 層（呼び出し順を決める）"]
    TRUST{{"pdf-trust<br>受入監査"}}
    PUBLISH{{"pdf-publish<br>検証してから納品"}}
    READ{{"pdf-read<br>読み取りパイプライン"}}
  end
  subgraph MCPs["MCP 層（独立・単独完結）"]
    SPEC[["pdf-spec-mcp<br>正典 (norm)<br>仕様の原文を引く"]]
    READER[["pdf-reader-mcp<br>実体 (fact)<br>ファイルに入っているものを返す"]]
    VERIFY[["pdf-verify-mcp<br>真正性・準拠性 (judgment)<br>本物で規格に適っているか"]]
    WRITER[["pdf-writer-mcp<br>生成 (production)<br>仕様通りに書けるか"]]
  end
  TRUST -.->|呼ぶ| VERIFY & READER & SPEC
  PUBLISH -.->|呼ぶ| WRITER & READER & VERIFY
  READ -.->|呼ぶ| READER
```

| 層                               | サーバー   | 返すもの                                          | やらないこと                                                                |
| -------------------------------- | ---------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| 正典（= 判定の基準となる規格の原文） | pdf-spec   | 規格条文・要求事項（shall/should/may）            | 検証対象の PDF を開かない（読むのは自分の仕様コーパスだけ）。準拠判定しない |
| 実体（= ファイルに実際に入っているもの） | pdf-reader | 観測結果（テキスト・構造・署名フィールド）        | **合否を言わない**。暗号検証しない                                          |
| 真正性・準拠性                   | pdf-verify | 判定（署名・改ざん・PDF/A・PDF/UA・4 値ポリシー） | **規格どおりであることは証明しない — 条文に反する箇所を見つけることしかできない**   |
| 生成                             | pdf-writer | 新規・編集済み PDF                                | 署名しない。ラベルは書けるが**規格どおりにはできない**                      |

## 境界ルール（1 行）

> ISO 規格等に照らした compliant / valid / pass-fail を返すなら **verify**、観測を返すだけなら **reader**。

## 宣言・準拠・検証の三区別

PDF Agent Stack のすべてのツールと Skill が、この 3 つを区別して書き分けます。

- **宣言 (declaration)** — ファイルが自分で書いたラベル。「私は PDF/A です」とメタデータに書いてあるだけ。書いてあることは、証拠にならない
- **準拠 (conformance)** — 規格どおりであること。全部を証明する手段はなく、条文に反する箇所を見つけることしかできない
- **検証 (validation)** — 検証器（veraPDF など）が、自分の持っている検査項目で見た結果。パスは「この検査では落ちなかった」であり、規格に準拠している、ではない

したがって writer の `ensure_pdfa` は XMP に宣言を書くツールであり、書いたあとは必ず verify の `validate_conformance` で測ります。

### 検証器の出力は証拠ではなく判定です

外部の設計論では、「証拠（何を見たか）」の例として「検証器の出力」「署名検証」を挙げることがあります。PDF Agent Stack ではこの 2 つを分けます。

| | 誰が出すか | 例 |
| --- | --- | --- |
| 観測 (証拠) | reader | XMP に `pdfaid` の宣言がある。増分更新が 2 回ある。文書内に失効情報が無い |
| 判定 | verify | `use_with_caution`。発火したのは `POL-CAUTION-REVOCATION-UNKNOWN` |

veraPDF の結果も観測ではありません。「veraPDF がこのプロファイルで違反を報告しなかった」は観測ですが、それを受入プロファイルに照らして値にするのは `evaluate_policy` です。

次の 3 行は別のことを言っています。混ぜると、一番下だけが残ります。

- **観測**: XMP に PDF/A の宣言があり、veraPDF が当該プロファイルで違反を報告しなかった
- **判定**: この検査では落ちなかった（`use_with_caution`。検査項目の外は測っていない）
- **誤った要約**: PDF/A に準拠している

### 4 値を 3 値にまとめると何が消えるか

`evaluate_policy` の値は 4 つです。yes / no / unknown の 3 値にまとめると、次の 2 行が消えます。

| 4 値 | 3 値にまとめると | 消えるもの |
| --- | --- | --- |
| `trust_and_use` | yes | — |
| `use_with_caution` | yes | 用途制限。留意事項付きで使う、が「そのまま使える」になる |
| `human_review_required` | unknown | 「証拠が無い」と「基準が書けない」の区別。後者が人に届かなくなる |
| `reject` | no | — |

3 行目が要点です。`human_review_required` は「判定に必要な事実が欠けている」と「基準が書けない領域」の両方を受けます。unknown の 1 値にまとめると、後者が「事実を足せば解決する項目」として扱われ、いつまでも人に回りません。**3 値からは 4 値に戻せません。**

## 受け取る PDF と作る PDF は、どちらも verify を通る

全体構成図の 3 本の入力のうち 2 本（受け取った PDF / 作りたい PDF）は、最後に pdf-verify の判定を受けます。

| 入力         | Skill                                 | 流れ                                         | `reject` のとき |
| ------------ | ------------------------------------- | -------------------------------------------- | --- |
| 受け取った PDF | [pdf-trust](/ja/skills/pdf-trust)     | 監査 → 4 値判定 → 利用・保存           | 使わない。Trust Report に理由を書く |
| 作りたい PDF | [pdf-publish](/ja/skills/pdf-publish) | write → read-back → verify（品質ゲート） → 納品 | 納品しない。Publish Report に理由を書く |

3 本目の入力（読みたいだけの PDF）は verify を通りません。[pdf-read](/ja/skills/pdf-read) が読み方を選び、読んだ範囲と読めなかった箇所を Read Report に書きます。受け入れるかどうかも納品するかどうかも決めないので、verify の判定は要りません。

4 値判定（trust_and_use / use_with_caution / human_review_required / reject）は `evaluate_policy` のルールエンジンが返します。決定論的、つまり同じ入力なら常に同じ結果です。LLM が書くのは、その判定の説明と推奨アクションだけで、判定そのものを LLM は変えません。

## 言い切り強度（T1/T2/T3）

検証結果を「準拠している」と断定できるか、検証器の判定文を引くだけにとどめるかは、規格の原文が手元にあるかで変わります。この等級を言い切り強度と呼びます。

| Tier | 規格                               | 言える強さ                                                  |
| ---- | ---------------------------------- | ----------------------------------------------------------- |
| T1   | ISO 32000-1/-2, ISO 14289 (PDF/UA) | 条文を引用して言い切る                                      |
| T2   | ISO 19005 (PDF/A)                  | 「veraPDF が COMPLIANT と判定した」とだけ言う               |
| T3   | ETSI PAdES                         | 構造の観測として「B-LT 相当の構造」と言う。準拠とは言わない |

本サイトの文章もこのルールに従って書かれています。
