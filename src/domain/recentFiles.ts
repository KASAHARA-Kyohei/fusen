import { fileNameFromPath, isMarkdownPath, type NoteFile } from "./note";

export type RecentFile = NoteFile;

export const MAX_RECENT_FILES = 20;

export function noteFileFromPath(path: string): NoteFile {
  return { name: fileNameFromPath(path), path };
}

export function normalizeRecentFiles(value: RecentFile[] | null): RecentFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const files: RecentFile[] = [];

  for (const item of value) {
    if (
      item &&
      typeof item.name === "string" &&
      typeof item.path === "string" &&
      isMarkdownPath(item.path) &&
      !seen.has(item.path)
    ) {
      seen.add(item.path);
      files.push({ name: item.name, path: item.path });
    }
  }

  return files.slice(0, MAX_RECENT_FILES);
}

export function rememberRecentFile(files: RecentFile[], file: RecentFile): RecentFile[] {
  return [
    file,
    ...files.filter((item) => item.path !== file.path),
  ].slice(0, MAX_RECENT_FILES);
}

export function forgetRecentFile(files: RecentFile[], path: string): RecentFile[] {
  return files.filter((item) => item.path !== path);
}
