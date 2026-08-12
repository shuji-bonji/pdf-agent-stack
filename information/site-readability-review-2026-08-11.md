# サイト可読性レビュー（2026-08-11・「LLM に詳しくない PDF 実務者」視点の通読）

ja 全 20 ページ通読の指摘。**トップ 5 は同日実装済み**（下記 ✅）。残りは順次消化する。

## 優先トップ 10

| # | 対象 | 内容 | 状態 |
|---|---|---|---|
| 1 | overview / glossary | **MCP・Skill が未定義**。PDF Agent Stack = PDF Family の明言もない | ✅ overview 冒頭に定義 + 用語集に項目追加 |
| 2 | skills/pdf-publish | **「水準」（none / readback / conformance）の定義表がない** | ✅ 品質ゲート水準の表を新設 |
| 3 | skills/pdf-trust | **Phase 一覧が無いまま「Phase 2.5」が登場** | ✅ 監査の流れ（Phase 0〜5）表を新設 |
| 4 | mcp/pdf-verify ほか | **PAdES B-B/B-T/B-LT/B-LTA の積み上げ表がない**。trust/pdfa-archive で B-LT を飛ばして B-LTA に上がる説明が矛盾に見える | ✅ 階段表 + 「DocTS が最初から入っているため」の補足 |
| 5 | reference/glossary | **LLM/開発用語のセクションがない**（決定論的・ナラティブ・反証・コーパス・フォールバック・トークン・構造化エラー・冪等など） | ✅ セクション追加 |
| 6 | guide/agents.md | 「緑のテストは空振りしうる（フィクスチャ・ガード節）」「器の読み替え（器 / system prompt）」など内輪語が集中。サブエージェント定義の配置先も未記載 | 未 |
| 7 | mcp/pdf-reader.md | IoU 未定義のまま品質根拠に使用（171行）。トークン（90行）・センチネル（168行）・Well-Tagged PDF 1.0 の正体も未説明 | 未 |
| 8 | guide/getting-started.md | 設定ファイルの場所（パス）が未記載。Step 6（Skill 導入）だけ手順コマンドがない。文体（です・ます/である）混在（28〜37行） | 未 |
| 9 | mcp/pdf-verify.md | flavour 一覧と compliant 3 値（true/false/null × エンジン）を表に分離すべき（156・159行）。「146/146」等の分母 = veraPDF 検査項目数を初出で明記 | 未 |
| 10 | architecture 91行 / verify 94〜98行 | サイト最長の 2 文を分割（4 値判定の表切り出し / 「素朴に作ると嘘をつく箇所が 3 つ」の箇条書き化） | 未 |

## 追加で実施済み（2026-08-11）

- 用語集に **「図の読み方（形の凡例）」** を追加し、本文の凡例文は削除してリンクに集約（ユーザー方針 = 定義は用語集、本文はリンク）
- overview の MCP / Skill 定義から用語集へリンク
- 用語集のセクション順を修正（新規 2 節が「関連ページ」の後ろに付いていた → 前に移動）
- ✅ overview.md:25「MCP は verify の条文検査が使う…」の係り受けを修正（主語を pdf-verify に）
- サイト内の graph 型 mermaid 全 5 枚（ja/en）で形の使い分けを統一（角丸=行為者/到達点・六角形=Skill・二重枠=MCP・平行四辺形=入力・円筒=外部リソース）

## その他のページ別指摘（要点）

- **index.md**: 「決定論的 4 値判定」「正典」「実体」がトップで裸。details を機能語に
- **overview.md**: architecture:39 と同文重複（Skill を入れると〜）
- **architecture.md**: mermaid 2 枚の情報重複（役割の書き分けを）。正典の定義が図より後（使ってから定義）
- **getting-started.md**: 「サブセット」の 2 義（規則の部分集合 / フォントサブセット）が同一ページに。「単一フェイス」→「.ttc 不可」で writer ページと統一を
- **agents.md:11**: 「MCP instructions が効く」の主語・目的補足
- **mcp/index.md**: 「層」列から architecture へのリンクなし
- **pdf-spec.md**: 「返しもの」造語・「持ち上げた/縛る」比喩（92行）。出力の読み方がツール一覧より前
- **pdf-reader.md**: 「同じ顔で返さない」比喩 3 箇所・「深さ優先+depth で木を符号化」（137行）・165〜168 の主語不明
- **pdf-writer.md**: pdfVersion セルが最長（80行）→ 注釈へ分離。danger ボックスの位置がツール名より前（259行）。/PieceInfo は注釈送り
- **pdf-trust.md**: 実測表に trust_anchors 列がなく「差分は CRL だけ」を確認できない（45〜57行）。70〜74 の主語 3 回交代文
- **incoming-audit.md**: ルール ID 表記ゆれ（POL- 接頭辞の有無）。digest / チェーンの表記
- **batch-audit.md**: 「トリアージ」「文脈の無駄遣い」（= LLM のコンテキストの意）・「identity 評価」
- **pdfa-archive.md / accessibility.md**: 表内略記（TS/DocTS）初出・「標準 14 フォント」表記ゆれ・「106 検査」の分母説明
- **spec-research.md**: 「DTS」未展開
- **glossary.md**: violationAssessment の参照先なし。PDF 側未収録語（XMP・AcroForm・OutputIntent・ByteRange・CAdES・OCSP/CRL・線形化・IoU）
- **env-vars.md**: 「CJK」→「日本語」。TEST_FONT_PATH が表外
- **error-codes.md**: writer 以外未収録の明記なし。next_actions / retryable の説明と JSON 例がない
- **iso-reading-primer.md**: 「この 5 段階」が表（can 含む）と不一致（46行）
- **pdf-constraints.md**: 「沈黙合格や冤罪」「評価意味論」の言い換え。リンク先が reference/mcp（自動生成）と mcp/（解説）で不統一

## 図・表が効く箇所（未実装分）

- mcp/index.md: reader → writer の座標受け渡しの図
- error-codes.md: 構造化エラーの JSON 例
- getting-started.md: 「目的別に必要なサーバー」早見表
