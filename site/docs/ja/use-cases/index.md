---
description: 8 つのユースケース — 受入監査・納品パイプライン・長期保存 (PDF/A)・アクセシビリティ (PDF/UA)・仕様調査・一括監査・大きい PDF・読めない PDF・電帳法を意識した請求書
---

# ユースケース一覧

各ユースケースは同じ型で書かれています: **シナリオ → 登場 MCP/Skill → シーケンス図 → プロンプト例 → 結果の読み方**。

| ユースケース | 主役 | 使用ツール（代表） |
|---|---|---|
| [受入監査](/ja/use-cases/incoming-audit) | pdf-trust + verify | evaluate_policy / verify_signatures / verify_integrity |
| [納品パイプライン](/ja/use-cases/publish-pipeline) | pdf-publish + writer | create_markdown_pdf → extract_structured_text → validate_conformance |
| [長期保存 (PDF/A)](/ja/use-cases/pdfa-archive) | writer + verify | ensure_pdfa / attach_file / validate_conformance (pdfa-3b) |
| [アクセシビリティ (PDF/UA)](/ja/use-cases/accessibility) | writer + verify | ensure_tagged / tag_form_fields / validate_conformance (pdfua-1) |
| [仕様調査](/ja/use-cases/spec-research) | spec | search_spec / get_requirements / compare_versions |
| [一括監査](/ja/use-cases/batch-audit) | pdf-trust | 複数 PDF への evaluate_policy 適用 |
| [大きい PDF・読めない PDF](/ja/use-cases/pdf-read) | pdf-read + reader | summarize → search_text → read_text (pages) / render_page |
| [電帳法を意識した請求書](/ja/use-cases/denchoho-invoice) | pdf-publish + writer | attach_file (Data) → ensure_pdfa (pdfa-3b) → validate_conformance |

## 別のホストでの再走（2026-09-15〜16）

上の 8 件はすべて、Claude Code とは別のホスト（Grok Build 1.0.30）でも同じ手順で実行し、判定が一致することを確かめました。
各ページの末尾に、そのときの報告書へのリンクがあります。評価キット（指示書・検体の作り方・報告書の型）は
[eval/grok-eval](https://github.com/shuji-bonji/pdf-agent-stack/tree/main/eval/grok-eval) にあり、横断のまとめは
[reports/SUMMARY.md](https://github.com/shuji-bonji/pdf-agent-stack/blob/main/eval/grok-eval/reports/SUMMARY.md) です。
