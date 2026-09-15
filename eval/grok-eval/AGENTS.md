# PDF Agent Stack 実機評価 — Grok Build 作業規則

このディレクトリは実装リポジトリではありません。MCP と Skill を呼び出して、報告書を書く作業場です。

## 目的

PDF Agent Stack が Grok Build 上で実務に耐えるかを測る。判定をモデルが上書きしないこと、呼び出し順が Skill の型に沿うこと、失敗を隠さないことを確認する。

## やってよいこと

- MCP ツールを呼び出す
- `fixtures/` と `out/` に PDF と添付データを作る
- `reports/` に Markdown の報告書を書く
- 公開されている無償の標本 PDF を取得する
- 自分で作った請求書・契約書・帳票のダミーを使う

## やってはいけないこと

- ISO 規格 PDF を再配布する（`PDF_SPEC_DIR` は利用者が手元に置く。成果物に規格本文を貼らない）
- `evaluate_policy` の `verdict` を文章で上書きする
- reader の観測を「改ざんされていない」「PDF/A 準拠」と言い換える
- writer の正常終了を「規格どおり」と書く
- `ensure_pdfa` / `ensure_tagged` のあとに `validate_conformance` を省略する（UC09 で意図的に省略する手順は除く）
- 「ISO 19005 準拠」「PAdES 準拠」と書く（言い切り強度を守る）
- 実在企業の機密、個人の医療情報、本番の契約書を検体にする
- リポジトリの製品コードをこの作業のついでに書き換える

## 言い切り強度

| 記号 | 対象 | 書いてよい言い方 | 書いてはいけない言い方 |
| --- | --- | --- | --- |
| T1 | ISO 32000、ISO 14289（PDF/UA） | 条文番号を引いて要求を述べる | 目の前のファイルが規格どおりだと証明した、と書く |
| T2 | ISO 19005（PDF/A） | 「veraPDF が COMPLIANT と判定した」 | 「ISO 19005 準拠」 |
| T3 | ETSI PAdES | 「構造が B-LTA に一致する」 | 「PAdES 準拠」 |

4 値判定は次の語だけを使う。`trust_and_use` / `use_with_caution` / `human_review_required` / `reject`。

「無い」と「分からない」を混ぜない。`revocation: unknown` は失効していない、ではない。検査を回せなかった場合は「未実施」と書く。`passed` にしない。

## 呼び出しの原則

- 観測は pdf-reader。判定は pdf-verify。生成は pdf-writer。条文は pdf-spec。編成は Skill。
- pdf-spec に検証対象 PDF のパスを渡さない。
- 監査セッションで pdf-writer を使って対象ファイルを書き換えない。
- ツール応答は報告書に、入力 JSON と出力 JSON の要点を残す。全文が長いときは `firedRules`・`verdict`・`compliant`・エラーコードを残す。

## 報告書

各ユースケースの終了時に `reports/UCnn.md` を `00-report-template.md` の型で書く。推測で埋めない。呼べなかったツールは「未実施」と理由を書く。
