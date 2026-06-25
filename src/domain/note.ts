export type NoteFile = {
  name: string;
  path: string;
};

export function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? "Untitled.md";
}

export function isMarkdownPath(path: string): boolean {
  return path.toLowerCase().endsWith(".md");
}
