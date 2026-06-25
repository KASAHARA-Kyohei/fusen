import { invoke } from "@tauri-apps/api/core";

export async function readNote(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

export async function writeNote(path: string, content: string): Promise<void> {
  await invoke("write_file", { path, content });
}
