import { invoke } from "@tauri-apps/api/core";

export async function switchToAlphanumericInput(): Promise<void> {
  await invoke("switch_to_alphanumeric_input");
}
