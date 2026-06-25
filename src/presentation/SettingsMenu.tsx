import { Check, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type EditorMode,
  editorModeOptions,
  type ThemeMode,
  themeOptions,
} from "../domain/settings";

type SettingsMenuProps = {
  editorMode: EditorMode;
  themeMode: ThemeMode;
  onSelectEditorMode: (mode: EditorMode) => void;
  onSelectTheme: (theme: ThemeMode) => void;
};

export function SettingsMenu({
  editorMode,
  themeMode,
  onSelectEditorMode,
  onSelectTheme,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="themePicker" ref={menuRef}>
      <button
        className="iconButton themeButton"
        type="button"
        onClick={() => setOpen((current) => !current)}
        title="設定"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Settings size={17} />
      </button>
      {open ? (
        <div className="themeMenu" role="menu" aria-label="設定">
          <div className="themeMenuSectionLabel">Theme</div>
          {themeOptions.map((theme) => (
            <button
              className={themeMode === theme.value ? "themeMenuItem is-active" : "themeMenuItem"}
              key={theme.value}
              type="button"
              role="menuitemradio"
              aria-checked={themeMode === theme.value}
              onClick={() => {
                onSelectTheme(theme.value);
                setOpen(false);
              }}
            >
              <span className="themeSwatch" style={{ background: theme.swatch }} />
              <span>{theme.label}</span>
              {themeMode === theme.value ? <Check size={15} /> : null}
            </button>
          ))}
          <div className="themeMenuSeparator" />
          <div className="themeMenuSectionLabel">Editor</div>
          {editorModeOptions.map((mode) => (
            <button
              className={editorMode === mode.value ? "themeMenuItem is-active" : "themeMenuItem"}
              key={mode.value}
              type="button"
              role="menuitemradio"
              aria-checked={editorMode === mode.value}
              onClick={() => {
                onSelectEditorMode(mode.value);
                setOpen(false);
              }}
            >
              <span className="modeBadge">{mode.badge}</span>
              <span>{mode.label}</span>
              {editorMode === mode.value ? <Check size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
