# Issue 下書き: README にアーキテクチャ全体図（Mermaid）を追加

**優先度: 2**

> **✅ 実装済み（2026-08-11・未コミット）**
> README「全体像」節に site/guide/architecture の全体図を**そのまま転載**（差分ゼロ = 矛盾しない）し、
> 正典はサイト側と明記してリンク。**下書きとの相違**: README は実態が日本語だったため英語化せず日本語のまま
> （英語基準の規約は各 MCP/Skill リポジトリの話で、hub の README は日本語運用と判断）。

## 現象

- サイトの `guide/architecture` には Mermaid 図が 2 枚あるが、**リポジトリ README.md には図が 0 枚**
- GitHub から入る初見の読者（レビューした他 LLM 含む）が「全体像が見えない」と受け取る
- 実際に外部レビューで「ダイアグラム欠如」と指摘された（サイト側は既にあるので README 起因の誤認）

## 対応

1. `site/docs/guide/architecture.md` の全体図（Agent → Skill 層 → MCP 4 台 → Trust/Publish Report、外部依存 = 仕様コーパス / veraPDF）を README 用に英語化して転用
2. README は英語（公開リポジトリの言語規約どおり）。GitHub は Mermaid をネイティブレンダリングするので画像化は不要
3. 図の直下にサイトの architecture ページへのリンクを置き、二重メンテを避ける（詳細はサイト側が正）

## 受入基準

- README 冒頭〜構成表の間に全体図 1 枚
- サイト側の図と矛盾しない（レイヤー名・依存の向きが一致）
