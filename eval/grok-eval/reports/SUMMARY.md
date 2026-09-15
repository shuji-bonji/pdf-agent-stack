# 横断サマリ（評価後に埋める）

- 実施期間（JST）: 2026-09-15 23:05–23:32
- ホスト: Grok Build 1.0.30 (04b7ffed98c6) [stable] / macOS 26.6.2 arm64 / Node v24.16.0

登録経路は `00-grok-build-setup.md` の手動 npx ではなく、Claude 互換プラグイン。`pdf-spec` だけ `~/.grok/config.toml` で `PDF_SPEC_DIR` を絶対パス指定。

## 環境

| 項目 | 実測 |
| --- | --- |
| pdf-reader-mcp | npm 0.15.1 / 接続 0.15.1（サイト実測 0.15.0 より 1 パッチ新しい） |
| pdf-verify-mcp | 0.26.0 |
| pdf-writer-mcp | 0.21.0 |
| pdf-spec-mcp | 0.6.0。`list_specs` totalSpecs=17 |
| veraPDF | `verapdf --version` 1.30.0 / Homebrew 実体 1.30.2。`PDF_VERIFY_VERAPDF` 未設定でも PATH から engine=verapdf |
| 日本語フォント | NotoSansJP-Regular.otf はディスク上にある。Grok の writer プロセスには `PDF_WRITER_FONT` 未設定。呼び出しの `fontPath` で回避 |
| PDF_SPEC_DIR | コーパスあり。プラグイン `${PDF_SPEC_DIR}` は未展開。config.toml 上書き後に通った |
| Skill 発見 | pdf-trust 0.8.0 / pdf-publish 0.7.0 / pdf-read 0.2.1（いずれも plugin [claude]） |

詳細は `reports/SETUP.md`。

## ユースケース評価

| ID | 名称 | 段階 | 未実施の理由 | 改善の種 |
| --- | --- | --- | --- | --- |
| UC01 | 受入監査 | 実務で使える | なし | locate_objects の 0,0,0,0 矩形の意味 |
| UC02 | 納品パイプライン | 実務で使える | inspect_structure は後続 UC08 で実施 | H1 二重、PDF_WRITER_FONT 非継承 |
| UC03 | 長期保存 PDF/A | 実務で使える | なし | selfmade-pades-lta ファイル名と観測 B-T の差 |
| UC04 | アクセシビリティ | 実務で使える | なし | ensure_tagged に CLAIMS warning が無い |
| UC05 | 仕様調査 | 実務で使える | なし | プラグイン env の `${VAR}` |
| UC06 | 一括監査 | 実務で使える | caution 3 件は個票なし（指示どおり） | サマリに conformance 列 |
| UC07 | 読み取り | 条件付きで使える | 本物の no_text_layer スキャンは未作成 | Skill の 50 ページ閾値と UC07 の 20 ページ |
| UC08 | 電帳法寄り請求書 | 実務で使える | 法令診断は意図的に未実施 | 「10 年」を LTV に伸ばさない例示 |
| UC09 | 宣言と検証 | 実務で使える | なし | 同一セッションで UC03 が先に validate |
| UC10 | 暗号化と未実施 | 条件付きで使える | PDF/A は INTERNAL_ERROR。ENCRYPTED_PDF は SIGNED_PDF が先 | 採点不能を INTERNAL_ERROR にしない |

段階は次のいずれか: 実務で使える / 条件付きで使える / デモには足りる / 使えない

## 境界違反の有無

| 項目 | あり / なし | 引用 |
| --- | --- | --- |
| spec が検証対象 PDF を開こうとした | なし | UC05 は節番号と要求 ID のみ。file_path 未使用 |
| reader 観測を真正性に伸ばした | なし | UC01 は evaluate_policy の verdict のみ |
| writer 成功を適合と言った | なし | UC02/03/08/09 は validate_conformance |
| ISO 19005 準拠 / PAdES 準拠 と書いた | なし | 「veraPDF が COMPLIANT と判定」「構造が B-LTA に一致」 |
| 未実施を passed にした | なし | 官報 PDF/A は未実施 / INTERNAL_ERROR |

## 改善点（パッケージ別）

| 対象 | 観察 | 提案 |
| --- | --- | --- |
| pdf-spec-mcp plugin.json | `"PDF_SPEC_DIR": "${PDF_SPEC_DIR}"` が Grok でリテラル | env ブロックを外すか絶対パスをホスト設定に書く |
| pdf-writer-mcp × Grok | `PDF_WRITER_FONT` が Claude settings.json から来ない | config.toml の env、または呼び出しで fontPath |
| pdf-writer-mcp | tagged 生成で H1 が title と本文で二重 | 同一文字列なら畳む |
| pdf-writer-mcp ensure_tagged | ensure_pdfa と違い CLAIMS warning が応答に無い | 宣言ツールは同じ warning |
| pdf-verify-mcp | 暗号化官報の validate_conformance が INTERNAL_ERROR | 採点不能用の code |
| pdf-read Skill / UC07 | next は 50 超。指示は 20 ページ | 閾値か指示を揃える |
| 評価キット | スキャン相当 PDF を writer だけで作れない | 画像のみ標本の手順 |
| Grok Build | プラグイン MCP の `${VAR}` は展開しない。config.toml の `[mcp_servers.*]` は展開する | ドキュメントに出典の差を書く |
