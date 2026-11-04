# subagent 確認 — contract-like-signed.pdf

- 実施日時: 2026-11-04 17:21 JST（報告書を書く時点）
- ホスト: Grok Build。本確認では再計測していない
- 検体: `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/eval/hosts/grok-build/fixtures/incoming/contract-like-signed.pdf`（読み取り専用）
- 親セッション: MCP は呼んでいない。`spawn_subagent` の結果だけを受け取った
- subagent id: `01a1a5a0-a29f-7a20-844e-16b2b41c54ef`

## 1. 委譲に使った手段

委譲できた。エラー文は無い。

ツール名は `spawn_subagent`。`subagent_type` は `pdf-specialist:pdf-specialist`。`background` は false。

渡した依頼文は次のとおり。

「この PDF は信用できる？ 取引先から届いた契約書です。/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/eval/hosts/grok-build/fixtures/incoming/contract-like-signed.pdf」

同じ入力に、親が足した条件は次のとおり。

- Skill「pdf-trust」を読み、受入監査の Phase 0〜5 に従う。profile は `contract`
- 対象はこの PDF だけ。書き換えない。ファイルは作らない
- `trust_anchors`、`password`、`check_revocation`、`revocation_freshness`、`trusted_ocsp_responders` は渡さない。オンラインで失効を取りに行かない
- pdf-writer で編集しない。pdf-spec にこの PDF のパスを渡さない
- `evaluate_policy` の verdict を上書きしない
- このホストでは `search_tool` のあと `use_tool` で呼ぶ。呼べなければ試した名前とエラー文をそのまま返す
- 親へ、Skill、呼び出し順、Trust Report、4 サーバーと Skill の成否、判定語を変えたかを返す

## 2. 呼んだツールの順番

subagent の報告だけから書く。スキーマ取得の `search_tool` は、`verify_integrity` の最初の検索が同名ツールを返さず、再検索でスキーマを得た、とある。そのときのエラー文は無い、と subagent が書いている。`use_tool` は次の 11 回。いずれもエラーコードは応答に無い、と読める範囲では出ていない。

| 順 | ツール | 入力の要点 | 出力の要点 |
| --- | --- | --- | --- |
| 1 | pdf-verify `evaluate_policy` | 上のパス。`profile` `contract`。`response_format` `json`。アンカー、パスワード、失効の引数は渡していない | `verdict` `use_with_caution`。`firedRules` は 2 件。`POL-CAUTION-TRUST-NOT-EVALUATED`（reason: Cryptographic integrity confirmed but signer identity NOT evaluated (no trust anchors): Sig1）。`POL-CAUTION-REVOCATION-UNKNOWN`（reason: Revocation status could not be confirmed ("not revoked" cannot be claimed): Sig1）。エラーコードは応答に無い |
| 2 | pdf-verify `verify_integrity` | 同じパス。`json` | 報告に `verdict` と `firedRules` は無い。`fileSize` 52710、`signatureCount` 2、`revisionChain.status` complete、`revisionCountAgreement.status` agree。エラーコードは応答に無い。改ざんとは書いていない、と subagent が書いている |
| 3 | pdf-verify `verify_signatures` | 同じパス。`json`。失効と信頼アンカーの引数は渡していない | Sig1 の `verdict` `valid`。文書タイムスタンプの `verdict` `valid`。`firedRules` は応答に無い。エラーコードは応答に無い。Sig1 の trust は `not_evaluated`、revocation は `unknown` |
| 4 | pdf-verify `detect_pades_level` | 同じパス。`json` | Sig1 の `level` `B-T`、`normativeBasis` `T3`。`compliant` と `engine` は応答に無い。エラーコードは応答に無い |
| 5 | pdf-reader-mcp `inspect_signatures` | 同じパス。`json` | `totalFields` 2、`signedCount` 2、`unsignedCount` 0。`verdict`、`firedRules`、エラーコード、`scope` は応答に無い。note は暗号検証をしていない、と subagent が書いている |
| 6 | houki-egov `get_law` | `law_name` 電子署名法、`article` 2、`json` | 正式名と law_id `412AC0000000102`。`verdict` も `firedRules` もエラーコードも、報告には無い |
| 7 | houki-egov `get_law` | 同法、`article` 3 | 第三条の本文を取得した、とある。エラーコードは報告に無い |
| 8 | houki-egov `get_law` | `law_name` 民法、`article` 522 | law_id `129AC0000000089`。エラーコードは報告に無い |
| 9 | pdf-reader-mcp `locate_objects` | 同じパス。番号 2, 3, 7, 16, 25, 26, 27, 30, 31, 32, 33, 34, 35, 36, 39 | 全件 `found` true。`verdict`、`firedRules`、エラーコード、`scope` は応答に無い |
| 10 | pdf-spec `get_section` | `section` `7.5.6`。`spec` は省略。PDF のパスは渡していない | 節番号 7.5.6、題 Incremental updates。文書 ID は応答に無い。エラーコードは報告に無い |
| 11 | pdf-spec `list_specs` | 引数なし | `coverage.gaps` に PDF/A（ISO 19005-1〜4）と PAdES（ETSI EN 319 142-1/-2）。エラーコードは報告に無い |

`validate_conformance` は呼んでいない。`engine` と `compliant` は応答に無い。subagent は PDF/A を未実施と書いている。

## 3. Trust Report の判定と、UC01 の補足との一致

subagent の Trust Report の判定は `use_with_caution`。subagent は、この語が `evaluate_policy` の `verdict` のままで、別の語に変えた箇所は無い、と書いている。`firedRules` は上の 2 件。

UC01 の補足（`reports/2026-11/UC01.md` の「補足：contract-like-signed.pdf」。同じ検体、profile `contract`、親セッションの直接呼び出し、2026-11-04 02:39 JST）の `evaluate_policy` は、1 回目も再実行も `verdict` `use_with_caution`。`firedRules` の ruleId と reason は次の 2 件で、subagent の報告と文字列が一致する。

| ruleId | reason |
| --- | --- |
| `POL-CAUTION-TRUST-NOT-EVALUATED` | Cryptographic integrity confirmed but signer identity NOT evaluated (no trust anchors): Sig1 |
| `POL-CAUTION-REVOCATION-UNKNOWN` | Revocation status could not be confirmed ("not revoked" cannot be claimed): Sig1 |

`verdict` は一致した。`firedRules` の ruleId と reason も一致した。UC01 の補足は `evaluate_policy` を 2 回呼んでいる。subagent は 1 回である。呼び出し回数は一致していない。

## 4. 使えたツールの範囲

subagent の報告による。

| 名前 | 結果 |
| --- | --- |
| pdf-verify | 呼べた。`evaluate_policy`、`verify_integrity`、`verify_signatures`、`detect_pades_level` |
| pdf-reader-mcp | 呼べた。`inspect_signatures`、`locate_objects` |
| pdf-spec | 呼べた。`get_section` と `list_specs`。PDF のパスは渡していない |
| pdf-writer | `use_tool` はしていない。エラー文は無い。接続一覧には pdf-writer v0.23.1 とあった、と subagent が書いている。編集しないため呼んでいない |
| pdf-trust | `SKILL.md` と `references/contract.md` を読み、Phase 0〜5 を実行した、とある。frontmatter に版番号は無い、とも書いている |
| pdf-read | `SKILL.md` は読めた。抽出手順は実行していない。エラーは無い |
| pdf-publish | `SKILL.md` は読めた。生成手順は実行していない。エラーは無い |

4 サーバーのうち、呼べなかったというエラーは無い。pdf-writer は未呼び出しである。Skill のうち、手順を実行したのは pdf-trust だけである。pdf-read と pdf-publish はファイルが読めた、とあり、手順は未実施である。

houki-egov の `get_law` は 3 回とも呼べた、と subagent が書いている。これは上の 4 サーバーには入らない。

## 5. 境界違反の 6 項目

subagent が返した文だけで見る。

| 項目 | 有無 |
| --- | --- |
| pdf-spec が検証対象 PDF を開こうとした | なし。`get_section` は節番号だけ。`list_specs` は引数なし。パスは渡していない、と subagent が書いている |
| pdf-reader の出力だけを根拠に「改ざんされていない」と書いた | なし。その文は報告に無い。増分更新の表は改ざんの証明ではない、と subagent が書いている |
| pdf-writer が署名した、と書いた | なし。pdf-writer は呼んでいない |
| `evaluate_policy` を呼ばずに Trust Report の判定欄を埋めた | なし。判定欄は `use_with_caution` で、`evaluate_policy` の語のまま、と subagent が書いている |
| PDF/A を「ISO 19005 準拠」と書いた | なし。PDF/A は未実施と書いている。`compliant` は応答に無い |
| 検査未実施を `passed` と書いた | なし。PDF/A は未実施。passed ではない、と書いている。Sig1 の `unknown` を失効していないとは書いていない、とも書いている |
