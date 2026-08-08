# ユースケース一覧

各ユースケースは同じ型で書かれている: **シナリオ → 登場 MCP/Skill → シーケンス図 → プロンプト例 → 結果の読み方**。

| ユースケース | 主役 | 使用ツール（代表） |
|---|---|---|
| [受入監査](/ja/use-cases/incoming-audit) | pdf-trust + verify | evaluate_policy / verify_signatures / verify_integrity |
| [納品パイプライン](/ja/use-cases/publish-pipeline) | pdf-publish + writer | create_markdown_pdf → extract_structured_text → validate_conformance |
| [長期保存 (PDF/A)](/ja/use-cases/pdfa-archive) | writer + verify | ensure_pdfa / attach_file / validate_conformance (pdfa-3b) |
| [アクセシビリティ (PDF/UA)](/ja/use-cases/accessibility) | writer + verify | ensure_tagged / tag_form_fields / validate_conformance (pdfua-1) |
| [仕様調査](/ja/use-cases/spec-research) | spec | search_spec / get_requirements / compare_versions |
| [一括監査](/ja/use-cases/batch-audit) | pdf-trust | 複数 PDF への evaluate_policy 適用 |
