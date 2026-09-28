---
description: pdf-writer と pdf-verify の構造化エラーコード一覧
---

# エラーコード一覧

## pdf-writer（構造化エラー: code / next_actions / retryable）

| コード | 意味 / 対処 |
|---|---|
| `INVALID_ARGUMENT` | 引数不正 |
| `DOC_NOT_FOUND` | 入力 PDF が見つからない |
| `FONT_NOT_FOUND` | フォントパス不正 |
| `INVALID_PDF` | 壊れた PDF |
| `ENCRYPTED_PDF` | 暗号化 PDF は編集不可 |
| `UNSUPPORTED_PDF_FEATURE` | XFA 等の非対応機能 |
| `FILE_TOO_LARGE` | サイズ上限超過 |
| `SIGNED_PDF` | 署名保護ガード → `preserveSignatures` / `allowBreakingSignatures` |
| `TAGGED_PDF` | タグ保護ガード → `allowBreakingTags` |
| `FONT_REQUIRED` | CJK 出力にフォント必須 → `fontPath` / `PDF_WRITER_FONT` |
| `MISSING_GLYPH` | グリフ欠落 → `onMissingGlyph` |
| `INTERNAL_ERROR` | 内部エラー |

## pdf-verify（構造化エラー: code / message / suggestion）

`isError: true` のツール結果で、本文は `{ "error": true, "code", "message", "suggestion" }` です。code は pdf-verify 独自のものです。特に `ENCRYPTED_PDF` は pdf-writer と意味が違います。pdf-writer は「そのファイルを**編集**しない」、pdf-verify は「そのファイルを **veraPDF に渡さない**」です。

| code | 意味・対処 |
|---|---|
| `MISSING_PATH` / `RELATIVE_PATH` / `FILE_NOT_FOUND` / `NOT_A_FILE` | `file_path` の誤り → 実在する通常ファイルの絶対パスを渡す |
| `FILE_TOO_LARGE` | サイズ上限超過 |
| `PARSE_FAILED` | ファイルの構造が ISO 32000 の条文に反していて読めなかった（v0.20.0 から。それ以前は `INTERNAL_ERROR`）。サーバの故障ではなく文書についての所見なので、「未実施項目」に入れない |
| `INVALID_BYTE_RANGE` | 署名の `/ByteRange` が 4 つの数でない、またはファイルの外を指している |
| `INVALID_FLAVOUR` | `validate_conformance` の `flavour` が不正（PDF/A-4 に `pdfa-4b` は無い。PDF/UA は `pdfua-1` / `pdfua-2`） |
| `ENCRYPTED_PDF` | `validate_conformance` が暗号化されたファイルを veraPDF に渡さなかった。PDF/A では暗号化そのものが規格外（ISO 19005-1 6.1.3）なので、veraPDF の検証は「未実施」と記録する（v0.26.1 から。それ以前は `INTERNAL_ERROR`）。パスワード付きファイルの PDF/UA 検証なら `password` を渡す |
| `WRONG_PASSWORD` | 渡したパスワードが違う、またはセキュリティハンドラが Standard 以外 |
| `VERAPDF_NOT_FOUND` / `VERAPDF_NOT_AVAILABLE` | veraPDF が無い、または起動できない → `PDF_VERIFY_VERAPDF` を設定するか、`engine: "native"`（適合を認定できない部分集合）を使う |
| `VERAPDF_NO_RESULT` | veraPDF は動いたが検証結果を返さなかった（v0.26.1 から）。pass でも `INTERNAL_ERROR` でもない |
| `INTERNAL_ERROR` | 内部エラー |

<!-- TODO: reader / spec のエラーも Phase 2 で集約 -->
