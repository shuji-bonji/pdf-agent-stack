---
description: "pdf-verify-mcp v0.26.0 の全 7 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-verify-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
**v0.26.0** の `tools/list` ハンドシェイクから自動生成（7 ツール・2026-09-04）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
:::

**このページは自動生成リファレンス** — 全ツールの引数・型・既定値・戻り値を `tools/list`（正典 = サーバー実装）から写したもの。責務・設計思想・使いどころの解説は[解説ページ](/ja/mcp/pdf-verify)へ。

::: info `scope` は判定ではない
どの報告も先頭に `scope` が付きます。相互参照チェーンを最後まで歩けたか（`chainStop`）、相互参照表をこのツールが組み直したか（`reconstructed`）。`reconstructed: true` のとき、その表はこのツールが作ったものであって、ファイルが持っているものではありません。判定より先に読んでください。組み直した表の上での「違反なし」は、ファイル自身の表の上での「違反なし」と同じ文ではありません。
:::

## ツール一覧

| ツール | 概要 |
|---|---|
| [`verify_signatures`](#verify-signatures) | PDF 文書の電子署名を暗号学的に検証する。 |
| [`verify_integrity`](#verify-integrity) | 署名後に文書が変更されていないかを分析する。 |
| [`detect_pades_level`](#detect-pades-level) | 各署名の構造がどの PAdES baseline レベル（ETSI EN 319 142）に一致するかを**観測**する。 |
| [`identify_conformance`](#identify-conformance) | PDF の XMP メタデータに書いてある PDF/A（pdfaid）・PDF/UA（pdfuaid）のラベルを読む。 |
| [`validate_conformance`](#validate-conformance) | PDF/A フレーバー（ISO 19005・長期保存）または PDF/UA フレーバー（ISO 14289・アクセシビリティ）に対して PDF を検証する。 |
| [`validate_clauses`](#validate-clauses) | ISO 32000-1/-2 の条文から写像された制約に照らして PDF を検査する。 |
| [`evaluate_policy`](#evaluate-policy) | PDF に対する決定論的な 4 値信頼判定（trust_and_use / use_with_caution / human_review_required / reject）を下す。 |

## verify_signatures

**Verify PDF Digital Signatures (cryptographic)**

PDF 文書の電子署名を暗号学的に検証する。各署名について行うこと:

- ByteRange ダイジェストを再計算し、CMS の messageDigest 属性と照合する
- 署名者証明書に対して CMS/PKCS#7 署名値を検証する
- RFC 3161 署名タイムスタンプを検証する
- 信頼アンカーに対して証明書チェーンを評価する
- 失効状態を確認する

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |
| `trust_anchors` | string[] | 任意 |  | 信頼アンカー証明書（PEM または DER）への絶対パス。PDF_VERIFY_TRUST_ANCHORS 環境変数（*.pem/*.crt/*.cer/*.der のディレクトリ）とマージされる。両方とも無い場合、trust は not_evaluated と報告される。 |
| `check_revocation` | `"none"` \| `"embedded"` \| `"online"` | 任意 | `"embedded"` | 失効確認: "none"、"embedded"（PDF/CMS 内の OCSP/CRL データ。既定）、"online"（さらに OCSP レスポンダと CRL 配布点へ HTTP で問い合わせる）。 |
| `password` | string | 任意 |  | 暗号化 PDF のパスワード。権限のみの暗号化 PDF では省略可（空のユーザーパスワードを自動で試す）。 |

### 戻り値

`scope.reconstructed` が true のとき、組み直しが届かなかった署名は一覧に出ない。短い一覧や空の一覧は「ファイルにほかの署名が無い」ことの証明にならない。

返るのは `{ scope, signatures: [...] }` の形の辞書である。**v0.21.0 で最上位が配列から辞書に変わった** —— 一覧は `.signatures` にある。

3 つの状態は独立である。

| フィールド | 値 | 意味 |
| --- | --- | --- |
| `verdict` | `valid` / `invalid` / `indeterminate` | 暗号計算の一致 |
| `trust.status` | `trusted` / `untrusted` / `not_evaluated` | 証明書チェーン（パス付き）。アンカー無しは `not_evaluated` |
| `revocation.status` | `good` / `revoked` / `unknown` / `not_checked` | 失効確認（OCSP / CRL） |
| 署名タイムスタンプ | （検証結果） | RFC 3161 |

注意: trust_anchors（または環境変数）なしでは trust は not_evaluated と報告される —— そのときの 'valid' は暗号学的完全性を意味し、署名者の本人性を保証しない。

構造だけを調べる pdf-reader-mcp の inspect_signatures を補完する。

::: warning `valid` は本人ではない
`verdict`（暗号計算の一致）と `trust`（証明書チェーン）と失効状態は独立です。`trust_anchors`（または `PDF_VERIFY_TRUST_ANCHORS`）を渡さなければ `trust` は `not_evaluated` のままです。そのときの `valid` はダイジェストが一致した、という意味であって、署名者が本人であることの証明ではありません。
:::

::: details 呼び出し例 — 「この署名は暗号学的に有効か。信頼アンカーも渡して」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- 信頼アンカー: `docs/specimens/selfmade-ca.pem`
- `response_format`: `"json"`
- `check_revocation`: `"embedded"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "trust_anchors": ["/absolute/path/to/docs/specimens/selfmade-ca.pem"],
  "check_revocation": "embedded",
  "response_format": "json"
}
```

**返る JSON**（`cms` の詳細と 2 件目の文書タイムスタンプは省略）

```jsonc
{
  "scope": { "chainStop": { "kind": "complete" }, "reconstructed": false, "objects": 38 },
  "signatures": [
    {
      "fieldName": "Sig1",
      "subFilter": "ETSI.CAdES.detached",
      "verdict": "valid",
      "trust": {
        "status": "trusted",
        "certificatePath": [
          "C=JP, O=PDF Agent Stack Test, CN=Test TSA",
          "C=JP, O=PDF Agent Stack Test, CN=Test Root CA"
        ]
      },
      "revocation": {
        "status": "unknown",
        "detail": "No embedded revocation information found …"
      },
      "coversEntireFile": false,
      "bytesAfterSignedRange": 17188
    }
  ]
}
```

`revocation.status` が `unknown` なら、「失効していない」とは言えません。
:::

## verify_integrity

**Verify PDF Integrity (tamper detection)**

署名後に文書が変更されていないかを分析する。報告するのは:

- リビジョン数（増分更新の回数）
- 各署名の署名済み範囲の後にバイトが追加されたか
- 最後の署名がファイル全体を覆っているか
- DocMDP 認証の許可と違反
- DSS の有無

DocMDP は、P 値が実際に許可する範囲（ISO 32000-2 Table 257）に照らして評価する。

| P | 許可する範囲 |
| --- | --- |
| `1` | 何も許可しない |
| `2` | フォーム記入と署名 |
| `3` | さらに注釈の作成・削除・変更 |

後続の変更はオブジェクトレベル差分（changeClass）から分類するので、P=2 文書への注釈追加は違反と報告し、P=3 文書への同じ変更は違反にしない。許可された変更に伴って必ず書き換わるオブジェクト（/Annots が増えたページ・カタログ・/Info・XMP ストリーム）は housekeeping に分類し、それ自体は違反にしない。なお ISO 32000-2 §12.8.2.2 により、P=1 認証後の DSS / 文書タイムスタンプの増分更新は違反では**ない**（laterChangesAppearLtvOnly の印が付く）。

| `violationAssessment` | 意味 |
| --- | --- |
| `permitted` | 後続の変更は P が許可する範囲内 |
| `violated` | 後続の変更が P の許可を超えた |
| `indeterminate` | 合格ではない。チェーンを歩けなかった、または変更されたオブジェクトの種類を読めず、規格破りを見つけられていない（＝問題なし、ではない） |

boolean の violatedByLaterChanges は後方互換のため indeterminate を false に潰しているので、「判定できなかった」と「問題なし」を区別すべき場面では violationAssessment の方を読むこと。

増分更新チェーンのオブジェクトレベル差分も報告する。リビジョンごとに、追加・書き換え・解放されたオブジェクトを /Type と平易な役割名（注釈・フォームフィールド Widget・ページオブジェクト・コンテンツストリーム等）付きで列挙し、最後の署名済み範囲の後に書かれたオブジェクトの短いリスト（objectChangesAfterLastSignature）も返す。相互参照・オブジェクトストリームには bookkeeping の印が付く。オブジェクトがページ上のどこにあるかは pdf-reader-mcp の担当である。

差分は観測であり、判定ではない:

- 増分更新は PDF として正当な操作である（ISO 32000-2 §7.5.6）。書き換えられたオブジェクトは「レビューすべき点」を示すだけで、改ざんを意味しない。差分によって判定は動かない
- revisions: null は相互参照チェーンを歩けなかったことを意味する（revisionChain.status: 'unwalkable'）。「判定不能」であって「変更なし」では**ない**

| `revisionChain.status` | 意味 |
| --- | --- |
| `complete` | 最新の相互参照節から元のリビジョンまで歩き切った。「一覧に無い = その変更は行われていない」と読めるのはこのときだけ |
| `partial` | リストは返った。欠けている端は `revisionChain.missing`（`oldest` / `newest` / 両方） |
| `unwalkable` | `revisions` は `null`。「判定不能」であって「変更なし」ではない |

- **「一覧に出てこない = その変更は行われていない」と読めるのは 'complete' のときだけ。** チェーンが途中で切れた場合、生き残ったリビジョンは元版として報告される —— changeCount: 0・changes: null・objectChangesAfterLastSignature は空 —— ため、他の機械が読めるフィールドは全部「何も追記されていない」と言う。revisions は古い順に並ぶ。チェーンが切れた原因（壊れた / 巡回する /Prev・リビジョン上限・解析できない節）は notes に残る
- オブジェクトストリーム内のオブジェクトは inObjectStream: true・型なしで列挙される
`revisionCount` は "startxref" キーワードの個数を数え、`revisions` はチェーンが到達した相互参照節を列挙する。2 つは合法に食い違う。

| `revisionCountAgreement.status` | 意味 |
| --- | --- |
| `agree` | `revisionCount` と歩いたリビジョンが一致 |
| `accounted` | 食い違いは説明付き（`linearised` と `chain-incomplete` のいずれか、または両方） |
| `unaccounted` | 歩いたチェーンが到達しない startxref がファイルにある — 実際に開いて見るべきケース |

- 線形化ファイル（ISO 32000-2 Annex F）は 1 回の保存で 2 つの相互参照節を持つため、更新として報告せず 1 リビジョンに畳む。したがって revisionCount は保存回数より 1 大きくなる

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

完全性レポート。revisionChain: { status, missing } を含む —— リビジョン一覧をファイルの全履歴として扱う前に読むこと。revisionCountAgreement: { status, causes } も含む —— revisionCount を「保存された回数」として引用する前に読むこと。署名後の増分更新は PDF として正当である点に注意（署名の追加・DSS/LTV データ）—— 検出結果は「レビューすべき点」を示すのであって、自動的に改ざんを意味しない。

::: warning 増分更新は改ざんではない
署名の追加や DSS / 文書タイムスタンプの付与は PDF として正当です。返るのは「レビューすべき点」であって、自動的に改ざんを意味しません。
:::

::: warning xref チェーンを辿れないことと、変更が無いことは同じではありません
辿れなかったときは空配列ではなく `null` です。辿れないことを「変更なし」と読むと、確認できていない事実を確定してしまいます。
:::

::: details 呼び出し例 — 「署名のあとに何が書かれたか」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "response_format": "json"
}
```

**返る JSON**（`revisions` の中身は省略）

```jsonc
{
  "scope": { "chainStop": { "kind": "complete" }, "reconstructed": false },
  "revisionCount": 4,
  "incrementalUpdateCount": 3,
  "signatureCount": 2,
  "lastSignatureCoversFile": false,
  "hasDss": true,
  "objectChangesAfterLastSignature": [
    { "objectNumber": 2, "change": "modified", "type": "Catalog", "changeClass": "housekeeping" },
    { "objectNumber": 34, "change": "modified", "role": "DSS / validation-related data", "changeClass": "signature" }
  ],
  "notes": [
    "Bytes exist after the last signed range. Incremental updates after signing are legal in PDF …"
  ]
}
```

変更されたオブジェクト番号は pdf-reader-mcp の `locate_objects` に渡せます。
:::

## detect_pades_level

**Detect PAdES Baseline Level**

各署名の構造がどの PAdES baseline レベル（ETSI EN 319 142）に一致するかを**観測**する。

**これは観測であり、準拠判定ではない。** ETSI EN 319 142 は family の仕様コーパスに無く、PDF/A と違って委譲できる第三者検証器も存在しない。したがって結果は「構造が B-LT に一致する」であって「PAdES B-LT に準拠」ではない。これを明示するため、全レポートに normativeBasis: "T3" が付く。

| レベル | 構造（上の行に追加） |
| --- | --- |
| `B-B` | CAdES 署名 |
| `B-T` | + RFC 3161 署名タイムスタンプ |
| `B-LT` | + 検証データ入り DSS |
| `B-LTA` | + 文書タイムスタンプ |

旧式の `adbe.pkcs7.detached` 署名は非 PAdES として報告する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

返るのは `{ scope, levels: [...] }` の形の辞書である。**v0.21.0 で最上位が配列から辞書に変わった** —— 一覧は `.levels` にある。

署名ごとのレベルと根拠（署名タイムスタンプ・DSS・VRI・文書タイムスタンプの有無）。

注意: B-LT / B-LTA はさらに、DSS の失効データが署名者証明書を実際に覆っていること（内容レベルの LTV 検証）を要求する。満たさない場合レベルは B-T に頭打ちされる。

::: warning T3 — 準拠とは書かない
ETSI EN 319 142 はコーパスに無く、第三者検証器もありません。結果は「構造が B-T に一致する」であって「PAdES B-T に準拠」ではありません。全件に `normativeBasis: "T3"` が付きます。
:::

::: details 呼び出し例 — 「PAdES のどのレベルに構造が一致するか」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "levels": [
    {
      "fieldName": "Sig1",
      "subFilter": "ETSI.CAdES.detached",
      "isPades": true,
      "level": "B-T",
      "normativeBasis": "T3",
      "evidence": {
        "hasSignatureTimestamp": true,
        "hasDss": true,
        "hasVri": true,
        "hasDocumentTimestamp": true
      },
      "ltv": { "revocationDataCoversSigner": false },
      "notes": [
        "DSS is present but its revocation data does not cover the signer certificate — level capped at B-T."
      ]
    }
  ]
}
```

DSS があっても、失効データが署名者証明書を覆っていなければ B-LT にはなりません。
:::

## identify_conformance

**Identify PDF/A / PDF/UA Declarations**

PDF の XMP メタデータに書いてある PDF/A（pdfaid）・PDF/UA（pdfuaid）のラベルを読む。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

書いてある PDF/A の part / conformance level と PDF/UA の part、および PDF バージョン。

重要: 本ツールはラベルを**読むだけ**である —— 書いてあることは証拠にならない。規格どおりかどうかの検査は validate_conformance ツールを使うこと（ネイティブのルールサブセット、または veraPDF がインストールされていればそちら）。

::: warning 宣言は証拠ではない
このツールは XMP の pdfaid / pdfuaid を**読むだけ**です。「私は PDF/A です」と書いてあることと、規格どおりであることは別です。ルール検査は [`validate_conformance`](#validate-conformance) です。
:::

::: details 呼び出し例 — 「PDF/A や PDF/UA を名乗っているか」
- 実測: v0.26.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "hasXmp": true,
  "pdfA": { "part": "3", "conformance": "B" },
  "pdfUa": { "part": "1" },
  "pdfVersion": "1.7",
  "notes": [
    "This tool identifies declared conformance only; it does not validate actual conformance.",
    "Document declares PDF/A-3b.",
    "Document declares PDF/UA-1."
  ]
}
```
:::

## validate_conformance

**Validate PDF/A and PDF/UA Conformance**

PDF/A フレーバー（ISO 19005・長期保存）または PDF/UA フレーバー（ISO 14289・アクセシビリティ）に対して PDF を検証する。

ハイブリッドエンジン: veraPDF があれば（`PDF_VERIFY_VERAPDF` または PATH）委譲して権威ある結果を得る。無ければ内蔵ルールのサブセット。

| フレーバー | ネイティブルール |
| --- | --- |
| PDF/A（15） | 暗号化・ファイル ID・LZW・フォント埋め込み・JavaScript/禁止アクション・OutputIntent・A-1 の透明性・XFA など |
| PDF/UA（12） | MarkInfo/Marked・StructTreeRoot・pdfuaid 宣言・/Lang・DisplayDocTitle・文書タイトル・Figure /Alt・画像のタグ付け・見出し階層・表の TH/TR・Link /Contents |

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |
| `flavour` | string | 任意 |  | 検証するフレーバー。PDF/A: "pdfa-1b", "pdfa-1a", "pdfa-2b", "pdfa-2u", "pdfa-3b" など。PDF/A-4 は conformance level を取らない —— "pdfa-4"、または変種の "pdfa-4e" / "pdfa-4f" を使う（"pdfa-4b" は存在しない）。PDF/UA: "pdfua-1", "pdfua-2"。省略時は文書の XMP 宣言を使う（両方宣言されていれば PDF/A 優先。無ければ pdfa-2b にフォールバック）。 |
| `engine` | `"auto"` \| `"native"` \| `"verapdf"` | 任意 | `"auto"` | 検証エンジン: "auto"（veraPDF があればそちら、無ければネイティブサブセット）、"verapdf"（veraPDF 必須）、"native"（内蔵ルールサブセット）。 |
| `password` | string | 任意 |  | 暗号化 PDF のパスワード（PDF/UA 検証のみ —— 構造依存ルールの検査前に文書を復号する）。権限のみの暗号化 PDF では省略可（空のユーザーパスワードを自動で試す）。 |

### 戻り値

ISO 条文参照付きのルール別結果。

| エンジン | `compliant` |
| --- | --- |
| veraPDF | `true` / `false` |
| native | `false` = 決定的な違反あり。`null` = 検査したサブセット内で違反なし（認証ではない） |

| PDF/UA ネイティブ `severity` | 意味 |
| --- | --- |
| `error` | 非準拠を証明できる |
| `warning` | 人のレビューが要る |

復号できない暗号化 PDF では、構造依存の PDF/UA ルールは違反ではなく skippedRules（未検査）として報告される。PDF/A のフォント埋め込みルールは、実際に描画されたフォントを見る（テキスト描画モード 3 は不可視で、埋め込まれたプログラムを必要としない。ISO 32000-2 9.3.6）。内容ストリームをそこまで読めず判断できないときは、推測せずそのルールを skippedRules に報告する。

注意: PDF/UA は機械だけでは決定できない —— 代替テキストが「存在するか」は検査できるが、「意味があるか」はできない。構造ツリー自体の観測は pdf-reader-mcp の inspect_tags へ。

::: warning T2（PDF/A）— 「veraPDF が COMPLIANT と判定」まで
ISO 19005 はコーパスにありません。PDF/A の結果は veraPDF の判定です。「ISO 19005 に適合する」とは書きません。
:::

::: warning PDF/UA の代替テキストの意味は機械では決められない
代替テキストが「存在するか」は検査できます。「意味があるか」は人のレビューです。
:::

::: details 呼び出し例 — 「veraPDF は PDF/UA-1 をどう判定したか」
- 実測: v0.26.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `flavour`: `"pdfua-1"`
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfua-1",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "engine": "verapdf",
  "authoritativeValidation": { "performed": true, "validator": "verapdf", "version": "1.30.0" },
  "flavour": "PDF/UA-1",
  "compliant": true,
  "checkedRules": 106,
  "passedRules": 106,
  "failedRules": 0,
  "violations": [],
  "notes": [
    "Validated by veraPDF … — authoritative result.",
    "Machine validation cannot judge whether alt text and reading order are semantically appropriate; human review remains necessary."
  ]
}
```

同一標本を `flavour: "pdfa-3b"` で測ると、veraPDF 1.30.0 が 146/146、`compliant: true` でした。PDF/A では「veraPDF が COMPLIANT と判定した」と書きます。
:::

## validate_clauses

**Check ISO 32000 Clause Constraints**

ISO 32000-1/-2 の条文から写像された制約に照らして PDF を検査する。対象は PDF/A や PDF/UA のプロファイルではなく、PDF 仕様の本体である。

veraPDF が見ない領域を覆う。veraPDF は PDF/A・PDF/UA プロファイルを判定するが、それに合格しながら ISO 32000 に違反する文書は作れる（例: CFF フォントプログラムを /FontFile2 に埋め込む。Table 124 が禁じている）。

写像とその評価は @shuji-bonji/pdf-constraints にあり、本ツールはどの版が判定したかを報告する。同じファイルと同じ与件からは常に同じ結果が出る。

同梱ドメイン: font-embedding, document-metadata, annotation

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |
| `domains` | string[] | 任意 |  | 適用する制約ドメイン。省略時は同梱の全ドメイン（font-embedding, document-metadata, annotation）を適用。 |
| `given` | object | 任意 |  | ファイル内に無いが一部の条文の決定に必要な事実。例: { "isSubset": true }。欠けた事実に適用可否が依存する条文は needs_external_fact として報告される —— 合格に既定されることは決してない。 |

### 戻り値

制約ごとの結果と、その出どころの条文 ID。

| 状態 | 意味 |
| --- | --- |
| `pass` | この制約では規格破りは見つからなかった |
| `fail` | 規格破りが見つかった。根拠として事実と実測値が付く |
| `not_applicable` | 条文がこの文書に適用されない |
| `needs_external_fact` | ファイル外の事実が与えられず決定しなかった（合格に既定しない） |

これらは T1 条文なので、失敗は条文 ID を引用して言い切れる —— 文言は pdf-spec-mcp の get_requirements で取得すること。trace 印の失敗は別物である: その条文は PDF **処理系**への要求であり、ファイルは誰かが破ったことを示すだけで、最後に書いた者が破ったとは限らない。

一部の失敗には Context 注記が付く。条文は実在し失敗も実在するが、業界が意図的に逸脱している —— テキストマークアップの QuadPoints はほぼ全ての生成系が Z 順で書く。条文どおりに書くと主要ビューアで描画が壊れるからである。Context は必ず一緒に伝えること。Context を落として報告すると、正しい記述が欠陥として読まれる。

**失敗ゼロは規格どおりであることの証明ではない** —— 同梱した検査の範囲で、規格破りは見つからなかった、というだけである。

::: warning 失敗無し ≠ 適合
bundled の制約だけを見ます。失敗が無いことは適合の証明ではありません。
:::

::: details 呼び出し例 — 「ISO 32000 のメタデータ条文で示せる誤りはあるか」
- 実測: v0.26.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `domains`: `["document-metadata"]`
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "domains": ["document-metadata"],
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "constraintsVersion": "0.6.1",
  "tables": [{ "name": "document-metadata", "version": "1" }],
  "results": [
    { "constraintId": "CT-META-1", "target": "(document)", "status": "pass" },
    { "constraintId": "CT-META-6", "target": "(document)", "status": "not_applicable" }
  ],
  "violations": 0,
  "notDecided": 0,
  "notes": [
    "Checked against the constraints bundled in @shuji-bonji/pdf-constraints — nothing else. The absence of failures is not proof of conformance."
  ]
}
```
:::

## evaluate_policy

**Evaluate Trust Policy (deterministic verdict)**

PDF に対する決定論的な 4 値信頼判定を下す。

- `trust_and_use`
- `use_with_caution`
- `human_review_required`
- `reject`

内部で verify_signatures・verify_integrity・detect_pades_level を実行し（長期保存プロファイルでは validate_conformance も）、得られた事実を固定のルール表に通す。同じ事実と同じプロファイルからは常に同じ判定が出る。判定は完全にコードが下す。返される firedRules / advisories は結果の説明に使い、判定の上書きには使わないこと。判定の対象は真正性と完全性のみで、文書の内容の真偽は判定しない。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |
| `profile` | `"general"` \| `"contract"` \| `"financial"` \| `"legal"` \| `"medical"` \| `"government"` | 任意 | `"general"` | 判定プロファイル: "general"（既定の閾値）、"contract"（署名必須・本人性重視）、"financial"（長期保存の検査）、"legal"、"medical"（最も保守的。caution は review に格上げ）、"government"（長期保存の検査・無署名は許容）。 |
| `trust_anchors` | string[] | 任意 |  | 信頼アンカー証明書（PEM または DER）への絶対パス。PDF_VERIFY_TRUST_ANCHORS 環境変数とマージされる。アンカーなしでは、有効な署名でも use_with_caution に頭打ちされる（本人性が未評価のため）。 |
| `check_revocation` | `"none"` \| `"embedded"` \| `"online"` | 任意 | `"embedded"` | 失効確認: "none"、"embedded"（既定）、"online"（OCSP/CRL エンドポイントへ HTTP で問い合わせる）。 |
| `password` | string | 任意 |  | 暗号化 PDF のパスワード。権限のみの暗号化 PDF では省略可（空のユーザーパスワードを自動で試す）。 |

### 戻り値

| フィールド | 内容 |
| --- | --- |
| `verdict` | 上の 4 値のいずれか |
| `firedRules` | ルール ID とルール別の判定・理由 |
| `advisories` | 判定に影響しない推奨 |
| facts | 根拠となった事実の要約 |

::: warning 判定は `evaluate_policy` が返す。LLM は説明文だけを書く
`firedRules` / `advisories` は結果の説明に使います。判定の上書きには使いません。advisory を失敗と読まないでください。advisory が無いことを合格と読まないでください。
:::

::: warning 信頼アンカー無しは `use_with_caution` 止まり
`trust_anchors` を渡さないと署名者の本人性は `not_evaluated` のままです。`trust_and_use` にはなりません。
:::

::: details 呼び出し例 — 「業務に載せてよいか（general、アンカー無し）」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `profile`: `"general"`
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "profile": "general",
  "response_format": "json"
}
```

**返る JSON**（`facts` は省略）

```jsonc
{
  "profile": "general",
  "verdict": "use_with_caution",
  "firedRules": [
    {
      "ruleId": "POL-CAUTION-TRUST-NOT-EVALUATED",
      "verdict": "use_with_caution",
      "reason": "Cryptographic integrity confirmed but signer identity NOT evaluated (no trust anchors): Sig1"
    },
    {
      "ruleId": "POL-CAUTION-REVOCATION-UNKNOWN",
      "verdict": "use_with_caution",
      "reason": "Revocation status could not be confirmed …"
    }
  ],
  "advisories": [
    "Content was added after signing (incremental update): … — incremental updates are permitted in PDF …"
  ]
}
```

同じ事実と同じ `profile` からは常に同じ判定です。
:::
