import { open, save as saveDialog } from "@tauri-apps/plugin-dialog";

export async function chooseMarkdownFileToOpen(): Promise<string | null> {
  const selected = await open({
    directory: false,
    multiple: false,
    title: "Markdownファイルを開く",
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });

  return typeof selected === "string" ? selected : null;
}

export async function chooseMarkdownSavePath(): Promise<string | null> {
  const selected = await saveDialog({
    title: "Markdownファイルを保存",
    defaultPath: "Untitled.md",
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });

  if (typeof selected !== "string") {
    return null;
  }

  return selected.toLowerCase().endsWith(".md") ? selected : `${selected}.md`;
}
