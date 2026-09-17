# Issue 下書き: [pdf-verify-mcp] 失効日時と署名時刻を比べずに `revoked` → `invalid` にしている

> 登録済み（2026-09-17）: https://github.com/shuji-bonji/pdf-verify-mcp/issues/13

**対象リポジトリ: pdf-verify-mcp / 確認した版: 0.26.1（commit c88e9f4）/ 判定結果が変わる変更**

## 現在の動作

`checkRevocation`（`src/services/revocation.ts` 393 行〜）は、OCSP 応答の `certStatus` が revoked、または CRL に証明書のシリアル番号が載っていれば、`RevocationStatus.REVOKED` を返す。失効日時（OCSP の `revocationTime`、CRL の `revocationDate`）は読んでいない（`revocation.ts` に両フィールドの参照は 0 件）。

`verification-service.ts` 244〜248 行は、`REVOKED` を受け取ると無条件で `verdict = invalid` にする。

その結果、次の署名もすべて `invalid` になる。

- 署名タイムスタンプ（B-T）で署名時刻が証明されていて、その**後に**証明書が失効した署名
- DSS と文書タイムスタンプ（B-LTA）で、署名時点の検証材料が保存されている署名

## 仕様

ISO 32000-2 §12.8.3.4.6 は、署名を検証する時刻として 2 つの場合を挙げている。

1. 現在の UTC 時刻
2. この署名、この署名を覆う署名、またはこの署名を覆う文書タイムスタンプにタイムスタンプトークンがあるときは、過去の UTC 時刻

§12.8.3.4.5 b) も、検証情報がその時刻に存在したと分かっていれば、現在以外の時刻で検証してよいとしている。

## 直す案

- 検証時刻（Issue 10 で決める基準時刻）より後の失効は、`revoked` ではなく、失効日時付きの `good` 相当として扱う
  - 例: 新しい状態 `revoked_after_validation_time` を足す、または `detail` に失効日時を入れる。`verdict` は `invalid` にしない
- 検証時刻より前の失効、または失効日時を読めない場合は、今と同じ `invalid`
- `RevocationResult` に `revocationTime: string | null` を足す

## 関連して見つかったこと（同じ「`revoked` → `invalid`」の経路）

`revoked` だけで `verdict` を `invalid` にできるので、失効情報そのものを検証しているかが重要になる。

- **CRL**：`evaluateCrl`（354 行〜）は、発行者証明書が見つからないときに、CRL の署名を検証しないまま状態を返す（`CRL signature NOT verified` の注記付き）。署名を検証できなかった場合は `unknown` に下げているのに、発行者証明書が無い場合は下げていない。このため、検証していない CRL で `invalid` になりうる
- **OCSP**：埋め込み（399 行〜）・オンライン（`fetchOcspStatus` 271 行〜）とも、`getCertificateStatus` の結果をそのまま使っている。応答者の署名（`BasicOCSPResponse.verify`）を検証していない
- **有効期間**：CRL の `thisUpdate` / `nextUpdate`、OCSP の `thisUpdate` / `nextUpdate` を、検証時刻と比べていない

## 受入条件

- 検証時刻より後に失効した証明書の署名で、`verdict` が `invalid` にならない（新しい検体とテストを追加する）
- 検証時刻より前に失効した証明書の署名は、今と同じく `invalid`
- 署名を検証していない CRL / OCSP 応答だけでは、`invalid` にならない
- サイトの「署名の検証で確かめること」節の注意書き（「失効した日時と署名時刻の前後は比べていません」）を更新する
