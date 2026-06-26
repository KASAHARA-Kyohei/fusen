import { useAppSettings } from "./application/useAppSettings";
import { useGlobalShortcuts } from "./application/useGlobalShortcuts";
import { useNotesController } from "./application/useNotesController";
import { MarkdownEditor } from "./editor/MarkdownEditor";
import { Sidebar } from "./presentation/Sidebar";
import { StatusBar } from "./presentation/StatusBar";
import { Topbar } from "./presentation/Topbar";

function App() {
  const settings = useAppSettings();
  const notes = useNotesController();

  useGlobalShortcuts({
    onOpen: () => void notes.chooseFileToOpen(),
    onSave: () => void notes.saveCurrentFile(),
    onToggleSidebar: settings.toggleSidebar,
  });

  return (
    <main
      className={settings.sidebarVisible ? "appShell" : "appShell is-compact"}
      data-theme={settings.themeMode}
    >
      <Sidebar
        activeFile={notes.activeFile}
        recentFiles={notes.recentFiles}
        sidebarVisible={settings.sidebarVisible}
        onCreateNewNote={() => void notes.createNewNote()}
        onOpenFile={() => void notes.chooseFileToOpen()}
        onSelectFile={(file) => void notes.openRecentFile(file)}
        onToggleSidebar={settings.toggleSidebar}
      />

      <section className="workspace">
        <Topbar
          activePath={notes.activeFile?.path ?? null}
          activeTitle={notes.activeTitle}
          editorMode={settings.editorMode}
          sidebarVisible={settings.sidebarVisible}
          themeMode={settings.themeMode}
          onCreateNewNote={() => void notes.createNewNote()}
          onOpenFile={() => void notes.chooseFileToOpen()}
          onSave={() => void notes.saveCurrentFile()}
          onSelectEditorMode={settings.selectEditorMode}
          onSelectTheme={settings.selectTheme}
          onToggleSidebar={settings.toggleSidebar}
        />

        <MarkdownEditor
          value={notes.content}
          editorMode={settings.editorMode}
          onChange={notes.handleContentChange}
          onSave={notes.saveCurrentFile}
          onToggleSidebar={settings.toggleSidebar}
        />

        <StatusBar
          message={notes.message}
          saveError={notes.saveError}
          saveStatus={notes.saveStatus}
          saveStatusLabel={notes.saveStatusLabel}
        />
      </section>
    </main>
  );
}

export default App;
