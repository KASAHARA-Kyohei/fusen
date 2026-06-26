import { FilePlus, FileText, FolderOpen, PanelLeft } from "lucide-react";
import { type NoteFile } from "../domain/note";
import { type RecentFile } from "../domain/recentFiles";

type SidebarProps = {
  activeFile: NoteFile | null;
  recentFiles: RecentFile[];
  sidebarVisible: boolean;
  onOpenFile: () => void;
  onCreateNewNote: () => void;
  onSelectFile: (file: RecentFile) => void;
  onToggleSidebar: () => void;
};

export function Sidebar({
  activeFile,
  recentFiles,
  sidebarVisible,
  onOpenFile,
  onCreateNewNote,
  onSelectFile,
  onToggleSidebar,
}: SidebarProps) {
  return (
    <aside className={sidebarVisible ? "sidebar" : "sidebar is-hidden"} aria-hidden={!sidebarVisible}>
      <div className="sidebarHeader">
        <button className="iconButton" type="button" onClick={onToggleSidebar} title="左ペインを隠す">
          <PanelLeft size={17} />
        </button>
        <div className="sidebarTitle">
          <span>fusen</span>
          <small>{recentFiles.length} recent</small>
        </div>
        <button className="iconButton" type="button" onClick={onCreateNewNote} title="新規メモ">
          <FilePlus size={16} />
        </button>
        <button className="iconButton" type="button" onClick={onOpenFile} title="開く">
          <FolderOpen size={16} />
        </button>
      </div>

      <div className="fileList" aria-label="最近開いたMarkdownファイル">
        {recentFiles.length === 0 ? (
          <div className="fileListEmpty">最近開いたMarkdownファイルはありません</div>
        ) : (
          recentFiles.map((file) => (
            <button
              className={activeFile?.path === file.path ? "fileItem is-active" : "fileItem"}
              key={file.path}
              type="button"
              onClick={() => onSelectFile(file)}
              title={file.path}
            >
              <FileText size={15} />
              <span>{file.name}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
