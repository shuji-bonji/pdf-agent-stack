---
description: "pdf-verify-mcp v0.29.0 の全 7 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-verify-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
**v0.29.0** の `tools/list` ハンドシェイクから自動生成（7 ツール・2026-09-18）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
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
| `revocation_freshness` | integer (0–9007199254740991) | 任意 | `86400` | 検証時刻からさかのぼって何秒前までに発行（thisUpdate）された CRL / OCSP 応答を「good」の根拠にするか。既定は 86400（24 時間）。0 にすると、検証時刻以降に発行された失効情報だけを使う。それより古い失効情報は「unknown」になる。 |
| `trusted_ocsp_responders` | string[] | 任意 |  | ローカルで信頼する OCSP 応答者の証明書（PEM または DER）への絶対パス（RFC 6960 §4.2.2.2）。ここに渡した証明書で署名された OCSP 応答は、応答者が発行 CA でもその委任先でもなくても受け入れる。 |
| `password` | string | 任意 |  | 暗号化 PDF のパスワード。権限のみの暗号化 PDF では省略可（空のユーザーパスワードを自動で試す）。 |

### 戻り値

An object of the form { scope, signatures: [...] }. The top level changed from an array to an object in v0.21.0 - read .signatures for the list.

Size (v0.29.0): a JSON response is never cut by length. At most 32 signature fields are verified (file order); when the file has more, signaturesTruncated = { returned, total } is set and the remaining fields are NOT verified — evaluate_policy verifies every field. A markdown response is cut at 50,000 characters with a visible marker.

Every report begins with a "scope" object - how far the reading got, not a verdict: whether the cross-reference chain could be walked to the end (chainStop), whether this tool had to rebuild the cross-reference table itself (reconstructed - when true, the table is this tool's reconstruction and not the one the file carries), how many objects and sections were read, and whether an encrypted document could be opened. Read it before the verdict: "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table. For this tool it matters most: when scope.reconstructed is true, a signature the rebuild did not reach is absent from the list, so a short or empty list is not proof that the file carries no other signatures.

Per-signature verdict ('valid' / 'invalid' / 'indeterminate'), trust status ('trusted' / 'untrusted' / 'not_evaluated' with certificate path), revocation status ('good' / 'revoked' / 'revoked_after_validation_time' / 'unknown' / 'not_checked'; 'not_checked' when check_revocation is 'none') with source, origin ('dss' / 'cms_signed_data' / 'cms_revocation_info_archival'), revocationTime, thisUpdate and nextUpdate, per-intermediate-CA results in trust.chainRevocation, validationTime ({ time, source: 'signature_timestamp' | 'document_timestamp' | 'current_time' }), and signature timestamp verification.

Validation time: a verified timestamp (the signature's own, else the earliest document timestamp covering it) or, without one, the current time. The CMS signingTime attribute is written by the signer and is never used. A revoked signer certificate makes the verdict 'indeterminate' unless a timestamp proves the signature predates the revocation (then the status is 'revoked_after_validation_time' and the verdict is unchanged). CRLs and OCSP responses whose signatures cannot be verified, that expired before the validation time, or that were issued more than revocation_freshness seconds before it give 'unknown'.

Note: without trust_anchors (or the env var), trust is reported as not_evaluated — a 'valid' verdict then means cryptographic integrity, not signer identity assurance.

Complements pdf-reader-mcp's inspect_signatures, which inspects structure only.

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

Every report begins with a "scope" object - how far the reading got, not a verdict: whether the cross-reference chain could be walked to the end (chainStop), whether this tool had to rebuild the cross-reference table itself (reconstructed - when true, the table is this tool's reconstruction and not the one the file carries), how many objects and sections were read, and whether an encrypted document could be opened. Read it before the verdict: "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table.

Size (v0.29.0): revisions lists at most 32 revisions (newest first) and 25 changes per revision; revisionsTruncated / changesTruncated say when a list was cut. revisionCount and revisionChain cover the whole walk. JSON is never cut by length.

Integrity report, including revisionChain: { status, missing } — read it before treating the revision list as the file's whole history — and revisionCountAgreement: { status, causes } — read it before quoting revisionCount as the number of times the file was saved. Note that incremental updates after signing are legal in PDF (adding signatures, DSS/LTV data) — findings indicate what to review, not automatically tampering.

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

An object of the form { scope, levels: [...] }. The top level changed from an array to an object in v0.21.0 - read .levels for the list.

Size (v0.29.0): at most 32 signatures are listed; levelsTruncated = { returned, total } says when the list was cut. JSON is never cut by length.

Every report begins with a "scope" object - how far the reading got, not a verdict: whether the cross-reference chain could be walked to the end (chainStop), whether this tool had to rebuild the cross-reference table itself (reconstructed - when true, the table is this tool's reconstruction and not the one the file carries), how many objects and sections were read, and whether an encrypted document could be opened. Read it before the verdict: "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table.

Per-signature level with evidence (signature timestamp, DSS, VRI, document timestamp presence).

Note: B-LT / B-LTA additionally require that the DSS revocation data actually covers the signer certificate (content-level LTV validation); otherwise the level is capped at B-T.

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

Every report begins with a "scope" object - how far the reading got, not a verdict: whether the cross-reference chain could be walked to the end (chainStop), whether this tool had to rebuild the cross-reference table itself (reconstructed - when true, the table is this tool's reconstruction and not the one the file carries), how many objects and sections were read, and whether an encrypted document could be opened. Read it before the verdict: "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table.

Size (v0.29.0): violations lists at most 200 entries; failedRules and compliant are computed over all of them and violationsTruncated = { returned, total } says when the list was cut. JSON is never cut by length.

Per-rule results with ISO clause references.

| Engine | `compliant` |
| --- | --- |
| veraPDF | `true` / `false` |
| native | `false` = a decisive violation; `null` = no violation in the checked subset (not certification) |

| PDF/UA native `severity` | Meaning |
| --- | --- |
| `error` | proves non-conformance |
| `warning` | needs human review |

For an encrypted PDF that cannot be decrypted, structure-dependent PDF/UA rules are reported in skippedRules (not checked) rather than as violations. The PDF/A font-embedding rule looks at fonts that are actually rendered (text rendering mode 3 is invisible and needs no embedded program, ISO 32000-2 9.3.6); when the content streams cannot be read far enough to tell, that rule is reported in skippedRules instead of guessing.

Note: PDF/UA cannot be fully decided by machine — whether alt text is *present* is checkable, whether it is *meaningful* is not. Use pdf-reader-mcp's inspect_tags to examine the structure tree itself.

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

Every report begins with a "scope" object - how far the reading got, not a verdict: whether the cross-reference chain could be walked to the end (chainStop), whether this tool had to rebuild the cross-reference table itself (reconstructed - when true, the table is this tool's reconstruction and not the one the file carries), how many objects and sections were read, and whether an encrypted document could be opened. Read it before the verdict: "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table.

Size (v0.29.0): results lists at most 200 entries (file order); violations and notDecided are counted over all of them and resultsTruncated = { returned, total } says when the list was cut. JSON is never cut by length.

Per-constraint results with the clause IDs they come from.

| Status | Meaning |
| --- | --- |
| `pass` | nothing in this constraint could be disproved |
| `fail` | disproved, with the fact and its measured value |
| `not_applicable` | the clause does not apply to this document |
| `needs_external_fact` | a fact outside the file was not supplied, so it was not decided (never defaulted to pass) |

Because these are T1 clauses, a failure can be stated plainly and the clause ID quoted — retrieve the wording with pdf-spec-mcp's get_requirements. Failures marked as traces are different: the clause addresses the PDF *processor*, so the file only shows that someone broke it, not that the last writer did.

Some failures carry a Context note. Those clauses are real and the failure is real, but the industry deviates from them deliberately — text markup QuadPoints are written in Z order by nearly every writer because following the clause literally breaks rendering in major viewers. Pass the context on; a failure reported without it reads as a defect.

Every result also carries `observation` — how far the reading got: whether the revision chain could be walked to the end, how many objects the cross-reference tables list, and whether the page tree was reached. **This is the scope of the verdict, not a verdict.** A subject count of zero means "not looked at" when the page tree was not reached; a chain that stopped early means the constraints were applied to part of the file. Read it before the numbers.

**A result with no failures is not proof of conformance** — only that nothing in the bundled constraints could be disproved.

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
| `revocation_freshness` | integer (0–9007199254740991) | 任意 | `86400` | 検証時刻からさかのぼって何秒前までに発行（thisUpdate）された CRL / OCSP 応答を「good」の根拠にするか。既定は 86400（24 時間）。0 にすると、検証時刻以降に発行された失効情報だけを使う。それより古い失効情報は「unknown」になる。 |
| `trusted_ocsp_responders` | string[] | 任意 |  | ローカルで信頼する OCSP 応答者の証明書（PEM または DER）への絶対パス（RFC 6960 §4.2.2.2）。ここに渡した証明書で署名された OCSP 応答は、応答者が発行 CA でもその委任先でもなくても受け入れる。 |
| `password` | string | 任意 |  | 暗号化 PDF のパスワード。権限のみの暗号化 PDF では省略可（空のユーザーパスワードを自動で試す）。 |

### 戻り値

Every report begins with a "scope" object - how far the reading got, not a verdict: whether the cross-reference chain could be walked to the end (chainStop), whether this tool had to rebuild the cross-reference table itself (reconstructed - when true, the table is this tool's reconstruction and not the one the file carries), how many objects and sections were read, and whether an encrypted document could be opened. Read it before the verdict: "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table.

Size (v0.29.0): the verdict is computed over EVERY signature; facts.signatures lists at most 32 of them and facts.signaturesTruncated = { returned, total } says when it was cut. JSON is never cut by length.

| Field | Content |
| --- | --- |
| `verdict` | one of the four values above |
| `firedRules` | rule IDs with per-rule verdict and reason |
| `advisories` | recommendations that do not affect the verdict |
| facts | underlying facts summary |

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
