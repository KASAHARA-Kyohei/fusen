import { useEffect } from "react";

type GlobalShortcutHandlers = {
  onOpen: () => void;
  onSave: () => void;
  onToggleSidebar: () => void;
};

export function useGlobalShortcuts({
  onOpen,
  onSave,
  onToggleSidebar,
}: GlobalShortcutHandlers): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isPrimaryModifier = event.metaKey || event.ctrlKey;
      if (!isPrimaryModifier || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "s" || event.code === "KeyS") {
        event.preventDefault();
        event.stopPropagation();
        onSave();
      }
      if (key === "o" || event.code === "KeyO") {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }
      if (key === "b" || event.code === "KeyB") {
        event.preventDefault();
        event.stopPropagation();
        onToggleSidebar();
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onOpen, onSave, onToggleSidebar]);
}
