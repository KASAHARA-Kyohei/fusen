export const SETTINGS = {
  editorMode: "editorMode",
  lastFilePath: "lastFilePath",
  recentFiles: "recentFiles",
  sidebarVisible: "sidebarVisible",
  themeMode: "themeMode",
} as const;

export type SaveStatus = "idle" | "editing" | "saving" | "saved" | "error";
export type ThemeMode = "light" | "dark" | "tokyo-night" | "nord" | "sepia";
export type EditorMode = "standard" | "vim";

export const themeOptions: Array<{
  label: string;
  value: ThemeMode;
  swatch: string;
}> = [
  { label: "Light", value: "light", swatch: "#fffdf2" },
  { label: "Dark", value: "dark", swatch: "#181b18" },
  { label: "Tokyo Night", value: "tokyo-night", swatch: "#1a1b36" },
  { label: "Nord", value: "nord", swatch: "#2e3440" },
  { label: "Sepia", value: "sepia", swatch: "#f2e4c8" },
];

export const editorModeOptions: Array<{
  label: string;
  value: EditorMode;
  badge: string;
}> = [
  { label: "Standard", value: "standard", badge: "Std" },
  { label: "Vim", value: "vim", badge: "Vim" },
];

export function isThemeMode(value: string | null): value is ThemeMode {
  return themeOptions.some((theme) => theme.value === value);
}

export function isEditorMode(value: string | null): value is EditorMode {
  return editorModeOptions.some((mode) => mode.value === value);
}
