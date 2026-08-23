# pdf-reader-mcp Issue #21〜#26 消化レポート（2026-08-23）

6 件すべて実装・文書化まで完了。受け渡しは git bundle（下記手順）。

## 対応内容

| Issue | 種別 | ブランチ / リポジトリ | 要点 |
|---|---|---|---|
| #21 | feat | `issue/21-text-extractability-tri-state` | テキスト抽出可能性を 4 状態（extracted / no_text_layer / not_extractable / not_observed）でページごとに返す。read_text / read_url / search_text / extract_structured_text / summarize の全経路。フィクスチャ 3 件追加（no-text-layer / tounicode-cid / broken-cid-only）+ cid-font.pdf を混在検体化。判定は pdfjs ではなくファイル（pdf-lib）から — pdfjs は全フォントに toUnicode を合成するため。新規依存ゼロ |
| #22 | feat | `issue/22-read-images-encoding` | read_images が生ピクセルではなく PNG/JPEG ファイルを MCP image content block で返す。エンコーダは自前実装（PNG = zlib、JPEG = ISO/IEC 10918-1 baseline + Annex K 表）で依存追加なし。往復検証済み（PNG 画素差 0）。max_width / max_height / format / quality 追加。応答は 4MB 予算で、超過は omitted に理由付きで列挙 |
| #23 | feat | `issue/23-render-page` | render_page 追加（ツール数 18 → 19）。エンジンは @hyzyla/pdfium（PDFium の WASM 版・optionalDependencies）。**@napi-rs/canvas は実測で不採用**: 画像を描くページで segfault（サーバごと停止）、フォントデータ未設定で白紙を成功として返す。pages は必須引数。e2e はヘッダではなく描画後のピクセル（インク）で表明 |
| #24 | feat | `issue/24-next-step-hints` | summarize に next 欄。暗号化 → 復号が先（他の助言は出さない）/ 読めないページ → render_page（ページ番号付き）/ tagged → extract_structured_text・extract_tables / 50 ページ超 → search_text が先。各行が前提の観測名を名乗る。read_text / read_images の description に pages 省略の意味とコストを明記 |
| #25 | docs | `issue/25-read-url-scope` | 案 C で決着。read_url はテキストのみ・バイト列は破棄・全 19 ツール read-only の不変条件を維持。description / instructions / README（英日）に「先にダウンロード → file_path で渡す」を明記。コード変更なし |
| #26 | feat | 新リポジトリ `pdf-read-skill` + `pdf-specialist-plugin` の `feat/pdf-read-route` | pdf-read Skill（Phase 0 測る → 1 分岐 → 2 構造経路 → 3 絞り込み経路 → 4 画像経路 → 5 Read Report）。pdf-trust / pdf-publish と同じ構成（SKILL.md / README 英日 / evals/trigger-eval.json / LICENSE）。pdf-specialist.md に第 4 経路として追加 |

ブランチは積み上げ（21 ← 22 ← 23 ← 24 ← 25）。#24 の next が #23 の render_page を
指すなど後の Issue が前の実装に依存するため。25 を main に merge すれば全部入る。

## 検証（issue/25 時点 = 全部入り）

- vitest: 438 passed / 1 skipped（+30 新規）
- e2e: 256 passed / 1 skipped（新スイート 12=抽出可能性 / 13=render_page / 14=next）
- typecheck / biome: クリーン
- ビルド: 成功

## 取り込み手順（bundle から）

```bash
cd ~/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-reader-mcp
git fetch /path/to/pdf-reader-mcp-issues-21-25.bundle \
  'refs/heads/*:refs/heads/*'
git checkout issue/25-read-url-scope   # ← 全 Issue 入り
npm ci && npm run test:fixtures && npm test && npm run test:e2e

# レビュー後
git checkout main && git merge issue/25-read-url-scope
# バージョンは 0.12.0 を想定（機能追加 + ツール数 19）

# pdf-read-skill（新リポジトリ）
git clone /path/to/pdf-read-skill.bundle pdf-read-skill

# pdf-specialist-plugin
cd pdf-agent-stack/agent/pdf-specialist-plugin
git fetch /path/to/pdf-specialist-plugin-pdf-read-route.bundle \
  'refs/heads/feat/pdf-read-route:refs/heads/feat/pdf-read-route'
```

## 判断が要った点（実施済みの確認事項）

1. **#23 の canvas**: 承認は @napi-rs/canvas だったが実測で segfault（上表）。
   代替の @hyzyla/pdfium 採用を確認のうえ変更。PDFium は BSD-3-Clause
2. **フィクスチャ生成の pdf-lib の罠**: PDFOperator.of に数値引数を渡すと
   sizeInBytes() が NaN になり、コンテンツストリーム全体が 0 バイトで
   シリアライズされる（黙って）。数値は文字列で渡す。create-e2e-fixtures.ts に
   コメントとして記録済み
3. **baseline.json**: 実行環境の性能値なのでコミットから除外（変更なし）

## 残作業（shuji さん側）

- [ ] 各ブランチのレビューと main への merge
- [ ] pdf-reader-mcp v0.12.0 のリリース（CHANGELOG は Unreleased 節に記載済み）
- [ ] pdf-read-skill リポジトリの GitHub 作成と push
- [ ] pdf-specialist-plugin の merge（pdf-read-skill 公開後）
- [ ] Issue #21〜#26 のクローズ（このレポートの該当行を貼れば経緯が残ります）
