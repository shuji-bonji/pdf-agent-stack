# Issue 下書き: [pdf-verify-mcp] DocTimeStamp 検証が一律 INDETERMINATE になる

**対象リポジトリ: pdf-verify-mcp（stack ではない）/ 優先度: Issue 03 の前後で消化推奨**

> **🏁 完了（2026-08-11）: 最終的に v0.14.2 として決着**（0.14.1 公開後、plugin.json 同期の行き違いから
> 同内容の 0.14.2 を再リリース。CHANGELOG は 0.14.2 名義に統一。0.14.1 も npm に残るが正典は 0.14.2。
> 再発防止 = `scripts/sync-plugin-version.mjs` + `version` フック + `prepublishOnly --check` を導入済み）
>
> ~~v0.14.1 リリース済み・公開版検証 PASS~~
> plugin 経由（npx @latest = 0.14.1）で 4 件実測: 官報 = 署名 VALID + DocTS **VALID** /
> 自前 known-good（trust_anchors 指定）= 両方 VALID + **trusted** / esig/dss = 両方 VALID
> （旧版で INDETERMINATE だった DocTS 3 件がすべて VALID に）/ 改ざん検体 = 両方 **INVALID**
> （診断 = Message digest doesn't match / TSTInfo verification is failed）。
> stack.json / README も 0.14.1 に再生成済み（`--check` PASS・今回は手順漏れなし）。
> このファイルは経緯の記録として残す（Issue 登録は不要になった）。
>
> ~~修正済み（2026-08-11・未コミット）— 残りはホスト作業のみ~~
>
> - 原因確定: pkijs は eContentType = id-ct-TSTInfo（RFC 3161 §2.4.2・原文確認済み）の場合、
>   encapsulated でも `data`（imprint 対象 = ByteRange バイト）を要求して messageImprint を再検証する。
>   `verifyCms` の「encapsulated なら data 不要」の一般化が TSTInfo だけ外れていた
> - 修正: `cms-verifier.ts` = TSTInfo なら data を渡す（`OID.TST_INFO` を constants に追加）/
>   `verification-service.ts` = 「imprint 一致・署名計算 false・エラーなし」を INVALID に
>   （通常署名と同じ規則。判定不能は無罪ではない）
> - 実測: 検体 3 系統の DocTS がすべて **VALID**・内容改ざん → INVALID・
>   TSA 署名改ざん → INVALID・パディング改ざん → VALID（DER 外なので正しい）
> - テスト: ヘルパ拡張（`subFilter: 'ETSI.RFC3161'` + `mutateCms`）+ 回帰 3 本。
>   コンパイル済み JS での同一シナリオ実走 = 9/9 pass（サンドボックス）
> - sandbox 済み: typecheck / build / biome（npx 2.5.4）緑・CHANGELOG [Unreleased] 記載
> - **ホスト残作業**: ① `npm test`（vitest 全件）② `npm run check` ③ バージョン決め（0.14.1 patch 想定）
>   → リリース（署名は push 前）→ `npx` で公開版検証 → stack 再生成（Issue 01 の workflow が検知する）
>
> 設計論点（detect_pades_level の B-B 切り詰め）は**未着手のまま別判断** — ETSI コーパス外（T3）のため



## 現象（2026-08-11 実測・v0.14.0 相当のローカル）

`verify_signatures` で ETSI.RFC3161 の DocTimeStamp が **2 検体とも** INDETERMINATE:

- 検体 A: esig/dss `PAdES-LTA.pdf`（Universign TSA）
- 検体 B: 官報 2026-08-10 号本紙 p.1（AMANO TSA / SECOM TimeStamping CA3）
- 共通の診断: `Missed detached data input array`
- どちらも Digest match (ByteRange vs messageDigest) = yes なのに
  `Signature cryptographically verified: no`

検体は `pdf-agent-stack/docs/specimens/`（gitignore 済み）に保存済み:
`dss-pades-lta.pdf` / `kanpo-20260810-h01765-p1.pdf`

## 切り分け結果（2026-08-11・known-good 検体で確定）

外部検体は「正しく署名が付与されている保証がない」ため、自前の known-good 検体で切り分けた:

- 検体 C: `selfmade-pades-lta.pdf` — pdf-writer-mcp でベース生成 → pyHanko 0.36.2 で
  自作 CA + 署名 + ダミー TSA（署名 TS）+ DocTimeStamp を付与（全工程管理下・CA は `selfmade-ca.pem`）
- 結果: **検体 C でも DocTimeStamp が INDETERMINATE・同一診断** `Missed detached data input array`
- 決定的な対照: **同じダミー TSA が発行した署名タイムスタンプは同ファイル内で検証成功**
  （`TST: imprint match=yes, TSA signature=yes`）

→ 3 つの独立した生成系（pyHanko / EU DSS / 官報・AMANO）で同一診断、かつ同一 TSA でも
署名 TS 分岐は通る。**バグは verify の DocTimeStamp 分岐に局在**（検体側ではない）。

## 仮説

RFC 3161 TSTInfo の検証パスで、detached の messageImprint 対象データ（ByteRange 連結）を
CMS 検証器に渡していない（診断文字列は下位ライブラリ由来に見える）。
通常署名（CAdES）は同じ検体で VALID なので、DocTimeStamp 分岐に限定されたバグの可能性が高い。

## ついでに確認したい設計論点（別 Issue に割ってもよい）

`detect_pades_level` は「署名タイムスタンプなし・DocTimeStamp あり」を B-B に切り詰める。
検体 A は DSS + 署名者カバーの OCSP/CRL + DocTS が揃うのに B-B 判定。
ETSI EN 319 142-1 の B-T が要求する trusted time を DocTS が担えるなら under-detection。
ETSI はコーパス外（T3）なので、意図した保守的挙動なら README にその旨を明記して閉じる。

## 受入基準

- 検体 A・B の DocTimeStamp が VALID（または根拠の明確な INDETERMINATE 理由の報告）になる
- 回帰: 既存テスト緑 + npx で公開版検証
