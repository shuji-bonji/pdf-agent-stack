# 横断サマリ（評価後に埋める）

- 実施期間（JST）: 2026-09-15 23:05–23:32（初回）。UC07 再走 2026-09-16 12:48 と 19:42（scan-no-text-layer）。UC10 再走 15:03（verify 0.26.1）。UC04 再走 15:36（writer 0.21.1）
- ホスト: Grok Build 1.0.30 (04b7ffed98c6) [stable] / macOS 26.6.2 arm64 / Node v24.16.0

登録経路は `00-grok-build-setup.md` の手動 npx ではなく、Claude 互換プラグイン。`pdf-spec` だけ `~/.grok/config.toml` で `PDF_SPEC_DIR` を絶対パス指定。

## 環境

| 項目 | 実測 |
| --- | --- |
| pdf-reader-mcp | npm 0.15.1 / 接続 0.15.1（サイト実測 0.15.0 より 1 パッチ新しい） |
| pdf-verify-mcp | 0.26.1（plugin。UC10 / UC04 再走） |
| pdf-writer-mcp | 0.21.1（UC07 再走の検体作成。npm provenance あり） |
| pdf-spec-mcp | 0.6.0。`list_specs` totalSpecs=17 |
| veraPDF | `verapdf --version` 1.30.0 / Homebrew 実体 1.30.2。`PDF_VERIFY_VERAPDF` 未設定でも PATH から engine=verapdf |
| 日本語フォント | NotoSansJP-Regular.otf はディスク上にある。Grok の writer プロセスには `PDF_WRITER_FONT` 未設定。呼び出しの `fontPath` で回避 |
| PDF_SPEC_DIR | コーパスあり。プラグイン `${PDF_SPEC_DIR}` は未展開。config.toml 上書き後に通った |
| Skill 発見 | pdf-trust 0.8.0 / pdf-publish 0.7.0（plugin [claude]）。pdf-read **0.2.2**（`grok plugin install shuji-bonji/pdf-read-skill@v0.2.2`） |

詳細は `reports/SETUP.md`。

## ユースケース評価

| ID | 名称 | 段階 | 未実施の理由 | 改善の種 |
| --- | --- | --- | --- | --- |
| UC01 | 受入監査 | 実務で使える | なし | locate_objects の 0,0,0,0 矩形の意味 |
| UC02 | 納品パイプライン | 実務で使える | inspect_structure は後続 UC08 で実施 | H1 二重、PDF_WRITER_FONT 非継承 |
| UC03 | 長期保存 PDF/A | 実務で使える | なし | selfmade-pades-lta ファイル名と観測 B-T の差 |
| UC04 | アクセシビリティ | 実務で使える | なし | 0.21.1 で CLAIMS warning あり。H1 二重は残る |
| UC05 | 仕様調査 | 実務で使える | なし | プラグイン env の `${VAR}` |
| UC06 | 一括監査 | 実務で使える | caution 3 件は個票なし（指示どおり） | サマリに conformance 列 |
| UC07 | 読み取り | 実務で使える | なし（no_text_layer は committed 標本で測った） | reader の next は 50 超のみ。Skill が空 next を補う |
| UC08 | 電帳法寄り請求書 | 実務で使える | 法令診断は意図的に未実施 | 「10 年」を LTV に伸ばさない例示 |
| UC09 | 宣言と検証 | 実務で使える | なし | 同一セッションで UC03 が先に validate |
| UC10 | 暗号化と未実施 | 条件付きで使える | veraPDF の PDF/A は ENCRYPTED_PDF で未実施。writer の ENCRYPTED_PDF は SIGNED_PDF が先 | 0.26.1 で INTERNAL_ERROR は解消 |

段階は次のいずれか: 実務で使える / 条件付きで使える / デモには足りる / 使えない

## 境界違反の有無

| 項目 | あり / なし | 引用 |
| --- | --- | --- |
| spec が検証対象 PDF を開こうとした | なし | UC05 は節番号と要求 ID のみ。file_path 未使用 |
| reader 観測を真正性に伸ばした | なし | UC01 は evaluate_policy の verdict のみ |
| writer 成功を適合と言った | なし | UC02/03/08/09 は validate_conformance |
| ISO 19005 準拠 / PAdES 準拠 と書いた | なし | 「veraPDF が COMPLIANT と判定」「構造が B-LTA に一致」 |
| 未実施を passed にした | なし | 官報 PDF/A（veraPDF）は ENCRYPTED_PDF で未実施 |

## 改善点（パッケージ別）

| 対象 | 観察 | 提案 |
| --- | --- | --- |
| pdf-spec-mcp plugin.json | `"PDF_SPEC_DIR": "${PDF_SPEC_DIR}"` が Grok でリテラル | env ブロックを外すか絶対パスをホスト設定に書く |
| pdf-writer-mcp × Grok | `PDF_WRITER_FONT` が Claude settings.json から来ない | config.toml の env、または呼び出しで fontPath |
| pdf-writer-mcp | tagged 生成で H1 が title と本文で二重 | 同一文字列なら畳む |
| pdf-writer-mcp ensure_tagged | 0.21.1 再走: CLAIMS / NOT checked が warnings に入った | H1 二重は create_markdown_pdf tagged 側 |
| pdf-verify-mcp | 0.26.1 再走: 暗号化官報は ENCRYPTED_PDF（INTERNAL_ERROR ではない） | writer 側 ENCRYPTED_PDF は署名無し検体が要る |
| pdf-read Skill / UC07 | 0.2.2: 空 next でも search_text。scan-no-text-layer は no_text_layer → 視覚読み | reader の next 閾値 50 はそのまま |
| 評価キット | scan-no-text-layer は committed 標本（writer では作らない） | 手順は指示書どおり動いた |
| Grok Build | プラグイン MCP の `${VAR}` は展開しない。config.toml の `[mcp_servers.*]` は展開する | ドキュメントに出典の差を書く |
