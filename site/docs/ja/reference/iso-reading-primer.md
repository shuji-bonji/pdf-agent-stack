# ISO 仕様書の読み方（入門）

pdf-spec-mcp が返す「条文・要件・定義」を正しく解釈するには、ISO 規格に共通する文書規約を少し知っておく必要がある。このページは PDF Family を使ううえで必要な最小限だけをまとめた入門である。

## 1. 規格書の標準構成

ISO 規格はどれもほぼ同じ骨格を持つ。

| 節 | 内容 | 規範性 |
|---|---|---|
| 1 Scope | 適用範囲 | 規範 |
| 2 Normative references | この規格が引用する他規格（引用部分は本文と同格） | 規範 |
| 3 Terms and definitions | 用語定義。**この規格内での意味を確定させる** | 規範 |
| 4〜 本文 (Clauses) | 要求事項の本体 | 規範 |
| Annex A, B, … | 附属書。**(normative) / (informative) の表記で規範性が変わる** | 表記による |
| Bibliography | 参考文献 | 参考 |

番号は `14` (clause) → `14.9` (subclause) → `14.9.4` と深くなる。`get_section` の `section` 引数はこの番号で、親番号を渡すとサブツリー全体が返る。

## 2. 規範 (normative) と参考 (informative) の区別

**規格の文章はすべてが「要求」ではない。** ここを混同すると、参考情報を根拠に「仕様違反」と言ってしまう事故が起きる。

- **NOTE**（注記）と **EXAMPLE**（例）は**参考情報**であり、要求事項を含まない（含んではならない、と ISO/IEC 専門業務用指針で定められている）
- 脚注も参考情報である
- Annex は表題の `(normative)` / `(informative)` で判別する

pdf-spec-mcp はこの区別を構造で保存している: `get_section` の出力で NOTE / EXAMPLE は `note` 要素として `paragraph`（本文）と分離され、`get_requirements` は規範文だけを抽出する。**`note` 要素の文を根拠として引用しない**でください。

## 3. 要求レベル — shall / should / may / can

ISO/IEC 専門業務用指針 Part 2 が助動詞の意味を厳密に定めている。

| 助動詞 | 意味 | 適合との関係 |
|---|---|---|
| **shall** / shall not | 要求・禁止 | **適合の必要条件。違反 = 不適合** |
| **should** / should not | 推奨・非推奨 | 従わなくても不適合ではない |
| **may** | 許容（してもよい） | 実装の自由 |
| **can** / cannot | 可能性・能力の記述 | 要求ではない（許可の意味でもない） |

- 日常英語の "must" は ISO の規範文では使わない（外部制約の記述に限定）。要求は常に shall である
- `get_requirements` の `level` はこの 5 段階（shall / shall not / should / should not / may）に対応し、`statistics` でレベル別件数が返る
- **適合性の議論で効くのは shall だけ**である。should 違反を「仕様違反」と書かないこと

## 4. 定義 (Clause 3) が日常語を上書きする

Terms and definitions は「その規格の中での意味」を確定させる規範的な節である。日常語と意味がずれる用語ほど注意が要る。PDF 系でとくに重要な例:

- **conforming reader / conforming writer / conforming product** — 「適合する処理系」。要求文の主語がファイルなのか処理系なのかで、shall が誰への要求かが変わる
- **artifact** — 論理コンテンツに属さないページ装飾（ページ番号・柱など）。日常語の「成果物」ではない
- **annotation** — PDF ではページ上の注釈オブジェクト（リンクやフォームの Widget を含む）で、「コメント」より広い概念である

議論の前に `get_definitions` で確定させるのが安全である。定義に付く `notes`（Note to entry）は定義本文への補足で、これも本文とは区別される。

## 5. 要求文の主語を見る — ファイルへの要求か、処理系への要求か

ISO 32000 の shall には 2 方向ある。

- 「The value **shall** be …」→ **PDF ファイル**への要求（検証器がファイルを検査できる）
- 「A conforming reader **shall** …」→ **処理系**への要求（ファイルを見ても適合は判定できない）

pdf-verify が検査できるのは前者だけである。後者を根拠に「この PDF は違反」とは言えない。条文を引用するときは主語まで含めて引用してください（`get_requirements` の `text` は原文のままなのでそのまま使える）。

## 6. 表由来の要件は文脈ごと読む

ISO 32000 は要求の多くを**表**（例: Table 182 — Entries in an annotation dictionary）に持つ。表のセルに書かれた「The type of annotation … shall be …」は、どの表のどのエントリの話かが分からないと意味が取れない。`get_requirements` が `source: "table"` の要件に `table` / `key` を併記するのはこのためで、**引用時はこの文脈ごと示す**のが作法である。表そのものは `get_tables` で構造のまま取れる。

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
`search_spec` のヒット 0 件は「このコーパスでは答えられない」であって「要求が存在しない」ではない。とくに PDF/A・PAdES の要求はここには**決して**出てこない。`list_specs` の `coverage.gaps` を確認してください。
:::

## 関連ページ

- [pdf-spec-mcp リファレンス](/ja/mcp/pdf-spec) — 各ツールの引数と出力
- [全体構成と責務](/ja/guide/architecture) — 言い切り強度 (T1/T2/T3)・宣言/準拠/検証の三区別
- [用語集](/ja/reference/glossary)
