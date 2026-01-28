# Raycast Claude/Codex Picker

Raycast extension to quickly launch Claude Code or Codex in your project directories.

## Features

- **cc** - Pick a project and launch Claude Code
- **cx** - Pick a project and launch Codex
- **Auto-detection** - Automatically lists projects where Claude Code has been used
- **Smart filtering** - Deleted projects are automatically hidden
- **Recent first** - Projects sorted by most recently used
- Opens a new Ghostty tab with the selected project

## Installation

1. Clone this repository
2. `npm install`
3. Open Raycast → `Import Extension` → Select this folder

## Usage

1. Open Raycast
2. Type `cc` (for Claude) or `cx` (for Codex)
3. Search and select a project
4. Press Enter

No configuration needed. Projects are automatically detected from `~/.claude/projects/`.

## How it works

Projects are discovered from two sources:

1. **~/.claude/projects/** - Claude Code's session data (recent projects)
2. **~/dev/**/CLAUDE.md** - Scans for CLAUDE.md files (catches older projects)

Projects are deduplicated, filtered to only existing paths, and sorted by most recently used.

## なぜこの設計なのか

### プロジェクト検出が複雑な理由

Claude Code のプロジェクト記録は `~/.claude/projects/` に保存されるが、以下の問題がある：

1. **古い記録は自動削除される** — 長期間使っていないプロジェクトは `~/.claude/projects/` から消える（キャッシュ管理のため）。2025年9月に使ったプロジェクトが12月には消えていた事例を確認。

2. **sessions-index.json がない場合がある** — 一部のプロジェクトは `.jsonl` ファイルのみ存在し、`sessions-index.json` がない。この場合は `.jsonl` 内の `cwd` フィールドからパスを抽出する。

3. **削除済みプロジェクトが残る** — プロジェクトフォルダを削除しても `~/.claude/projects/` の記録は残る。`existsSync()` で実在確認してフィルタリング。

### 2段階検出の理由

```
1. ~/.claude/projects/ をスキャン（最近のプロジェクト、正確な最終使用日時）
2. ~/dev 配下の CLAUDE.md をスキャン（古いプロジェクトの救済）
```

- 1 だけだと古いプロジェクトが漏れる
- 2 だけだと CLAUDE.md を作っていないプロジェクトが漏れる
- 両方やって重複排除することで網羅性を確保

### スキャン深度が3の理由

`~/dev/category/project/` のような構成に対応するため。深すぎるとパフォーマンス劣化、浅すぎると漏れが出る。

### Codex も同じリストを使う理由

Claude Code と Codex は同じプロジェクトで併用されることが多い。別々に管理するメリットより、統一リストの方が使いやすい。

## Requirements

- [Raycast](https://raycast.com/)
- [Ghostty](https://ghostty.org/) terminal
- [Claude Code](https://claude.ai/code) or [Codex](https://openai.com/codex) CLI
