---
description: 真正性・準拠性を判定する MCP（7 ツール） — 署名検証・改ざん検知・PAdES 観測・PDF/A / PDF/UA 検証・条文検査・決定論的 4 値判定。反証はできるが証明はしない
---

# pdf-verify-mcp

> **真正性・準拠性の層 (judgment)** — このサーバーは**反証する**。文書が準拠している・署名が信頼できると**証明することはできない**。すべての結果は「示せる誤りを探した結果」として読む。

- npm: [`@shuji-bonji/pdf-verify-mcp`](https://www.npmjs.com/package/@shuji-bonji/pdf-verify-mcp) / 現行 v0.14.2 / [GitHub](https://github.com/shuji-bonji/pdf-verify-mcp)
- このページは責務と使いどころの**解説**。全ツールの引数・戻り値は[ツールリファレンス](/ja/reference/mcp/pdf-verify)（`tools/list` から自動生成）へ
- 署名の暗号学的検証・改ざん検知・PAdES レベル観測・PDF/A / PDF/UA 検証・決定論的ポリシー判定

## しないこと

- 内容の真偽の判定（正しく署名された文書も嘘は書ける）
- 観測（→ pdf-reader）・仕様の引用（→ pdf-spec）・生成（→ pdf-writer）

## インストール

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

環境変数はどちらも任意。veraPDF なしでも内蔵ルールで動作する（→ [validate_conformance](#validate-conformance)）。

## 共通引数

全ツールが以下を受け取る（各表では省略）。

| 引数 | 型 | 説明 |
|---|---|---|
| `file_path` **必須** | string | ローカル PDF の絶対パス |
| `response_format` | `markdown` / `json` | 出力形式。既定 markdown |
| `password` | string | 暗号化 PDF のパスワード。権限暗号化（空ユーザパスワード）は自動で試行（対応ツールのみ） |

## ツール一覧

| ツール | 一行説明 |
|---|---|
| [`verify_signatures`](#verify-signatures) | 電子署名の暗号学的検証（チェーン・失効・タイムスタンプ） |
| [`verify_integrity`](#verify-integrity) | 署名後の変更の分析（増分更新・カバレッジ・DocMDP） |
| [`detect_pades_level`](#detect-pades-level) | PAdES B-B / B-T / B-LT / B-LTA 相当構造の**観測** |
| [`identify_conformance`](#identify-conformance) | XMP 宣言（pdfaid / pdfuaid）の読取 — 判定の入口 |
| [`validate_conformance`](#validate-conformance) | PDF/A / PDF/UA 検証。veraPDF 委譲 or 内蔵ルール |
| [`validate_clauses`](#validate-clauses) | ISO 32000 **本体条文**の制約検査（veraPDF が見ない領域） |
| [`evaluate_policy`](#evaluate-policy) | 事実からの決定論的 4 値判定 |

## ツール別マニュアル

### verify_signatures

各署名について、ByteRange ダイジェストの再計算と CMS messageDigest の照合、署名者証明書に対する CMS/PKCS#7 署名値の検証、RFC 3161 署名タイムスタンプの検証、信頼アンカーに対する証明書チェーン評価、失効確認を行う。

返却: 署名ごとの verdict（`valid` / `invalid` / `indeterminate`）、trust（`trusted` / `untrusted` / `not_evaluated` + 証明書パス）、失効状態（`good` / `revoked` / `unknown` / `not_checked`）、タイムスタンプ検証結果。

| 引数 | 型 | 説明 |
|---|---|---|
| `trust_anchors` | array\<string\> | 信頼アンカー証明書（PEM/DER）のパス。env `PDF_VERIFY_TRUST_ANCHORS`（ディレクトリ）とマージ |
| `check_revocation` | `none` / `embedded` / `online` | 失効確認。既定 embedded（PDF/CMS 内のデータ）。online は OCSP/CRL へ HTTP 問い合わせ |

::: warning valid ≠ 本人
trust_anchors（または env）なしの「valid」は**暗号計算の一致**のみを意味し、署名者が本人であることは意味しない（`trust: not_evaluated`）。失効も、確認できなかったなら「失効していない」とは言えない。
:::

関連: 構造だけ見るなら pdf-reader `inspect_signatures`。

### verify_integrity

署名後の変更を分析する: リビジョン数（増分更新）、各署名の署名済み範囲の後にバイトが追加されたか、最後の署名がファイル全体をカバーするか、DocMDP（認証署名）の許可と違反、DSS の有無。ISO 32000-2 §12.8.2.2 に従い、P=1 認証後の DSS/文書タイムスタンプ増分は違反として**報告しない**（`laterChangesAppearLtvOnly` としてフラグ）。

::: tip 署名後の増分更新は合法
署名の追加・DSS/LTV データの付与は PDF として正当な操作である。検出結果は「レビューすべき点」であって、自動的に改ざんを意味しない。
:::

**v0.10.0 から、リビジョン単位に加えて「署名後にどのオブジェクトが書かれたか」まで返す**
（`revisions` / `objectChangesAfterLastSignature`）。生バイトで xref チェーンを歩く
（table / xref stream / hybrid 対応）。**判定は不変**である（増分更新は合法なので）。

その番号を [pdf-reader](/ja/mcp/pdf-reader) の `locate_objects` へ渡すと**ページと矩形**になり、
[pdf-writer](/ja/mcp/pdf-writer) の `add_annotation` にそのまま渡せる ── 「改ざん箇所を注釈で指す」が
サーバーをまたいで 1 本に繋がる。

::: warning 歩けない ≠ 変更なし
xref チェーンを歩けなかった場合は空配列ではなく `null` を返す。素朴に作ると嘘をつく箇所が
3 つあり（線形化は 1 セーブで xref が 2 つできるため併合しないと「全オブジェクト追加」と誤報／
フルセーブでは実測 224,065 件になる／歩けないことを「変更なし」と読ませない）、いずれも実測で対処済みである。
:::

### validate_clauses

**ISO 32000-1/-2 本体の条文**から書き起こした制約を検査する。veraPDF が見ない領域である ──
PDF/A や PDF/UA に通っても ISO 32000 に違反しうるため（例: CFF フォントプログラムを `/FontFile2` に
埋め込む。Table 124 が禁じている）。

制約テーブルとその評価器は [pdf-constraints](/ja/reference/pdf-constraints) にあり、どの版が判定したかを出力に含める。
**同じファイルと同じ与件からは常に同じ結果**である。収録済みのドメインと制約数はそちらを参照。

| 引数 | 型 | 説明 |
|---|---|---|
| `domains` | array\<string\> | 対象ドメインを絞る |
| `given` | object | ファイル外の事実。例 `{ "isSubset": true }` |

制約ごとに 4 状態を返す。

| 状態 | 意味 |
|---|---|
| `pass` | この制約では**何も反証できなかった** |
| `fail` | 反証された。根拠となる事実と実測値つき |
| `not_applicable` | この文書には条文が適用されない |
| `needs_external_fact` | ファイル外の事実が与えられず**判定しなかった**（pass に倒さない） |

::: warning 失敗ゼロは適合の証明ではない
「同梱された制約の範囲で何も反証できなかった」という意味である。なお `trace` 印の失敗は、
条文が PDF **処理系**に向けたものであることを示す ── 誰かが破った痕跡であって、
最後に書いた者が破ったとは限らない。
:::

### detect_pades_level

各署名の構造がどの PAdES baseline レベル（ETSI EN 319 142）に一致するかを**観測**する。レベルは次の積み上げで決まる:

| レベル | 構造（上の行に追加で） | 意味 |
|---|---|---|
| B-B | CAdES 署名 | 署名のみ |
| B-T | + 署名タイムスタンプ（RFC 3161） | 署名時刻を第三者が証明 |
| B-LT | + 検証データ入り DSS（証明書・OCSP/CRL） | 失効確認の材料が文書内で完結 |
| B-LTA | + 文書タイムスタンプ | 検証材料ごと封印し、長期保存に耐える |

旧式の adbe.pkcs7.detached は非 PAdES として報告。

::: warning これは観測であり準拠判定ではない
ETSI EN 319 142 は仕様コーパスに無く、第三者検証器も存在しない。結果は「構造が B-LT に一致する」であって「PAdES B-LT に準拠」ではない — 全レポートに `normativeBasis: "T3"` が付く。
:::

B-LT / B-LTA は DSS の失効データが署名者証明書を実際にカバーしていることを追加要求する（満たさなければ B-T 止まり）。

### identify_conformance

XMP メタデータの PDF/A（pdfaid）・PDF/UA（pdfuaid）**宣言**を読み取る。宣言された part / conformance level と PDF バージョンを返す。

::: warning 宣言は準拠を保証しない
このツールは宣言を**特定するだけ**である。実際のルール検査は `validate_conformance` へ。
:::

### validate_conformance

PDF/A（ISO 19005・長期保存）または PDF/UA（ISO 14289・アクセシビリティ）に対して検証する。**ハイブリッドエンジン**: veraPDF があれば委譲（authoritative）、なければ内蔵ルールをネイティブ実行 —

- PDF/A（15 ルール）: 暗号化・ファイル ID・LZW・フォント埋め込み・JavaScript/禁止アクション・OutputIntent・A-1 の透明・XFA など
- PDF/UA（12 ルール）: MarkInfo/Marked・StructTreeRoot・pdfuaid 宣言・/Lang・DisplayDocTitle・タイトル・Figure /Alt・画像タグ・見出し階層・表 TH/TR・Link /Contents

| 引数 | 型 | 説明 |
|---|---|---|
| `flavour` | string | `"pdfa-1b"`〜`"pdfa-3b"` / **`"pdfa-4"` / `"pdfa-4e"` / `"pdfa-4f"`**（v0.11.0+）/ `"pdfua-1"` / `"pdfua-2"` 等。省略時は XMP 宣言に従う（両方宣言時は PDF/A 優先、fallback pdfa-2b）。**PDF/A-4 は conformance level を持たないので `"pdfa-4b"` は存在しない** — `e` / `f` はレベルではなく variant である |
| `engine` | `auto` / `verapdf` / `native` | 既定 auto（veraPDF があれば委譲） |

結果の読み方: `compliant` は veraPDF なら true/false。**ネイティブエンジンでは false = 決定的違反あり、null = 「検査したサブセット内で違反なし」（認証ではない）**。PDF/UA ネイティブ違反は severity 付きで、`error` のみが非準拠を証明でき、`warning` は人のレビューが要る。

::: tip PDF/UA は機械だけでは決められない
代替テキストが「存在するか」は機械で検査できるが、「意味があるか」はできない。構造ツリー自体の観測は pdf-reader の `inspect_tags` へ。
:::

### evaluate_policy

決定論的な 4 値判定（`trust_and_use` / `use_with_caution` / `human_review_required` / `reject`）を返す。内部で `verify_signatures`・`verify_integrity`・`detect_pades_level`（長期保存プロファイルでは `validate_conformance` も）を実行し、事実を固定ルール表に畳み込む — **同じ事実と同じプロファイルからは常に同じ判定**。

| 引数 | 型 | 説明 |
|---|---|---|
| `profile` | `general` / `contract` / `financial` / `legal` / `medical` / `government` | 判定プロファイル。contract=署名必須・本人性重視 / financial・government=長期保存検査 / medical=最保守（caution が review に昇格） |
| `trust_anchors` | array\<string\> | 信頼アンカー。**無しの場合、valid でも判定は use_with_caution 止まり**（本人性未評価のため） |
| `check_revocation` | `none` / `embedded` / `online` | 失効確認。既定 embedded |

返却: `verdict`・`firedRules`（発火ルール ID と理由）・`advisories`（判定に影響しない推奨）・事実サマリ。

::: warning ジャッジはコード、ナラティブは LLM
判定はコードが下する。返された firedRules / advisories は**結果の説明に使うもので、判定の上書きには使わない**。advisory を失敗と読まない・advisory 不在を合格と読まないこと。真正性と完全性のみを判定し、内容の真偽は決して判定しない。
:::

関連: この判定を軸に監査全体を編成するのが [pdf-trust Skill](/ja/skills/pdf-trust) である。

## 言い切り強度

判定の強さは規範文書の有無で変わる → [T1/T2/T3 ルール](/ja/guide/architecture#言い切り強度-t1-t2-t3)。ETSI PAdES（T3）は構造の観測どまり、PDF/A（T2）は「veraPDF がこう判定した」まで、ISO 32000 / PDF/UA（T1）は条文を引いて言い切れる。
