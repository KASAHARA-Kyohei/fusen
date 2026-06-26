import { FilePlus, FolderOpen, PanelLeft, Save } from "lucide-react";
import { type EditorMode, type ThemeMode } from "../domain/settings";
import { SettingsMenu } from "./SettingsMenu";

type TopbarProps = {
  activePath: string | null;
  activeTitle: string;
  editorMode: EditorMode;
  sidebarVisible: boolean;
  themeMode: ThemeMode;
  onCreateNewNote: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onSelectEditorMode: (mode: EditorMode) => void;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleSidebar: () => void;
};

export function Topbar({
  activePath,
  activeTitle,
  editorMode,
  sidebarVisible,
  themeMode,
  onCreateNewNote,
  onOpenFile,
  onSave,
  onSelectEditorMode,
  onSelectTheme,
  onToggleSidebar,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="titleBlock">
        {!sidebarVisible ? (
          <button
            className="iconButton"
            type="button"
            onClick={onToggleSidebar}
            title="左ペインを表示"
          >
            <PanelLeft size={17} />
          </button>
        ) : null}
        <div>
          <h1>{activeTitle}</h1>
          <p>{activePath ?? "未保存の新規メモ"}</p>
        </div>
      </div>
      <div className="topbarActions">
        <button className="iconButton" type="button" onClick={onCreateNewNote} title="新規メモ">
          <FilePlus size={17} />
        </button>
        <button className="iconButton" type="button" onClick={onOpenFile} title="開く">
          <FolderOpen size={17} />
        </button>
        <SettingsMenu
          editorMode={editorMode}
          themeMode={themeMode}
          onSelectEditorMode={onSelectEditorMode}
          onSelectTheme={onSelectTheme}
        />
        <button className="iconButton saveButton" type="button" onClick={onSave} title="保存">
          <Save size={17} />
        </button>
      </div>
    </header>
  );
}
