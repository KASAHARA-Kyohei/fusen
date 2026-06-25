import { defaultKeymap, historyKeymap } from "@codemirror/commands";
import { Prec } from "@codemirror/state";
import type { EditorState, Extension } from "@codemirror/state";
import { type EditorView, keymap } from "@codemirror/view";

type ShortcutHandlers = {
  onSave: () => void;
  onToggleSidebar: () => void;
};

type KeymapOptions = {
  shouldHandleMarkdownShortcuts: (view: EditorView) => boolean;
};

type ListMatch = {
  indent: string;
  bullet: "- " | "・ ";
  hasCheckbox: boolean;
  body: string;
};

const listLinePattern = /^(\s*)((?:-\s+)|(?:・\s*))(?:\[( |x|X)\]\s*)?(.*)$/;

export function editorKeymap(
  handlers: ShortcutHandlers,
  options: KeymapOptions,
): Extension[] {
  return [
    Prec.highest(
      keymap.of([
        {
          key: "Mod-s",
          run: () => {
            handlers.onSave();
            return true;
          },
        },
        {
          key: "Mod-b",
          run: () => {
            handlers.onToggleSidebar();
            return true;
          },
        },
      ]),
    ),
    keymap.of([
      {
        key: "Tab",
        run: (view) =>
          options.shouldHandleMarkdownShortcuts(view) && indentSelectedLines(view),
      },
      {
        key: "Shift-Tab",
        run: (view) =>
          options.shouldHandleMarkdownShortcuts(view) && outdentSelectedLines(view),
      },
      {
        key: "Enter",
        run: (view) =>
          options.shouldHandleMarkdownShortcuts(view) && continueMarkdownList(view),
      },
      ...historyKeymap,
      ...defaultKeymap,
    ]),
  ];
}

function indentSelectedLines(view: EditorView): boolean {
  const lines = selectedLines(view.state);
  const changes = lines
    .filter((lineNumber) => isMarkdownListLine(view.state.doc.line(lineNumber).text))
    .map((lineNumber) => ({ from: view.state.doc.line(lineNumber).from, insert: "  " }));

  if (changes.length === 0) {
    return false;
  }

  view.dispatch({ changes, scrollIntoView: true });
  return true;
}

function outdentSelectedLines(view: EditorView): boolean {
  const changes = selectedLines(view.state).flatMap((lineNumber) => {
    const line = view.state.doc.line(lineNumber);
    if (line.text.startsWith("  ")) {
      return [{ from: line.from, to: line.from + 2 }];
    }
    if (line.text.startsWith("\t")) {
      return [{ from: line.from, to: line.from + 1 }];
    }
    return [];
  });

  if (changes.length === 0) {
    return false;
  }

  view.dispatch({ changes, scrollIntoView: true });
  return true;
}

function continueMarkdownList(view: EditorView): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) {
    return false;
  }

  const line = view.state.doc.lineAt(selection.head);
  const match = parseMarkdownListLine(line.text);
  if (!match) {
    return false;
  }

  if (match.body.trim().length === 0) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
      scrollIntoView: true,
    });
    return true;
  }

  const checkbox = match.hasCheckbox ? "[ ] " : "";
  const insert = `\n${match.indent}${match.bullet}${checkbox}`;
  view.dispatch({
    changes: { from: selection.head, insert },
    selection: { anchor: selection.head + insert.length },
    scrollIntoView: true,
  });
  return true;
}

function selectedLines(state: EditorState): number[] {
  const lineNumbers = new Set<number>();

  for (const range of state.selection.ranges) {
    const fromLine = state.doc.lineAt(range.from);
    const toLine =
      range.to > range.from && range.to === state.doc.lineAt(range.to).from
        ? state.doc.lineAt(range.to - 1)
        : state.doc.lineAt(range.to);
    for (let lineNumber = fromLine.number; lineNumber <= toLine.number; lineNumber += 1) {
      lineNumbers.add(lineNumber);
    }
  }

  return [...lineNumbers].sort((left, right) => left - right);
}

function isMarkdownListLine(text: string): boolean {
  return parseMarkdownListLine(text) !== null;
}

function parseMarkdownListLine(text: string): ListMatch | null {
  const match = text.match(listLinePattern);
  if (!match) {
    return null;
  }

  return {
    indent: match[1],
    bullet: match[2].trim().startsWith("・") ? "・ " : "- ",
    hasCheckbox: match[3] !== undefined,
    body: match[4] ?? "",
  };
}
