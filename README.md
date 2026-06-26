# fusen

fusen is a lightweight Markdown note app built with Tauri, React, TypeScript, and CodeMirror 6.

It is designed to feel closer to a sticky note or Notepad than a full workspace app: open a Markdown file, write quickly, and keep the editing surface compact.

## Features

- CodeMirror 6 editor, not a textarea
- Inline Markdown live preview in the editor
- Markdown file open/save for `.md` files
- Recent files sidebar
- New unsaved note flow with save dialog on first save
- Debounced autosave after editing
- Manual save with `Cmd/Ctrl+S`
- Sidebar toggle with `Cmd/Ctrl+B`
- Open file with `Cmd/Ctrl+O`
- Bullet editing support for `- ` and `・`
- Obsidian-like bullet preview, while saving Markdown-compatible `- `
- Clickable task checkboxes
- Standard and Vim editor modes
- Best-effort IME switch to alphanumeric input when Vim enters Normal mode
- Theme menu with Light, Dark, Tokyo Night, Nord, and Sepia

## Tech Stack

- [Tauri 2](https://tauri.app/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [CodeMirror 6](https://codemirror.net/)
- [`@replit/codemirror-vim`](https://github.com/replit/codemirror-vim)

## Requirements

- Node.js 22 or newer
- npm
- Rust stable
- Tauri system prerequisites for your OS

See the official Tauri prerequisites guide:

https://tauri.app/start/prerequisites/

## Development

Install dependencies:

```sh
npm ci
```

Run the Tauri app in development mode:

```sh
npm run tauri dev
```

Run the frontend only:

```sh
npm run dev
```

## Build

Check the frontend build:

```sh
npm run build
```

Check the Rust side:

```sh
cd src-tauri
cargo check
```

Build a distributable Tauri app:

```sh
npm run tauri build
```

Generated bundles are written under:

```txt
src-tauri/target/release/bundle/
```

## GitHub Actions

This repository includes a manual Tauri build workflow:

```txt
.github/workflows/tauri-build.yml
```

Run it from GitHub Actions with `workflow_dispatch` to build macOS and Windows bundles and upload them as artifacts.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl+S` | Save |
| `Cmd/Ctrl+O` | Open Markdown file |
| `Cmd/Ctrl+B` | Toggle sidebar |
| `Tab` | Indent list item |
| `Shift+Tab` | Outdent list item |
| `Enter` | Continue or exit list item |

## Markdown Editing

fusen keeps the file content Markdown-compatible. For example, when you type:

```md
- Task
```

the editor can display it as a clean bullet preview, but the saved file remains:

```md
- Task
```

Task list items such as `- [ ]` and `- [x]` are shown as clickable checkboxes in the live preview.

## Current Scope

fusen is an MVP focused on the writing experience. It does not currently include file rename/delete UI, full workspace management, search, or full Obsidian compatibility.
