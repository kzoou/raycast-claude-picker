# Raycast Claude/Codex Picker

Raycast extension to quickly launch Claude Code or Codex in your project directories.

## Features

- **cc** - Pick a project and launch Claude Code
- **cx** - Pick a project and launch Codex
- Fuzzy search across all your projects
- Opens a new Ghostty tab with the selected project

## Installation

1. Clone this repository
2. `npm install`
3. Open Raycast → `Import Extension` → Select this folder

## Setup

Create `~/.claude_projects` with your project paths (one per line):

```
~/dev/project-a
~/dev/project-b
~/work/another-project
```

Lines starting with `#` are ignored.

## Usage

1. Open Raycast
2. Type `cc` (for Claude) or `cx` (for Codex)
3. Search and select a project
4. Press Enter

## Requirements

- [Raycast](https://raycast.com/)
- [Ghostty](https://ghostty.org/) terminal
- [Claude Code](https://claude.ai/code) or [Codex](https://openai.com/codex) CLI
