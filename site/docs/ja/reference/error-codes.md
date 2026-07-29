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

<!-- TODO: reader / verify / spec のエラーも Phase 2 で集約 -->
