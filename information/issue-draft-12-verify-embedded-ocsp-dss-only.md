# Issue 下書き: [pdf-verify-mcp] 埋め込み失効情報の読み取り範囲が、出力の説明と合っていない

> 登録済み（2026-09-17）: https://github.com/shuji-bonji/pdf-verify-mcp/issues/15

**対象リポジトリ: pdf-verify-mcp / 確認した版: 0.26.1（commit c88e9f4）**

## 現在の動作

`src/services/verification-service.ts` 207〜208 行:

```ts
const embeddedOcsps = dssOcsps;
const embeddedCrls = [...artifacts.crls, ...dssCrls];
```

- OCSP 応答は DSS からだけ読む
- CRL は、DSS と CMS `SignedData.crls` から読む
- CMS の署名属性 `adbe-revocationInfoArchival`（OID 1.2.840.113583.1.1.8）は読んでいない（`src` に OID の参照は 0 件）。Acrobat 系の署名は、失効情報をこの属性に入れることが多い

一方、`revocation.ts` 413 行の `detail` は `'Embedded OCSP response (DSS/CMS)'` で、CMS の OCSP も読んでいるように見える。

## 仕様

ISO 32000-2 §12.8.3.3.1 は、CMS の中に「署名属性としての失効情報（PDF 1.6）」を置けるとしている。この属性には、署名者証明書と発行者証明書の失効確認に必要な情報を入れてよい。

## 影響

DSS が無く、`adbe-revocationInfoArchival` に OCSP 応答または CRL がある PDF は、`embedded` で `unknown` になる。実際には通信なしで判定できる。

## 直す案

1. `adbe-revocationInfoArchival` を読み、中の `crl` と `ocsp` を `embeddedCrls` / `embeddedOcsps` に加える
2. `revocation.source` か `detail` で、DSS と CMS のどちらから得たかを区別する（例: `detail: 'Embedded OCSP response (DSS)'` / `'(CMS signed attribute)'`）
3. 1 をすぐにやらない場合も、`detail` を `(DSS)` に直す

## 受入条件

- DSS が無く、`adbe-revocationInfoArchival` に OCSP 応答を持つ検体で、`embedded` のまま `good` / `revoked` が返る
- `detail` の記述と、実際に読んだ場所が一致する
- `detect_pades_level` の「DSS の失効情報が署名者を覆うか」（`ltv.revocationDataCoversSigner`）は、DSS の中身だけで判定する
  - 現在は `verification-service.ts` 733〜738 行で、CMS の CRL（`artifacts.crls`）も一緒に渡している。DSS に署名者の失効情報が無くても、CMS に CRL があれば「覆っている」になり、B-LT と判定されうる。B-LT の条件は DSS なので、ここは DSS だけに絞る
