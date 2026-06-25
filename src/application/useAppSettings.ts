import { useCallback, useEffect, useState } from "react";
import {
  type EditorMode,
  isEditorMode,
  type ThemeMode,
  isThemeMode,
  SETTINGS,
} from "../domain/settings";
import { getSetting, setSetting } from "../infrastructure/settingsRepository";

export function useAppSettings() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [editorMode, setEditorMode] = useState<EditorMode>("standard");

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((current) => {
      const next = !current;
      void setSetting(SETTINGS.sidebarVisible, next);
      return next;
    });
  }, []);

  const selectTheme = useCallback((next: ThemeMode) => {
    setThemeMode(next);
    void setSetting(SETTINGS.themeMode, next);
  }, []);

  const selectEditorMode = useCallback((next: EditorMode) => {
    setEditorMode(next);
    void setSetting(SETTINGS.editorMode, next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const [savedSidebarVisible, savedThemeMode, savedEditorMode] = await Promise.all([
          getSetting<boolean>(SETTINGS.sidebarVisible),
          getSetting<string>(SETTINGS.themeMode),
          getSetting<string>(SETTINGS.editorMode),
        ]);

        if (cancelled) {
          return;
        }

        if (typeof savedSidebarVisible === "boolean") {
          setSidebarVisible(savedSidebarVisible);
        }
        if (isThemeMode(savedThemeMode)) {
          setThemeMode(savedThemeMode);
        }
        if (isEditorMode(savedEditorMode)) {
          setEditorMode(savedEditorMode);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    editorMode,
    selectEditorMode,
    selectTheme,
    sidebarVisible,
    themeMode,
    toggleSidebar,
  };
}
