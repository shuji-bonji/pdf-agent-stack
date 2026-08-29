---
description: pdf-constraints — ISO 32000 の条文を機械検査できる制約テーブルに書き起こした共有ライブラリ。4 状態・given・違反の痕跡・veraPDF が見ない領域
---

# 制約テーブル (pdf-constraints)

- npm: `@shuji-bonji/pdf-constraints` / 現行 v0.4.0
- GitHub: [shuji-bonji/pdf-constraints](https://github.com/shuji-bonji/pdf-constraints)
- 形態: **ライブラリ**（MCP サーバーではない）

ISO 32000 の条文を「**ファイルが構造上どういう状態か**」という検査項目に書き起こした制約テーブルと、その決定論的（同じ入力なら常に同じ結果になる）評価器です。
MCP としての露出は pdf-verify の [`validate_clauses`](/ja/reference/mcp/pdf-verify#validate-clauses) が担います。
エージェントから使う分にはこのライブラリを直接意識する必要はありませんが、**何がどこまで検査されているか**を確かめたいときはここを見てください。

## どの穴を埋めるのか

veraPDF は PDF/A・PDF/UA を判定しますが、**ISO 32000 本体の条文違反は見ません**。
そこが空いているため、次のような `shall` 違反がビューアの警告として「無害」に分類されたまま残ることがあります。

> CFF フォントプログラムを `/FontFile2` に埋め込む
>
> ISO 32000-2 Table 124 は `FontFile2` を「TrueType font program」と定め、その値は
> TrueType Reference Manual に適合し `glyf` / `head` / `hhea` / `hmtx` / `loca` / `maxp` を
> 含まなければならない (shall) と述べている。CFF はこれを満たさない。
> PDF/A にも PDF/UA にも通るが、本体条文には違反している。

PDF Agent Stack の各サーバーが答える問いを並べると、このライブラリの位置が決まります。

| 誰が | 答える問い |
|---|---|
| [pdf-spec](/ja/mcp/pdf-spec) | 条文は**何を要求する**か |
| [pdf-reader](/ja/mcp/pdf-reader) | ファイルに**何がある**か |
| **pdf-constraints** | **条文を満たすとはどういう状態か** |
| [pdf-verify](/ja/mcp/pdf-verify) | **どこが破られている**か |
| [pdf-writer](/ja/mcp/pdf-writer) | それを**どう書く**か |

## 収録テーブル

<!-- constraints:tables -->
| ドメイン | 対象条文 | 制約 | 何を見るか |
|---|---|---|---|
| `font-embedding` | §9.9.1 / §9.9.2 / §9.7.4.2（Table 124・125 含む） | 5 | 埋め込みキーと中身のフォント形式の一致、サブセット名の 6 文字タグ、`Length1` |
| `document-metadata` | §14.3.2 / §14.3.3 / §14.3.4 / §7.9.4 | 6 | メタデータストリームの型、日付書式、Info ↔ XMP の等価、`Trapped` |
| `annotation` | §12.5.2 / §12.5.3 / §12.5.5 / §12.5.6.2 / §12.5.6.10（Table 166・167・172・182 含む） | 15 | 外観辞書 `/AP` の義務、`/Contents` の段落区切り、色とフラグの構文、`/QuadPoints` の頂点順序、`Popup` / `IRT` の関係 |
<!-- /constraints:tables -->

テーブルは素の JSON なので、判定器を通さずに読むこともできます。

```ts
import table from '@shuji-bonji/pdf-constraints/tables/font-embedding.json' with { type: 'json' };
```

## 4 つの状態

制約ごとに次のどれかを返します。**verdict（推奨判定）は出しません** —— それは pdf-verify の
[`evaluate_policy`](/ja/reference/mcp/pdf-verify#evaluate-policy) の役割です。

| 状態 | 意味 |
|---|---|
| `pass` | 収録した検査では**反証できなかった** |
| `fail` | 反証された（根拠となる事実と実測値つき） |
| `not_applicable` | 適用条件を満たさない（この文書には関係ない条文） |
| `needs_external_fact` | ファイル外の事実が供給されず、**判定に到達しなかった** |

::: warning fail が無いことは適合の証明ではない
「収録した制約の範囲で、規格破りは見つからなかった」以上を意味しません。規格どおりであることは証明できず、破っている箇所を見つけることしかできません —— これは
PDF Agent Stack 全体を貫く [宣言・準拠・検証の三区別](/ja/guide/architecture#宣言・準拠・検証の三区別) の帰結です。
:::

### `given.*` — ファイルの外にある事実

条文には、ファイル単体からは判定できない前提を持つものがあります。たとえば R-9.9.2-2
「**サブセットフォントの**名前は 6 大文字タグで始まる shall」の「サブセットか否か」は、
PDF の中に書かれていません（作った側だけが知っています）。

こうした事実は `given` で供給します。渡さなければその制約は `needs_external_fact`（外部の事実待ち）に留まります ——
**勝手に既定値で埋めると、本当は未検査なのに合格に見えたり、根拠なく違反と判定したりする**ためです。

### 「違反」と「違反の痕跡」

条文の主語が PDF processor（書き込み行為）である場合、ファイルから観測できるのは
**誰かが破った痕跡**であって、直近の書き手の違反とは限りません（§14.3.4 は既存の不整合を
そのまま残すことを許しています）。そうした制約は `subjectNote` を持ち、レポートでも「違反の痕跡」と述べます。

## 単体で使う

MCP を立てずに CLI としても動きます。CI に組み込む場合はこちらが軽量です。

```sh
npx @shuji-bonji/pdf-constraints check document.pdf
npx @shuji-bonji/pdf-constraints check document.pdf --domain font-embedding --given isSubset=true
```

終了コードは 3 値です。**判定できなかったことを合格や違反に混ぜません**。

| code | 意味 |
|---|---|
| 0 | 収録した制約では違反を見つけられなかった（適合の証明ではない） |
| 1 | 違反あり |
| 2 | 判定不能（ファイルが開けない・引数不正など） |

ライブラリとして:

```ts
import { checkFile } from '@shuji-bonji/pdf-constraints';

const report = await checkFile('/abs/path/document.pdf', { given: { isSubset: true } });
report.violations;     // 違反数
report.packageVersion; // どの版のテーブルで判定したか（決定論の由来）
```

`packageVersion` を報告するのは、**同じファイルと同じ与件からは常に同じ結果が出る**ことを
後から確かめられるようにするためです。テーブルと判定ロジックは同じバージョン番号で紐づいています。

## やらないこと

- **条文原文の提供** — [pdf-spec](/ja/mcp/pdf-spec) の役割です。テーブルは clause ID で参照するだけで原文を複製しません
- **適合の証明** — 規格どおりであることは証明できず、規格破りを見つけることしかできません
- **verdict・推奨判定** — [`evaluate_policy`](/ja/reference/mcp/pdf-verify#evaluate-policy) の役割です
- **veraPDF の代替** — PDF/A の判定主体は veraPDF です。収録は ISO 32000-1/-2 本体条文のみです
- **内容の真偽判定** — 条文に適合したファイルが嘘を述べることはあります
