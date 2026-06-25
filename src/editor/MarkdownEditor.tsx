import { history } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
} from "@codemirror/view";
import { getCM, vim } from "@replit/codemirror-vim";
import { useEffect, useRef } from "react";
import { type EditorMode } from "../domain/settings";
import { editorKeymap } from "./markdownKeys";
import { markdownPreviewExtensions } from "./markdownPreview";

type MarkdownEditorProps = {
  value: string;
  editorMode: EditorMode;
  onChange: (value: string) => void;
  onSave: () => void;
  onToggleSidebar: () => void;
};

export function MarkdownEditor({
  value,
  editorMode,
  onChange,
  onSave,
  onToggleSidebar,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartmentRef = useRef(new Compartment());
  const keymapCompartmentRef = useRef(new Compartment());
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onToggleSidebarRef = useRef(onToggleSidebar);

  valueRef.current = value;
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;
  onToggleSidebarRef.current = onToggleSidebar;

  useEffect(() => {
    if (!hostRef.current || viewRef.current) {
      return;
    }

    const extensions: Extension[] = [
      vimCompartmentRef.current.of(vimExtension(editorMode)),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      highlightActiveLine(),
      indentUnit.of("  "),
      ...markdownPreviewExtensions(),
      keymapCompartmentRef.current.of(
        editorKeymap(
          {
            onSave: () => onSaveRef.current(),
            onToggleSidebar: () => onToggleSidebarRef.current(),
          },
          { shouldHandleMarkdownShortcuts: (view) => shouldHandleMarkdownShortcut(view, editorMode) },
        ),
      ),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) {
          return;
        }
        const nextValue = update.state.doc.toString();
        valueRef.current = nextValue;
        onChangeRef.current(nextValue);
      }),
    ];

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: valueRef.current,
        extensions,
      }),
    });

    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    view.dispatch({
      effects: [
        vimCompartmentRef.current.reconfigure(vimExtension(editorMode)),
        keymapCompartmentRef.current.reconfigure(
          editorKeymap(
            {
              onSave: () => onSaveRef.current(),
              onToggleSidebar: () => onToggleSidebarRef.current(),
            },
            { shouldHandleMarkdownShortcuts: (view) => shouldHandleMarkdownShortcut(view, editorMode) },
          ),
        ),
      ],
    });
  }, [editorMode]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === view.state.doc.toString()) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className="editorHost" />;
}

function vimExtension(editorMode: EditorMode): Extension {
  return editorMode === "vim" ? vim({ status: true }) : [];
}

function shouldHandleMarkdownShortcut(view: EditorView, editorMode: EditorMode): boolean {
  if (editorMode === "standard") {
    return true;
  }

  return getCM(view)?.state.vim?.insertMode === true;
}
