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

## Requirements

- [Raycast](https://raycast.com/)
- [Ghostty](https://ghostty.org/) terminal
- [Claude Code](https://claude.ai/code) or [Codex](https://openai.com/codex) CLI
