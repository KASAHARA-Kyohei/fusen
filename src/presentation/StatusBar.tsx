import { type SaveStatus } from "../domain/settings";

type StatusBarProps = {
  message: string;
  saveError: string | null;
  saveStatus: SaveStatus;
  saveStatusLabel: string;
};

export function StatusBar({
  message,
  saveError,
  saveStatus,
  saveStatusLabel,
}: StatusBarProps) {
  return (
    <footer className={`statusbar is-${saveStatus}`}>
      <span title={saveError ?? message}>{saveError ?? message}</span>
      <span className="statusPill">{saveStatusLabel}</span>
    </footer>
  );
}
