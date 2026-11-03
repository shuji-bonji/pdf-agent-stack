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
2. `npm run setup`
3. Summary に OS・CPU・Node.js・npm の版と、起動した版（`node setup.mjs --print`）を書く
4. `tests/*.test.mjs` を回し、`junit.xml` を `e2e-<ランナー>` として保存する

結果の表の 2 回の run は、F-13 を直す前の形で回しました。そのときは、`npm run setup` をそのまま回して止まるかを観測し（`continue-on-error`）、止まったときだけ同じ版を `npm install --no-save` で入れてからテストに進んでいました。F-13 を直した後、この 2 段の setup は外しました。

## 確かめること

| シナリオ | 内容 |
| --- | --- |
| S0-reader / writer / verify / spec | 起動し、`tools/list` が `inputSchema`（`type: "object"`）付きのツールを返す |
| S0-paths | 空白と日本語を含むフォルダー・ファイル名を writer → reader → verify に渡す。Windows では区切りを `/` にした `C:/...` でも渡す |
| S1〜S5・selfcheck | `eval/e2e/README.md` のとおり。S4 は偽の veraPDF がシェルスクリプトなので Windows では飛ばす |
| F-13 | Windows で `npm run setup` が止まるか（直した後は、止まらないことを確かめる） |

## 基準（2026-11-04 00:05 JST、クラウドのコンテナ・Linux x64・Node.js 22.23.4）

起動した版は reader 0.18.1・writer 0.23.1・verify 0.32.2・spec 0.11.0 です。13 件すべて通りました。`tools/list` のツール数は reader 18・writer 20・verify 7・spec 8 です。S0-paths の期待値を変えると落ちることも確かめました。

準備の途中で F-23 を見つけました（`FINDINGS.md`）。

## 結果（run 41661871087・41667260819）

起動した版は 6 本とも reader 0.18.1・writer 0.23.1・verify 0.32.2・spec 0.11.0 です。

| ランナー | イメージ | Node.js | setup.mjs | S0（4 件） | S0-paths | S1 | S2 | S3 | S4 | S5（3 件） | selfcheck |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ubuntu-latest`（linux-x64） | ubuntu-26.04 | 22.23.4 | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る |
| `ubuntu-24.04-arm`（linux-arm64） | ubuntu-24.04-arm | 22.23.4 | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る |
| `macos-latest`（darwin-arm64）※ | macos-26-arm64 | 22.23.4 | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る |
| `macos-15-intel`（darwin-x64） | macos-15 | 22.23.2 | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る | 通る |
| `windows-latest`（win32-x64） | windows-2025-vs2026 | 22.23.4 | **止まる**（F-13） | 通る | 通る（`C:/...` 含む） | 通る | 通る | 通る | 飛ばす | 通る | 通る |
| `windows-11-arm`（win32-arm64） | windows-11-vs2026-arm | 22.23.4 | **止まる**（F-13） | 通る | 通る（`C:/...` 含む） | 通る | 通る | 通る | 飛ばす | 通る | 通る |

- `tools/list` のツール数は、6 本とも reader 18・writer 20・verify 7・spec 8 で、OS と CPU による違いはありませんでした。
- Windows の 2 本は、`setup.mjs` が `spawnSync npm.cmd EINVAL`（`errno: -4071`）で止まりました。代わりの setup（`npm install --no-save` に `setup.mjs --print` の版を渡す）で同じ版を入れ、テストは通りました。
- 直す前の形では、setup の手順は `continue-on-error` のため止まっても success と表示されていました。止まったかどうかは、代わりの手順が実行されたか（Linux と macOS では skipped）で分かります。Windows の Annotations に出ていた `Process completed with exit code 1.` は、この手順のものです。
- 1 回目の run では、`macos-latest` は実行マシンが割り当てられないまま終わりました（再実行の attempt 2 も、00:45:31 JST に割り当てられないまま cancelled）。Annotations は、エラーが「The job was not acquired by Runner of type hosted even after multiple attempts」と「Internal server error」（Correlation ID: 94bb2aaa-1da9-457c-b8d2-6a5522144785）の 2 件、通知が「Due to capacity constraints, jobs targeting macOS arm64 runners may experience longer queue times.」の 3 件でした。GitHub 側の macOS arm64 の空きが足りなかったためで、パッケージの結果ではありません。darwin-arm64 は、手元の Mac で回した E1 で確かめています（ただし E1 は手元のビルドで、公開版ではありません）。
- 2 回目の run（41667260819、commit `b583f20`、2026-11-04 00:45 JST に起動）では、6 本すべてが成功しました。`macos-latest` は 00:51:03 JST に実行マシンが割り当てられ、setup（そのまま）が通り（代わりの setup は skipped）、test の手順も success でした。ほかの 5 本は 1 回目と同じく、Windows の 2 本だけで代わりの setup が実行されました。`macos-latest` も 13 件すべて通り、`tools/list` のツール数もほかの 5 本と同じでした。表の ※ の行は 2 回目の run の結果です。2 回目の run のほかの 5 本も、件数は 1 回目と同じでした（Linux・Intel の macOS は 13 件通る、Windows は 12 件通って S4 を飛ばす）。
- パッケージ側の問題は、6 本のどれにも見つかりませんでした。見つかったのは試用の装置の問題（F-13）だけです。

## F-13 を直した後

`setup.mjs` を直し、2 段の setup をワークフローから外しました（FINDINGS の F-13）。クラウドのコンテナ（Linux x64・Node.js 22.23.4）で、`npm run setup` が `npm_execpath` の分岐を通ること、`node setup.mjs` を直接起動しても入ること、その後テストが 13 件通ることを確かめました。Windows で止まらないことは、push の後に行列をもう一度回して確かめます。

| ランナー | setup | テスト |
| --- | --- | --- |
| `windows-latest` | | |
| `windows-11-arm` | | |
| ほかの 4 本 | | |
