---
description: ISO 仕様書の読み方入門 — NOTE は規範ではない・shall だけが適合の必要条件・定義は日常語を上書きする、等の読解規約
---

# ISO 仕様書の読み方（入門）

pdf-spec-mcp が返す「条文・要件・定義」を正しく解釈するには、ISO 規格に共通する文書規約を少し知っておく必要があります。このページは PDF Agent Stack を使ううえで必要な最小限だけをまとめた入門です。

## 1. 規格書の標準構成

ISO 規格はどれもほぼ同じ骨格を持ちます。

| 節 | 内容 | 規範性 |
|---|---|---|
| 1 Scope | 適用範囲 | 規範 |
| 2 Normative references | この規格が引用する他規格（引用部分は本文と同格） | 規範 |
| 3 Terms and definitions | 用語定義。**この規格内での意味を確定させる** | 規範 |
| 4〜 本文 (Clauses) | 要求事項の本体 | 規範 |
| Annex A, B, … | 附属書。**(normative) / (informative) の表記で規範性が変わる** | 表記による |
| Bibliography | 参考文献 | 参考 |

番号は `14` (clause) → `14.9` (subclause) → `14.9.4` と深くなります。`get_section` の `section` 引数はこの番号で、親番号を渡すとサブツリー全体が返ります。

## 2. 規範 (normative) と参考 (informative) の区別

**規格の文章はすべてが「要求」ではありません。** ここを混同すると、参考情報を根拠に「仕様違反」と言ってしまう事故が起きます。

- **NOTE**（注記）と **EXAMPLE**（例）は**参考情報**であり、要求事項を含みません（含んではならない、と ISO/IEC 専門業務用指針で定められています）
- 脚注も参考情報です
- Annex は表題の `(normative)` / `(informative)` で判別します

pdf-spec-mcp はこの区別を構造で保存しています: `get_section` の出力で NOTE / EXAMPLE は `note` 要素として `paragraph`（本文）と分離され、`get_requirements` は規範文だけを抽出します。**`note` 要素の文を根拠として引用しない**でください。

## 3. 要求レベル — shall / should / may / can

ISO/IEC 専門業務用指針 Part 2 が助動詞の意味を厳密に定めています。

| 助動詞 | 意味 | 適合との関係 |
|---|---|---|
| **shall** / shall not | 要求・禁止 | **適合の必要条件。違反 = 不適合** |
| **should** / should not | 推奨・非推奨 | 従わなくても不適合ではない |
| **may** | 許容（してもよい） | 実装の自由 |
| **can** / cannot | 可能性・能力の記述 | 要求ではない（許可の意味でもない） |

- 日常英語の "must" は ISO の規範文では使いません（外部制約の記述に限定）。要求は常に shall です
- `get_requirements` の `level` はこの 5 段階（shall / shall not / should / should not / may）に対応し、`statistics` でレベル別件数が返ります
- **適合性の議論で効くのは shall だけ**です。should 違反を「仕様違反」と書かないでください

## 4. 定義 (Clause 3) が日常語を上書きする

Terms and definitions は「その規格の中での意味」を確定させる規範的な節です。日常語と意味がずれる用語ほど注意が要ります。PDF 系でとくに重要な例:

- **PDF processor**（3.49）/ **PDF reader**（3.51）/ **PDF writer**（3.52） — PDF を書く・読む・更新する能動的な主体で、ソフトウェアに限りません。要求文の主語がファイルなのか処理系なのかで、shall が誰への要求かが変わります。ISO 32000-1 の *conforming reader / conforming writer* は ISO 32000-2 でこの語に置き換わったので、PDF 2.0 の条文に旧表記を当てると主語を取り違えます
- **running text**（3.59） — 見出し・脚注・図・吹き出しと**区別された**本文。日常語の「テキスト」より狭い概念です
- **object**（3.44） — PDF ファイルを構成する基本データ構造で、9 種（array, boolean, dictionary, integer, name, null, real, stream, string）ちょうど。プログラミングの「オブジェクト」ではありません
- **deprecated**（3.15） — PDF 2.0 文書には**書くべきでない**、かつ処理系は**無視すべき**もの。「削除された」ではありません

`get_definitions` が返すのは Clause 3 で、ISO 32000-2 では 71 件（3.1〜3.71）です。**PDF 用語らしく見えても Clause 3 に無い語は多くあります**。たとえば *artifact* と *annotation* は本文側の定義（§14.8.2.2 "Real content and Artifacts"、§12.5 "Annotations"）なので `get_definitions` では 0 件になり、`search_spec` / `get_section` から入ります。0 件は「Clause 3 に無い」であって「定義が無い」ではありません。定義に付く `notes`（Note to entry）は定義本文への補足で、これも本文とは区別されます。

## 5. 要求文の主語を見る — ファイルへの要求か、処理系への要求か

ISO 32000 の shall には 2 方向あります。

- 「The value **shall** be …」→ **PDF ファイル**への要求（検証器がファイルを検査できます）
- 「A PDF reader **shall** …」（ISO 32000-1 では「A conforming reader shall …」）→ **処理系**への要求（ファイルを見ても適合は判定できません）

pdf-verify が検査できるのは前者だけです。後者を根拠に「この PDF は違反」とは言えません。条文を引用するときは主語まで含めて引用してください（`get_requirements` の `text` は原文のままなのでそのまま使えます）。

## 6. 表由来の要件は文脈ごと読む

ISO 32000 は要求の多くを**表**（例: Table 182 — Additional entries specific to text markup annotations）に持ちます。表のセルに書かれた「The type of annotation … shall be …」は、どの表のどのエントリの話かが分からないと意味が取れません。同じ文は複数の注釈の表に現れ、表ごとに縛る subtype が違います。`get_requirements` が `source: "table"` の要件に `table` / `key` を併記するのはこのためで、**引用時はこの文脈ごと示す**のが作法です。表そのものは `get_tables` で構造のまま取れます。

## 7. PDF 関連規格の地図

| 規格 | 内容 | コーパス |
|---|---|---|
| ISO 32000-1 (2008) | PDF 1.7 | ✅ `pdf17` |
| ISO 32000-2 (2020) | PDF 2.0（既定の参照先） | ✅ `iso32000-2` |
| ISO/TS 32001〜32005 | 拡張 TS（SHA-3・ECC 署名・AES-GCM 等） | ✅ |
| ISO 14289-1/-2 | PDF/UA（アクセシビリティ） | ✅ |
| ISO 19005 | PDF/A（長期保存） | ❌ **コーパス外** — 判定は veraPDF |
| ETSI EN 319 142 | PAdES（長期署名） | ❌ **コーパス外** — 構造観測のみ (T3) |

::: warning 検索ヒット 0 件の意味（再掲）
`search_spec` のヒット 0 件は「このコーパスでは答えられない」であって「要求が存在しない」ではありません。とくに PDF/A・PAdES の要求はここには**決して**出てきません。`list_specs` の `coverage.gaps` を確認してください。
:::

## 関連ページ

- [pdf-spec-mcp リファレンス](/ja/mcp/pdf-spec) — 各ツールの引数と出力
- [全体構成と責務](/ja/guide/architecture) — 言い切り強度 (T1/T2/T3)・宣言/準拠/検証の三区別
- [用語集](/ja/reference/glossary)
