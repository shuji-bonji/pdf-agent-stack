# Issue 下書き: [pdf-verify-mcp] 証明書チェーンの基準時刻に、署名者が書いた `signingTime` をタイムスタンプより優先して使っている

> 登録済み（2026-09-17）: https://github.com/shuji-bonji/pdf-verify-mcp/issues/12

**対象リポジトリ: pdf-verify-mcp / 確認した版: 0.26.1（commit c88e9f4）/ 判定結果が変わる変更**

## 現在の動作

`src/services/verification-service.ts` 209〜211 行:

```ts
const checkDate =
  artifacts.signingTime ??
  (cms.signatureTimestamp?.genTime ? new Date(cms.signatureTimestamp.genTime) : new Date());
```

`evaluateTrust` は、この `checkDate` で証明書の有効期間を判定する。順序は次のとおり。

1. CMS の `signingTime` 署名属性（署名者が自分で書く値）
2. 署名タイムスタンプの `genTime`（TSA が証明する値）
3. 実行時刻

## 問題

- `signingTime` は、署名者が任意の値を書ける。期限切れの証明書で署名し、`signingTime` を有効期間内の日付にすると、チェーン評価が通る
- タイムスタンプがあっても、`signingTime` があればそちらが使われる

## 仕様

ISO 32000-2 §12.8.3.4.5 b):

> The signature may be verified against a time other than the current time if all validation information (e.g. certificates and revocation information) is known to have existed at that time (e.g. using DSS …; using document timestamps …; or a signature timestamp is present in the signature as an unsigned attribute …). Otherwise, the local current time converted into the UTC shall be used.

同じ節の NOTE は、`/M`（署名辞書の署名時刻）は信頼できる署名時刻ではないとしている。現在時刻以外で検証してよい根拠として挙げられているのは、DSS・文書タイムスタンプ・署名タイムスタンプで、`signingTime` 属性は挙げられていない。§12.8.3.4.6 も、過去の時刻を使えるのはタイムスタンプトークンがある場合としている。

## 直す案

基準時刻を次の順にする。

1. 署名タイムスタンプの `genTime`（TSA の署名が検証できた場合に限る）
2. この署名を覆う文書タイムスタンプの `genTime`（検証できた場合に限る）
3. 実行時刻

- `signingTime` は、参考情報として出力に残す（今の `cms.signingTimeAttribute`）
- どの時刻を使ったかを出力に入れる（例: `trust.validationTime` と `trust.validationTimeSource: 'signature_timestamp' | 'document_timestamp' | 'current_time'`）
- Issue 09（失効日時との比較）は、ここで決めた基準時刻を使う

## 影響

- タイムスタンプの無い署名（B-B）で、証明書が期限切れのものは、`trusted` から `untrusted` に変わりうる
- `README.ja.md` の「検証基準時刻は署名時刻です」と、サイトの「③ で証明書の有効期間を判定する基準時刻」の節を更新する

## 受入条件

- `signingTime` を有効期間内に偽った、期限切れ証明書の署名（タイムスタンプ無し）が `trusted` にならない
- 有効な署名タイムスタンプがある署名は、タイムスタンプの時刻で評価される
- 使った基準時刻とその出所が、出力で分かる
