# 補足 — 2026-11 で扱わなかった検体

- 実施日時: 2026-11-04 04:10 JST
- 見た 2026-11 の報告書: `reports/2026-11/UC01.md`、`UC07.md`、`UC02.md`、`UC03.md`、`UC04.md`、`UC08.md`
- 見た 2026-09 の報告書: `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/eval/hosts/grok-build/reports/UC01.md`、`UC07.md`、`UC02.md`、`UC03.md`、`UC04.md`、`UC08.md`
- この回で呼んだツール: `pdf-reader-mcp__summarize` 1 回、`pdf-verify__detect_pades_level` 1 回
- pdf-specialist への委譲: していない
- 次の UC には進んでいない

2026-11 の「手順の検体と、データ準備の表だけの検体」の項で、扱ったと書いていない行を拾った。2026-09 の同番号の報告書に、その検体へのツール呼び出しが書いてあるものだけ、同じツールで呼んだ。書いていないものは呼んでいない。

## 1. 2026-11 の項で扱っていなかった検体

| UC | 検体 | 2026-11 の項の書き方 |
| --- | --- | --- |
| UC01 | （当該の見出しは無い） | 本編は `contract-unsigned.pdf` と `gazette-or-gov.pdf`。`contract-like-signed.pdf` は番号付き手順の外と書き、末尾の補足で扱い済み。この回の対象から外した |
| UC07 | `scan-like.pdf` | データ準備の表だけ。作成だけ。reader は未実施 |
| UC07 | 暗号化 PDF | 表にも手順にも検体名は無い。未実施。作っていない |
| UC02 | データ準備の表にだけある検体 | 無し |
| UC02 | キット `fixtures/incoming/` | 指示書は検体名を出していない。未使用 |
| UC03 | `contract-like-signed.pdf` | 指示書の検体名には無い。`detect_pades_level` は呼んでいない。同一 md5 の `selfmade-pades-lta.pdf` は本編で 1 回呼んだ |
| UC03 | 2026-09 の `out/` | 入力にしない、とユーザーが指定。未使用。指示書の検体名ではない |
| UC04 | UC01 の未署名契約書（`contract-unsigned.pdf`） | データ準備の「または」のもう一方。未使用。選んだのは `ua-untagged.pdf` |
| UC04 | 2026-09 の `out/` と `fixtures/generated/` | ユーザーが入力にしないと指定。未使用。指示書の検体名ではない |
| UC08 | データ準備の表にだけある検体 | 無し |
| UC08 | キット `fixtures/incoming/` | 指示書は検体名を出していない。未使用 |
| UC08 | 2026-09 の `out/` と `fixtures/generated/` | 入力にしない、と開始時に指定。未使用。指示書の検体名ではない |

## 2. 2026-09 の報告書で扱っていたか

| UC | 検体 | 2026-09 |
| --- | --- | --- |
| UC01 | `contract-like-signed.pdf` | 扱っていた。`evaluate_policy` profile `contract` ほか。2026-11 の補足で扱い済み。この回は呼んでいない |
| UC07 | `scan-like.pdf` | 扱っていた。検体パスは `fixtures/incoming/scan-like.pdf`。手順 6 は `summarize` `scan-like.json`。Read Report は `summarize` のみ |
| UC07 | 暗号化 PDF | 2026-09 も未実施。`reports/UC07.md` に暗号化 PDF のツール行は無い。手順 4 は「呼べなかったツールと理由: なし」 |
| UC02 | キット `fixtures/incoming/` | 2026-09 も未実施。検体パスは `fixtures/generated/invoice-source.md`、`invoice-2026-0915.csv`、`out/publish-invoice.pdf` |
| UC03 | `contract-like-signed.pdf` | 扱っていた。検体パスに `contract-like-signed.pdf`（selfmade-pades-lta）とある。手順 8 は `detect_pades_level`。要点は `level` `B-T`、`revocationDataCoversSigner` false |
| UC03 | 2026-09 の `out/` | 指示書の検体ではない。2026-09 は自らの成果物パスとして `out/publish-invoice.pdf` などを書いている。この回の入力にはしない |
| UC04 | `contract-unsigned.pdf` | 2026-09 も未実施。検体パスは `out/ua-report.pdf` と `fixtures/generated/ua-untagged.pdf`。`contract-unsigned` という文字列は無い |
| UC04 | 2026-09 の `out/` と `fixtures/generated/` | 指示書の検体ではない。2026-09 は当時の成果物を書いている。この回の入力にはしない |
| UC08 | キット `fixtures/incoming/` | 2026-09 も未実施。検体パスは `fixtures/generated/denshi/invoice.md`、`invoice-detail.csv`、`out/denshi-invoice.pdf` |
| UC08 | 2026-09 の `out/` と `fixtures/generated/` | 指示書の検体ではない。2026-09 は当時の成果物を書いている。この回の入力にはしない |

## 3. この回で呼んだもの

| UC | 検体 | ツールと引数 | 結果の要点 | 追記 |
| --- | --- | --- | --- | --- |
| UC07 | キットの `fixtures/incoming/scan-like.pdf` | `summarize`。`response_format` `json`。パスは 2026-09 の検体パス | `textExtractability` `extracted`。`hasText` true。`imageCount` 0。`next` `[]`。`pageCount` 1。`fileSize` 14799。md5 `89980e9d66af63a9f95fe44c2f56a6b7`。エラーコード無し | `reports/2026-11/UC07.md` の末尾「補足：scan-like.pdf」 |
| UC03 | キットの `fixtures/incoming/contract-like-signed.pdf` | `detect_pades_level`。`response_format` `json`。2026-09 の手順 8 に `response_format` の文字は無い | `reconstructed` false。Sig1 の `level` `B-T`。`normativeBasis` `T3`。`hasDss` true。`revocationDataCoversSigner` false。`dssCrlCount` 0。`levelsTruncated` null。エラーコード無し | `reports/2026-11/UC03.md` の末尾「補足：contract-like-signed.pdf」 |

作業場で作った `fixtures/generated/2026-11/scan-like.pdf`（11420 bytes、md5 `448bf686fae304baa951a3d81826f9ed`）は、2026-09 の引数に無い。この回では開いていない。その reader は未実施のままである。

`contract-like-signed.pdf` の md5 `3076f0d9052acd1e6940721cbab1fbe1` は、UC03 本編が `selfmade-pades-lta.pdf` と同一と書いた値である。本編の呼び出しは残している。この回は、2026-09 が検体パスに書いたパスを 1 回足した。

## 4. 呼ばなかったもの

- UC07 の暗号化 PDF。2026-09 も未実施。
- UC02 のキット `fixtures/incoming/`。2026-09 も未実施。
- UC04 の `contract-unsigned.pdf`。2026-09 も未実施。
- UC08 のキット `fixtures/incoming/`。2026-09 も未実施。
- UC01。`contract-like-signed.pdf` は既存の補足で扱い済み。ほかに、当該の見出しから拾う未扱い検体は無い。
- 2026-09 の `out/` と `fixtures/generated/`。指示書の検体名ではなく、この回の入力にしていない。
