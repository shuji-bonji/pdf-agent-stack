---
description: 各 MCP サーバーの環境変数一覧 — PDF_SPEC_DIR / PDF_VERIFY_VERAPDF / PDF_VERIFY_TRUST_ANCHORS / PDF_WRITER_FONT
---

# 環境変数一覧

| 変数 | サーバー | 必須 | 用途 |
|---|---|---|---|
| `PDF_SPEC_DIR` | pdf-spec | **必須** | 仕様 PDF コーパスのディレクトリ |
| `PDF_VERIFY_VERAPDF` | pdf-verify | 任意 | veraPDF 実行パス（無ければ PATH 探索 → 内蔵ルール） |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | 任意 | 信頼アンカー証明書（PEM/DER）のディレクトリ |
| `PDF_WRITER_FONT` | pdf-writer | CJK 出力に実質必須 | 既定フォント（単一フェイス .ttf/.otf） |

開発用: `TEST_FONT_PATH`（pdf-writer のフォント依存テスト有効化）
