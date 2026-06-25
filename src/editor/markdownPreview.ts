import { markdown } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension, Text } from "@codemirror/state";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

class CheckboxWidget extends WidgetType {
  constructor(private readonly checked: boolean) {
    super();
  }

  eq(other: CheckboxWidget): boolean {
    return other.checked === this.checked;
  }

  toDOM(): HTMLElement {
    const element = document.createElement("span");
    element.className = this.checked ? "cm-md-checkbox is-checked" : "cm-md-checkbox";
    element.setAttribute("role", "checkbox");
    element.setAttribute("aria-checked", String(this.checked));
    return element;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

class BulletWidget extends WidgetType {
  toDOM(): HTMLElement {
    const element = document.createElement("span");
    element.className = "cm-md-bullet";
    element.textContent = "・";
    element.setAttribute("aria-hidden", "true");
    return element;
  }
}

export function markdownPreviewExtensions(): Extension[] {
  return [
    markdown(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    markdownPreviewPlugin,
    EditorView.lineWrapping,
  ];
}

const markdownPreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildMarkdownDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildMarkdownDecorations(update.view);
      }
    }
  },
  {
    decorations: (value) => value.decorations,
    eventHandlers: {
      click(event, view) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return false;
        }

        const checkbox = target.closest(".cm-md-checkbox");
        if (!(checkbox instanceof HTMLElement)) {
          return false;
        }

        const pos = view.posAtDOM(checkbox);
        const line = view.state.doc.lineAt(pos);
        const match = line.text.match(/^(\s*)([-・]\s*)\[( |x|X)\]\s/);
        if (!match) {
          return false;
        }

        const markerPosition = line.from + match[1].length + match[2].length + 1;
        const nextMarker = match[3].toLowerCase() === "x" ? " " : "x";
        view.dispatch({
          changes: { from: markerPosition, to: markerPosition + 1, insert: nextMarker },
          scrollIntoView: true,
        });
        event.preventDefault();
        return true;
      },
    },
  },
);

function buildMarkdownDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const activeLines = activeLineNumbers(view);
  let inCodeBlock = false;

  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    const text = line.text;
    const isActive = activeLines.has(lineNumber);
    const trimmedStart = text.trimStart();
    const isFence = trimmedStart.startsWith("```");
    const wasInCodeBlock = inCodeBlock;
    const isCodeLine = inCodeBlock || isFence;

    addLineClass(builder, line.from, classForLine(text, isCodeLine, isFence, wasInCodeBlock));

    if (isFence) {
      if (!isActive) {
        const fenceStart = line.from + text.indexOf("```");
        builder.add(
          fenceStart,
          line.to,
          Decoration.mark({ class: "cm-md-code-fence-muted" }),
        );
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (isCodeLine) {
      continue;
    }

    decorateHeading(builder, line, isActive);
    decorateListBullet(builder, line);
    decorateCheckbox(builder, line);
  }

  return builder.finish();
}

function classForLine(
  text: string,
  isCodeLine: boolean,
  isFence: boolean,
  wasInCodeBlock: boolean,
): string {
  const classes = [];
  const heading = text.match(/^(#{1,6})\s+/);

  if (heading) {
    classes.push("cm-md-heading-line", `cm-md-heading-${heading[1].length}`);
  }
  if (/^\s*(?:-\s+|・\s*)/.test(text)) {
    classes.push("cm-md-list-line");
  }
  if (isCodeLine) {
    classes.push("cm-md-code-line");
  }
  if (isFence && !wasInCodeBlock) {
    classes.push("cm-md-code-start");
  }
  if (isFence && wasInCodeBlock) {
    classes.push("cm-md-code-end");
  }
  if (isCodeLine && !isFence) {
    classes.push("cm-md-code-body");
  }

  return classes.join(" ");
}

function addLineClass(
  builder: RangeSetBuilder<Decoration>,
  lineStart: number,
  className: string,
): void {
  if (className.length > 0) {
    builder.add(lineStart, lineStart, Decoration.line({ class: className }));
  }
}

function decorateHeading(
  builder: RangeSetBuilder<Decoration>,
  line: ReturnType<Text["line"]>,
  isActive: boolean,
): void {
  if (isActive) {
    return;
  }

  const match = line.text.match(/^(#{1,6})(\s+)/);
  if (!match) {
    return;
  }

  builder.add(line.from, line.from + match[1].length + match[2].length, Decoration.replace({}));
}

function decorateListBullet(
  builder: RangeSetBuilder<Decoration>,
  line: ReturnType<Text["line"]>,
): void {
  const checkboxMatch = line.text.match(/^(\s*)((?:-\s+)|(?:・\s*))\[( |x|X)\]\s/);
  if (checkboxMatch) {
    const markerStart = line.from + checkboxMatch[1].length;
    const markerEnd = markerStart + checkboxMatch[2].length;
    builder.add(markerStart, markerEnd, Decoration.replace({}));
    return;
  }

  const match = line.text.match(/^(\s*)-\s+/);
  if (!match) {
    return;
  }

  const bulletStart = line.from + match[1].length;
  const bulletEnd = bulletStart + 1;
  builder.add(
    bulletStart,
    bulletEnd,
    Decoration.replace({ widget: new BulletWidget() }),
  );
}

function decorateCheckbox(
  builder: RangeSetBuilder<Decoration>,
  line: ReturnType<Text["line"]>,
): void {
  const match = line.text.match(/^(\s*)([-・]\s*)\[( |x|X)\]\s/);
  if (!match) {
    return;
  }

  const checkboxStart = line.from + match[1].length + match[2].length;
  const checkboxEnd = checkboxStart + 3;
  builder.add(
    checkboxStart,
    checkboxEnd,
    Decoration.replace({ widget: new CheckboxWidget(match[3].toLowerCase() === "x") }),
  );
}

function activeLineNumbers(view: EditorView): Set<number> {
  const numbers = new Set<number>();

  for (const range of view.state.selection.ranges) {
    const fromLine = view.state.doc.lineAt(range.from);
    const toLine = view.state.doc.lineAt(range.to);
    for (let lineNumber = fromLine.number; lineNumber <= toLine.number; lineNumber += 1) {
      numbers.add(lineNumber);
    }
  }

  return numbers;
}
