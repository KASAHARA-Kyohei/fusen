import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type NoteFile } from "../domain/note";
import {
  normalizeRecentFiles,
  noteFileFromPath,
  type RecentFile,
  rememberRecentFile,
} from "../domain/recentFiles";
import { type SaveStatus, SETTINGS } from "../domain/settings";
import {
  chooseMarkdownFileToOpen,
  chooseMarkdownSavePath,
} from "../infrastructure/fileDialogService";
import { readNote, writeNote } from "../infrastructure/noteRepository";
import { getSetting, setSetting } from "../infrastructure/settingsRepository";

const AUTOSAVE_DELAY_MS = 800;

export function useNotesController() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [activeFile, setActiveFile] = useState<NoteFile | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [message, setMessage] = useState("新規メモ");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const contentRef = useRef(content);
  const savedContentRef = useRef(savedContent);
  const activeFileRef = useRef(activeFile);
  const saveInFlightRef = useRef(false);
  const saveAgainRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);

  const dirty = content !== savedContent;

  const activeTitle = useMemo(() => {
    if (!activeFile) {
      return dirty ? "無題 *" : "無題";
    }
    return dirty ? `${activeFile.name} *` : activeFile.name;
  }, [activeFile, dirty]);

  const saveStatusLabel = useMemo(() => {
    if (saveStatus === "saving") {
      return "保存中";
    }
    if (saveStatus === "error") {
      return "保存失敗";
    }
    if (dirty || saveStatus === "editing") {
      return "編集中";
    }
    if (!activeFile) {
      return "未保存";
    }
    return "保存済み";
  }, [activeFile, dirty, saveStatus]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    savedContentRef.current = savedContent;
  }, [savedContent]);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  const persistRecentFiles = useCallback(async (files: RecentFile[]) => {
    await setSetting(SETTINGS.recentFiles, files as unknown as Record<string, unknown>[]);
  }, []);

  const rememberFile = useCallback(
    async (file: RecentFile) => {
      setRecentFiles((current) => {
        const next = rememberRecentFile(current, file);
        void persistRecentFiles(next);
        return next;
      });
      await setSetting(SETTINGS.lastFilePath, file.path);
    },
    [persistRecentFiles],
  );

  const saveLatestContent = useCallback(async () => {
    let file = activeFileRef.current;

    if (!file) {
      const path = await chooseMarkdownSavePath();
      if (!path) {
        setSaveStatus("editing");
        setMessage("保存先が未設定です");
        return;
      }

      file = noteFileFromPath(path);
      setActiveFile(file);
      activeFileRef.current = file;
      await rememberFile(file);
    }

    if (saveInFlightRef.current) {
      saveAgainRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    saveAgainRef.current = false;
    setSaveStatus("saving");
    setSaveError(null);

    const contentToSave = contentRef.current;
    const filePath = file.path;
    let savedSuccessfully = false;

    try {
      await writeNote(filePath, contentToSave);
      savedSuccessfully = true;

      if (activeFileRef.current?.path === filePath) {
        savedContentRef.current = contentToSave;
        setSavedContent(contentToSave);
        setSaveStatus(contentRef.current === contentToSave ? "saved" : "editing");
        setMessage(`${file.name} を保存しました`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSaveError(errorMessage);
      setSaveStatus("error");
      setMessage("保存に失敗しました");
    } finally {
      saveInFlightRef.current = false;
      if (
        savedSuccessfully &&
        (saveAgainRef.current || contentRef.current !== savedContentRef.current)
      ) {
        void saveLatestContent();
      }
    }
  }, [rememberFile]);

  const loadFileFromDisk = useCallback(
    async (file: RecentFile) => {
      setMessage(`${file.name} を読み込み中`);
      const text = await readNote(file.path);
      setActiveFile(file);
      activeFileRef.current = file;
      setContent(text);
      contentRef.current = text;
      setSavedContent(text);
      savedContentRef.current = text;
      setSaveStatus("saved");
      setSaveError(null);
      await rememberFile(file);
      setMessage(`${file.name} を開きました`);
    },
    [rememberFile],
  );

  const openRecentFile = useCallback(
    async (file: RecentFile) => {
      if (dirty && activeFileRef.current?.path !== file.path) {
        const shouldDiscard = window.confirm("未保存の変更を破棄して別のファイルを開きますか？");
        if (!shouldDiscard) {
          return;
        }
      }

      try {
        await loadFileFromDisk(file);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setSaveError(errorMessage);
        setSaveStatus("error");
        setMessage(`${file.name} を開けませんでした`);
      }
    },
    [dirty, loadFileFromDisk],
  );

  const chooseFileToOpen = useCallback(async () => {
    if (dirty) {
      const shouldDiscard = window.confirm("未保存の変更を破棄して別のファイルを開きますか？");
      if (!shouldDiscard) {
        return;
      }
    }

    const selected = await chooseMarkdownFileToOpen();
    if (!selected) {
      return;
    }

    await openRecentFile(noteFileFromPath(selected));
  }, [dirty, openRecentFile]);

  const saveCurrentFile = useCallback(async () => {
    clearAutosaveTimer();
    await saveLatestContent();
  }, [clearAutosaveTimer, saveLatestContent]);

  const handleContentChange = useCallback((nextContent: string) => {
    contentRef.current = nextContent;
    setContent(nextContent);
    setSaveError(null);
    setSaveStatus("editing");
    setMessage("編集中");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const [storedRecentFiles, lastFilePath] = await Promise.all([
          getSetting<RecentFile[]>(SETTINGS.recentFiles),
          getSetting<string>(SETTINGS.lastFilePath),
        ]);

        if (cancelled) {
          return;
        }

        const validRecentFiles = normalizeRecentFiles(storedRecentFiles);
        setRecentFiles(validRecentFiles);

        const lastFile =
          validRecentFiles.find((file) => file.path === lastFilePath) ??
          (lastFilePath ? noteFileFromPath(lastFilePath) : null);

        if (lastFile) {
          await loadFileFromDisk(lastFile);
        } else {
          setMessage("新規メモ");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setSaveStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [loadFileFromDisk]);

  useEffect(() => {
    clearAutosaveTimer();

    if (content === savedContent) {
      return;
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void saveLatestContent();
    }, AUTOSAVE_DELAY_MS);

    return clearAutosaveTimer;
  }, [clearAutosaveTimer, content, saveLatestContent, savedContent]);

  return {
    activeFile,
    activeTitle,
    chooseFileToOpen,
    content,
    handleContentChange,
    message,
    openRecentFile,
    recentFiles,
    saveCurrentFile,
    saveError,
    saveStatus,
    saveStatusLabel,
  };
}
