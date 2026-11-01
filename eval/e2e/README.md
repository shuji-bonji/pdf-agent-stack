# eval/e2e — 書いてから読む・起動中に環境を変える

PDF Agent Stack の 4 サーバー（reader / writer / verify / spec）を stdio で起動し、利用者のホストと同じく **1 つのプロセスを使い続けたまま** ファイルや環境を変えて、もう一度呼びます。各リポジトリの単体テストは 1 回の呼び出しの答えを見るだけなので、プロセスが覚えている状態が古くなっても見えません。ここはそれを見るための場所です（[#44](https://github.com/shuji-bonji/pdf-agent-stack/issues/44)）。

## 動かし方

```bash
cd eval/e2e
npm ci
npm run setup   # stack.json の公開版（published）を node_modules に入れる（package-lock は変えない）
npm test
```

| 環境変数 | 意味 |
| --- | --- |
| （無し） | `npm run setup` が入れた公開版を起動する |
| `PDF_E2E_LOCAL=1` | このリポジトリの `mcp/<name>`（手元でビルドした `dist`）を起動する。`setup` は何もしない |
| `PDF_E2E_<KEY>_DIR=<dir>` | そのサーバーだけ別の置き場を使う（`dist/index.js` と `node_modules` を持つフォルダー）。`KEY` は `READER` / `WRITER` / `VERIFY` / `SPEC` |

CI（`.github/workflows/e2e.yml`）は、手動（`workflow_dispatch`）と毎週月曜 06:00 JST に公開版で回します。

## シナリオ

| ファイル | 確かめること | 関わる Issue |
| --- | --- | --- |
| `tests/s1-publish.test.mjs` | pdf-publish の流れ。writer で書く → reader で読み戻す → verify で採点 → 同じパスに書き直す → reader と verify が書き直した後の内容（題名・ファイルの大きさ）を返す | — |
| `tests/s2-freshness.test.mjs` | 1 回読んだ PDF を同じパスに 3 回書き直し（メタデータ・注釈・結合）、同じプロセスで読み直す | — |
| `tests/s3-reader-renderer.test.mjs` | `render_page` を描画の部品（`@hyzyla/pdfium`）無しで呼ぶ → 起動したまま部品を戻す → 呼ぶ | pdf-reader-mcp#34 |
| `tests/s4-verify-verapdf.test.mjs` | `validate_conformance` を veraPDF 無しで呼ぶ → 起動したまま置く → 呼ぶ | pdf-verify-mcp#24 |
| `tests/s5-spec-dir.test.mjs` | `PDF_SPEC_DIR` の仕様書を、壊れたものから直す・ページ数の違うものに差し替える・足す | pdf-spec-mcp#29・#30 |
| `tests/selfcheck.test.mjs` | テスト自体の確かめ。2 回目に 1 回目の応答を返す読み手に S2 の検査を当て、食い違いを報告することを確かめる | — |

## 期待値の決まり

- 期待値は緩めません。直っていない不具合は、落ちるテストのまま残します（「落ちることを期待する」とは書きません）。
- 本物の仕様書は配布できないので、S5 は仕様の名前を付けた最小の PDF を使います。S5 はディスクの索引キャッシュを切って（`PDF_SPEC_CACHE=off`）、メモリの層を測ります。
- S4 は `PDF_VERIFY_VERAPDF` の経路で測ります。PATH と決まった場所の経路は、Homebrew の veraPDF がある手元と無い CI で結果が変わるためです。
- S3 は、部品が最初から入っていない環境では飛ばします（戻すものが無いため）。

## まだ無いもの

- pdf-trust の流れ（署名付きの検体を監査 → 注釈を増分保存 → verify が署名後の変更を見つける）。署名付きの検体を自作する手段ができてから足します。

## 2026-11-01 の結果

| 起動したもの | S1 | S2 | S3 | S4 | S5（3 件） | selfcheck |
| --- | --- | --- | --- | --- | --- | --- |
| 公開版（reader 0.17.0 / writer 0.22.0 / verify 0.31.0 / spec 0.10.0） | 通る | 通る | 落ちる | 落ちる | 3 件とも落ちる | 通る |
| #34・#24・#29・#30 を直した版（reader・verify・spec は修正のブランチの `dist`、writer は 0.22.0） | 通る | 通る | 通る | 通る | 3 件とも通る | 通る |
