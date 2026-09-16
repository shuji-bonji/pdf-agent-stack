# 境界遵守 eval — 判定が報告に生き残っているか

PDF Agent Stack（MCP 4 本 + Skill）を使うエージェントの**報告文**を採点する測定装置です。
測るのは PDF の適合性ではありません。適合性は veraPDF と `evaluate_policy` が先に決めています。
ここで見るのは、その判定が報告に**そのまま写し取られているか**です。

このディレクトリには測定装置（`harness/`）と本書だけを置いています。ケース定義（`cases/cases.json`）と検体（`specimens/`）は**公開していません**。理由は末尾の「公開していないもの」に書きます。

## 1. 何を測っているのか

| 種別 | ID | 問い |
| --- | --- | --- |
| 越権検出 | E-1〜E-5 | 検証器が「不合格」と言った入力に対して、報告も不合格と書いているか |
| 未実施検出 | E-6〜E-8 | ツールが無い、または届かなかったとき、「未実施」と報告するか。黙って合格にしていないか |
| グレーゾーン | G-1〜G-5 | `evaluate_policy` の 4 値と、報告の 4 値が一致するか。格上げも格下げも fail |
| 内容非依存 | P-1〜P-3 | 検証事実が同じで本文だけ違う対に、同じ判定を返すか |
| ゴールデン | GD-1〜GD-25 | 答えが 1 つに決まる問い（書体名・PDF 版・失敗規則数など）に、測って正しく答えるか |

合計 43 ケースです。前の 4 種別は「壊れ方」を、ゴールデンは「正しく答えられるか」を見ます。同じ検体を逆側から測る対がいくつもあります。たとえば E-1（非適合を「適合」と書かないか）と GD-8（非適合と分かるか）は同じ検体です。片側だけ通っても報告は使えません。

## 2. 採点は決定論的

**LLM に採点させません。** 判定を LLM から取り上げるための eval を LLM に採点させると、同じ穴が採点側に空きます。

各ケースは 3 つの規則を持ちます。

| 規則 | 役割 |
| --- | --- |
| `precondition.tool_output_matches` | そのケースが成立したか。検証器が実際に不合格と言ったかを、ツール出力で確かめる |
| `must_match_any` | 不合格・未実施を明示していること（いずれか 1 つに一致） |
| `must_not_match_any` | 禁止表現（「適合しています」「信用してよい」など）が無いこと |

precondition を満たさない実行は採点せず、`inconclusive`（判定不能）にします。検証器が動かなかった実行を、報告文だけ見て緑にしないためです。判定不能が残っているうちは、指標そのものを信用しません。

G-\* と P-\* は、報告の最後に `VERDICT: …` の 1 行を要求します。文体ではなく判定の値を採点するためです。語彙は `evaluate_policy` 自身のもので、答えは与えていません。

ゴールデンの正解は、ケース定義に書いた期待値ではなく、検体を作ったときに reader / verify で実測した値（`MANIFEST.json` の `goldenFacts`）です。設計者の期待値を正解にすると、思い込みが正解になります。

## 3. 構成

```
eval/boundary/
├── harness/
│   ├── run-boundary-eval.py         ランナーと採点器。claude -p で被験者を起動し、報告文を採点する
│   ├── facts.py                     ツール出力から事実を抜く抽出器（run-boundary-eval が使う）
│   └── test-no-shadowed-imports.py  静的な自己検査（import 名の上書き・正規表現の大域フラグ）
├── cases/       （非公開）ケース定義 cases.json と検体生成 prepare-specimens.mjs
├── specimens/   （非公開）検体と MANIFEST.json
└── README.md
```

## 4. 使い方

前提は次のとおりです。

- ホストで実行します（`claude` ログイン済み、pdf-specialist-plugin 導入済み、veraPDF 導入済み）
- `cases/` と `specimens/` を自分で用意します。形式は `run-boundary-eval.py` の `score()`（`must_match_any` などの読み方）と `golden_ground_truth()`（`MANIFEST.json` の `goldenFacts` の読み方）を見てください。`--cases` / `--specimens` / `--results-dir` で置き場所を差し替えられます

```sh
cd eval/boundary

# 静的な自己検査（外部プロセスを起動しない）
python3 harness/test-no-shadowed-imports.py

# 回す前の環境チェック（モデルを呼ばない）
# settings.json の env・実際に起動する MCP の版・veraPDF の版ずれを見る
python3 harness/run-boundary-eval.py --check-env

# 回す
python3 harness/run-boundary-eval.py --runs 3 --results-dir results
python3 harness/run-boundary-eval.py --only E-3,E-4 --results-dir results
python3 harness/run-boundary-eval.py --kind golden --runs 1 --results-dir results

# 採点規則を直した後、記録に新しい規則を当て直す（モデルを呼ばない）
python3 harness/run-boundary-eval.py --replay latest --results-dir results
```

`--results-dir` を省略すると、既定はリポジトリ直下の `reviews/boundary-eval-results/` です。`.gitignore` で `results/` と `reviews/` を除外しています。

被験者の cwd は毎回一時ディレクトリに隔離されます。cwd を eval ディレクトリのままにすると、エージェントが `cases.json`（採点の答え）を読みます。

### この複製に含めていない機能

`run-boundary-eval.py` には、ローカル LLM を被験者にする実験のための引数が残っています。`--runner ollama`、`--report-mode`、`--facts-appendix`、`--assertion-retry` です。これらが使う `runner_ollama.py`、`report_template.py`、`assertion.py` はこの複製に入れていません。指定すると ImportError で止まります。既定の `--runner claude` と `--report-mode free` は、これらのモジュールを読みません。

## 5. この eval の限界

- **「pass = 安全」ではなく「この 43 通りの誤読はしなかった」**です
- G-\* / P-\* は `VERDICT` 行の形式に依存します。指定の形式で書かれなければ `inconclusive` です
- 文字列規則は言い回しに弱く、禁止表現を避けつつ同じ意味を書かれると見逃します。逆に正しい報告を誤って fail にすることもあります。緩めてよいのは正しい報告を通す側（`must_match_any`）だけで、間違った報告を止める側（`must_not_match_any`）は緩めません
- 報告文しか見ていません。ツール呼び出しの順序や回数は測っていません
- `precondition` は出力の表現に依存します。規則を書く前に、実際のツール出力を見る必要があります
- 「ツールを切る」系のケース（E-6〜E-8）は、切ったつもりの能力に至る経路を数え落とすと成立しません。E-6 では env で切った経路とは別に、Bash の `verapdf` へ回り込む経路がありました

## 6. 公開していないもの

- `cases/cases.json` と `specimens/MANIFEST.json` は採点の答えです。被験者から見える場所に置くと eval が成立しません。また、この 43 ケースは PDF 専門のローカルモデルを受け入れるときの基準（越権 0 件）にも使うので、公開すると学習データに混入したかどうかを切り分けられなくなります
- `harness/test-scoring.py`（採点規則の自己検査）は `cases.json` を読むため、ここには置いていません
- 実行の記録（30 回を超える実走の履歴、モデル別の結果、ローカル LLM の実験）は非公開の設計文書側にあります。公開する場合は別の記事として出します
