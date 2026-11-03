# E5：GitHub Actions の 3 OS の行列

`eval/e2e` を、OS と CPU を変えて公開版で回します。パッケージが OS に左右されずに動くかを確かめます。ホストへの登録（パスと環境変数の渡し方）は E6 の範囲で、ここでは扱いません。

## 回し方

GitHub の Actions で **E2E OS matrix (trial 2026-11 E5)**（`.github/workflows/e2e-os-matrix.yml`）を手動で起動します。

| ランナー | OS・CPU |
| --- | --- |
| `ubuntu-latest` | Linux x64 |
| `ubuntu-24.04-arm` | Linux arm64 |
| `macos-latest` | macOS arm64 |
| `macos-15-intel` | macOS x64 |
| `windows-latest` | Windows x64 |
| `windows-11-arm` | Windows arm64 |

arm64 と Intel の macOS のランナーが使えない場合、そのジョブは待ち続けます。そのときは取り消し、結果の表に「使えなかった」と書きます。

各ジョブは、次の順に進みます。

1. `npm ci`
2. `npm run setup` をそのまま回す。止まっても次へ進む（F-13 の観測）
3. 2 が止まったときだけ、同じ版（`node setup.mjs --print`）を `npm install --no-save` で入れる
4. Summary に OS・CPU・Node.js・npm の版、2 の結果、起動した版を書く
5. `tests/*.test.mjs` を回し、`junit.xml` を `e2e-<ランナー>` として保存する

## 確かめること

| シナリオ | 内容 |
| --- | --- |
| S0-reader / writer / verify / spec | 起動し、`tools/list` が `inputSchema`（`type: "object"`）付きのツールを返す |
| S0-paths | 空白と日本語を含むフォルダー・ファイル名を writer → reader → verify に渡す。Windows では区切りを `/` にした `C:/...` でも渡す |
| S1〜S5・selfcheck | `eval/e2e/README.md` のとおり。S4 は偽の veraPDF がシェルスクリプトなので Windows では飛ばす |
| F-13 | Windows で手順 2 が止まるか |

## 基準（2026-11-04 00:05 JST、クラウドのコンテナ・Linux x64・Node.js 22.23.4）

起動した版は reader 0.18.1・writer 0.23.1・verify 0.32.2・spec 0.11.0 です。13 件すべて通りました。`tools/list` のツール数は reader 18・writer 20・verify 7・spec 8 です。S0-paths の期待値を変えると落ちることも確かめました。

準備の途中で F-23 を見つけました（`FINDINGS.md`）。

## 結果

まだ回していません。push の後に手動で起動し、ここに書きます。

| ランナー | setup.mjs | S0 | S0-paths | S1 | S2 | S3 | S4 | S5（3 件） | selfcheck |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ubuntu-latest` | | | | | | | | | |
| `ubuntu-24.04-arm` | | | | | | | | | |
| `macos-latest` | | | | | | | | | |
| `macos-15-intel` | | | | | | | | | |
| `windows-latest` | | | | | | | | | |
| `windows-11-arm` | | | | | | | | | |
