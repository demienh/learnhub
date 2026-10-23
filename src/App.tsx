import { useEffect, useMemo, useRef, useState, type FormEvent, type SetStateAction } from "react";
import rawContent from "./content/fragen.json";
import {
  applyContentImport,
  commitStudySpace,
  createDefaultSpace,
  createStudySpaceBackup,
  mergeStudySpace,
  isQuestionChapterUnresolved,
  parseContentPackage,
  parseStudySpace,
  persistStudySpace,
  resolveQuestionChapterId,
  STUDY_SPACE_KEY,
  type ContentImportPreview,
  type Course,
  type StudyQuestion,
  type StudySpace,
} from "./studySpace";
import {
  createProgressExport,
  appendHistory,
  abandonUnfinishedSession,
  completeExamProgress,
  dailyGoalProgress,
  emptyProgress,
  makeExamSelection,
  makeStudySession,
  migrateStoredProgress,
  nextReviewIndex,
  parseProgressImport,
  reviewKey,
  scheduleReview,
  summarizeTopicAttention,
  STORAGE_KEY,
  todayLocalDate,
  weeklyMonthlySummary,
  type LearningMode,
  type Confidence,
  type Progress,
  type Rating,
  type ReviewRecord,
  type StudyHistoryEntry,
  type StudySessionItem,
} from "./progress";
import {
  NAVIGATION,
  groupForView,
  sectionForView,
  type NavigationGroupId,
  type View,
} from "./navigation";

type QuestionKind = "flashcard" | "quiz";
type Question = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  answer?: string;
  options?: string[];
  correctOption?: number | null;
  explanation?: string;
  shortExplanation?: string;
  keyTerms?: string[];
  examples?: string[];
  chapter: string;
  chapterId?: string;
  sectionId?: string;
  chapterNumber?: number;
  section?: string;
  questionType: string;
  sourcePages: number[];
  sourceFileName?: string;
  placeholder: boolean;
  uncertain: boolean;
};

type Chapter = { id?: string; number: number; title: string };
type Content = {
  source: { path: string; available: boolean; note: string };
  questions: Question[];
  chapters: Chapter[];
  transferTask?: { title: string; sourceSlide: number; verification: string; note: string };
};
type ReviewItem = { question: Question; mode: LearningMode; key: string; record?: ReviewRecord };
type QuizFeedback = { question: Question; selectedOption: number; isCorrect: boolean };
const studyAnswerKey = (item: StudySessionItem) => `${item.mode}:${item.questionId}`;

const legacyContent = rawContent as Content;
const rawQuestions: unknown[] = Array.isArray(legacyContent.questions) ? legacyContent.questions : [];
const legacyQuestions = rawQuestions.filter(isValidQuestion) as StudyQuestion[];
const isContentSource = (value: unknown): value is Content["source"] =>
  isRecord(value)
  && typeof value.path === "string"
  && typeof value.available === "boolean"
  && typeof value.note === "string";
const viewLabels: Record<View, string> = {
  overview: "Lernpfad",
  learn: "Lernen",
  quiz: "Quiz",
  cards: "Lernkarten",
  review: "Fällige Wiederholungen",
  errors: "Fehlerliste",
  progress: "Fortschritt",
  sessions: "Lernsitzung planen",
  studySession: "Sitzung läuft",
  studySummary: "Sitzung abgeschlossen",
  examSetup: "Prüfungssimulation",
  exam: "Prüfung läuft",
  saved: "Gespeicherte Inhalte",
  history: "Lernverlauf",
  importContent: "Lernpaket importieren",
};
const modeLabels: Record<LearningMode, string> = {
  lernen: "Erklär es selbst",
  karten: "Lernkarten",
  quiz: "Quiz",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ConfidencePicker({ id, value, onChange }: {
  id: string;
  value: Confidence | undefined;
  onChange: (value: Confidence | undefined) => void;
}) {
  const choices: Confidence[] = ["niedrig", "mittel", "hoch"];
  return (
    <fieldset className="confidence-picker">
      <legend>Sicherheit vor der Antwort (optional)</legend>
      <div className="confidence-options">
        {choices.map((choice) => (
          <label className="confidence-option" key={choice}>
            <input type="radio" name={`confidence-${id}`} checked={value === choice} onChange={() => onChange(choice)} />
            <span>{choice[0].toLocaleUpperCase("de") + choice.slice(1)}</span>
          </label>
        ))}
        {value && <button type="button" className="button secondary" onClick={() => onChange(undefined)}>Auswahl löschen</button>}
      </div>
    </fieldset>
  );
}

function readProgress(): { progress: Progress; warning: boolean } {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { progress: emptyProgress, warning: false };
    const parsed: unknown = JSON.parse(stored);
    if (isRecord(parsed) && parsed.schemaVersion !== undefined
      && parsed.schemaVersion !== 2 && parsed.schemaVersion !== 3) {
      return { progress: emptyProgress, warning: true };
    }
    const storedProgress = isRecord(parsed) && isRecord(parsed.progress) ? parsed.progress : parsed;
    return {
      progress: migrateStoredProgress(storedProgress, legacyQuestions),
      warning: false,
    };
  } catch {
    return { progress: emptyProgress, warning: true };
  }
}

function readStudySpace(): { space: StudySpace; warning: boolean; fatalError: string; migratedLegacy: boolean; needsSave: boolean } {
  try {
    const storedSpace = window.localStorage.getItem(STUDY_SPACE_KEY);
    if (storedSpace) {
      const space = parseStudySpace(storedSpace);
      return {
        space,
        warning: false,
        fatalError: "",
        migratedLegacy: false,
        needsSave: createStudySpaceBackup(space) !== storedSpace,
      };
    }
    const legacy = readProgress();
    if (legacy.warning) {
      return {
        space: createDefaultSpace(null, legacyQuestions, legacyContent.transferTask, legacyContent.chapters),
        warning: false,
        fatalError: "Der bestehende ABWL-Lernstand konnte nicht sicher geprüft werden. Er wurde nicht überschrieben.",
        migratedLegacy: false,
        needsSave: false,
      };
    }
    const hasLegacyData = window.localStorage.getItem(STORAGE_KEY) !== null;
    return {
      space: createDefaultSpace(legacy.progress, legacyQuestions, legacyContent.transferTask, legacyContent.chapters),
      warning: legacy.warning,
      fatalError: "",
      migratedLegacy: hasLegacyData && !legacy.warning,
      needsSave: true,
    };
  } catch (error) {
    return {
      space: createDefaultSpace(null, legacyQuestions, legacyContent.transferTask),
      warning: false,
      fatalError: error instanceof Error ? error.message : "Der Study Space konnte nicht geladen werden.",
      migratedLegacy: false,
      needsSave: false,
    };
  }
}

function hasSourcePages(question: Question): boolean {
  return Array.isArray(question.sourcePages)
    && question.sourcePages.length > 0
    && question.sourcePages.every((page) => Number.isInteger(page) && page > 0);
}

function isPlayableQuiz(question: Question): boolean {
  return !question.placeholder
    && question.kind === "quiz"
    && hasSourcePages(question)
    && Array.isArray(question.options)
    && question.options.length >= 2
    && question.options.every((option) => typeof option === "string" && option.trim().length > 0)
    && Number.isInteger(question.correctOption)
    && question.correctOption! >= 0
    && question.correctOption! < question.options.length;
}

function isLearnableFlashcard(question: Question): boolean {
  return !question.placeholder
    && question.kind === "flashcard"
    && hasSourcePages(question)
    && typeof question.answer === "string"
    && question.answer.trim().length > 0;
}

function isValidQuestion(value: unknown): value is Question {
  if (!isRecord(value)) return false;
  const question = value;
  if (
    typeof question.id !== "string"
    || !question.id
    || typeof question.prompt !== "string"
    || !question.prompt
    || (question.kind !== "flashcard" && question.kind !== "quiz")
    || typeof question.chapter !== "string"
    || (question.chapterNumber !== undefined && (!Number.isInteger(question.chapterNumber) || Number(question.chapterNumber) < 1))
    || (question.section !== undefined && typeof question.section !== "string")
    || typeof question.questionType !== "string"
    || typeof question.placeholder !== "boolean"
    || typeof question.uncertain !== "boolean"
    || (question.answer !== undefined && typeof question.answer !== "string")
    || (question.explanation !== undefined && typeof question.explanation !== "string")
    || (question.shortExplanation !== undefined && typeof question.shortExplanation !== "string")
    || (question.keyTerms !== undefined && (!Array.isArray(question.keyTerms) || !question.keyTerms.every((term) => typeof term === "string")))
    || (question.examples !== undefined && (!Array.isArray(question.examples) || !question.examples.every((example) => typeof example === "string")))
    || (question.options !== undefined && !Array.isArray(question.options))
    || !Array.isArray(question.sourcePages)
    || !question.sourcePages.every((page) => Number.isInteger(page) && page > 0)
  ) return false;

  if (question.placeholder) return true;
  if (
    !question.sourcePages.length
    || question.kind === "quiz" && (
      !Array.isArray(question.options)
      || question.options.length < 2
      || !question.options.every((option) => typeof option === "string" && option.trim().length > 0)
      || !Number.isInteger(question.correctOption)
      || Number(question.correctOption) < 0
      || Number(question.correctOption) >= question.options.length
    )
  ) return false;
  return question.kind === "quiz"
    || question.kind === "flashcard" && typeof question.answer === "string" && question.answer.trim().length > 0;
}

function dueLabel(date: string, today: string): string {
  if (date < today) return "Überfällig";
  if (date === today) return "Heute fällig";
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  return days === 1 ? "Morgen fällig" : `In ${days} Tagen`;
}

function SourceNote({ question }: { question: Question }) {
  return (
    <div className="source-row">
      <span className="source-label">Quelle</span>
      {question.sourcePages.length > 0 ? (
        <span className="source-value">
          {question.sourceFileName ?? "Quelle"} · {question.sourcePages.map((page) => `S. ${page}`).join(", ")}
        </span>
      ) : (
        <span className="source-pending">Seitenangabe noch offen</span>
      )}
      {question.uncertain && <span className="uncertain-tag">Inhalt unsicher</span>}
    </div>
  );
}

type CourseAppProps = {
  course: Course;
  progress: Progress;
  setProgress: (update: SetStateAction<Progress>) => boolean;
  onCourseChange: (update: (course: Course) => Course) => boolean;
  onBack: () => void;
  saveWarning: boolean;
  setSaveWarning: (warning: boolean) => void;
};

function App() {
  const [initial] = useState(readStudySpace);
  const [space, setSpace] = useState(initial.space);
  const spaceRef = useRef(initial.space);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [storageError, setStorageError] = useState(initial.fatalError);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [workspaceError, setWorkspaceError] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [renamingCourseId, setRenamingCourseId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const workspaceInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (storageError || !initial.needsSave || spaceRef.current !== initial.space) return;
    try {
      persistStudySpace(window.localStorage, initial.space);
      if (initial.migratedLegacy) window.localStorage.removeItem(STORAGE_KEY);
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, []);

  const commitSpace = (update: StudySpace | ((previous: StudySpace) => StudySpace)): boolean => {
    const next = typeof update === "function" ? update(spaceRef.current) : update;
    let committed: StudySpace;
    try {
      committed = commitStudySpace(window.localStorage, next);
    } catch (error) {
      setStorageWarning(true);
      setWorkspaceMessage(error instanceof Error ? error.message : "Die Änderung konnte nicht lokal gespeichert werden.");
      setWorkspaceError(true);
      return false;
    }
    spaceRef.current = committed;
    setSpace(committed);
    setStorageWarning(false);
    setWorkspaceMessage("");
    setWorkspaceError(false);
    return true;
  };
  const updateCourse = (courseId: string, update: (course: Course) => Course): boolean =>
    commitSpace((previous) => ({
      ...previous,
      courses: previous.courses.map((course) => course.id === courseId ? update(course) : course),
    }));
  const chooseCourse = (courseId: string) => {
    if (!commitSpace((previous) => ({ ...previous, activeCourseId: courseId }))) return;
    setWorkspaceMessage("");
  };
  const activeCourse = space.courses.find((course) => course.id === space.activeCourseId);

  function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = courseName.trim();
    if (!name) return;
    const course: Course = {
      id: `course-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      name,
      archived: false,
      createdAt: new Date().toISOString(),
      materials: [],
      chapters: [],
      questions: [],
      progress: structuredClone(emptyProgress),
    };
    if (!commitSpace((previous) => ({ ...previous, courses: [...previous.courses, course] }))) return;
    setCourseName("");
    setWorkspaceMessage(`Fach „${name}“ wurde angelegt. Es enthält noch keine Lerninhalte.`);
    setWorkspaceError(false);
  }

  function renameCourse(course: Course) {
    const name = renameValue.trim();
    if (!name) {
      setWorkspaceMessage("Der Fachname darf nicht leer sein.");
      setWorkspaceError(true);
      return;
    }
    if (!updateCourse(course.id, (current) => ({ ...current, name }))) return;
    setRenamingCourseId(null);
    setWorkspaceMessage(`Fach wurde in „${name}“ umbenannt.`);
    setWorkspaceError(false);
  }

  function removeCourse(course: Course) {
    if (!window.confirm(`Fach „${course.name}“ und seinen Lernstand wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden. Eventuell früher abgelegte PDFs bleiben unangetastet in IndexedDB dieses Browsers.`)) return;
    const saved = commitSpace((previous) => ({
      ...previous,
      activeCourseId: previous.activeCourseId === course.id ? null : previous.activeCourseId,
      courses: previous.courses.filter((item) => item.id !== course.id),
    }));
    if (!saved) return;
    setWorkspaceMessage(`Fach „${course.name}“ wurde gelöscht. Eventuell früher abgelegte PDF-Dateien bleiben aus Datenschutzgründen unangetastet in IndexedDB dieses Browsers.`);
    setWorkspaceError(false);
  }

  function exportStudySpace() {
    const file = new Blob([createStudySpaceBackup(space)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `study-space-${todayLocalDate()}.json`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setWorkspaceMessage("Study-Space-Sicherung exportiert. Eventuell vorhandene ältere PDF-Dateien sind nicht enthalten; ihre lokalen IndexedDB-Daten wurden nicht verändert.");
    setWorkspaceError(false);
  }

  async function importStudySpace(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 20_000_000) throw new Error("Die Study-Space-Sicherung darf höchstens 20 MB groß sein.");
      const text = await file.text();
      let imported: StudySpace;
      try {
        imported = parseStudySpace(text);
      } catch (spaceError) {
        if (!storageError) throw spaceError;
        const recoveredProgress = parseProgressImport(
          text,
          legacyQuestions.map(({ id, kind }) => ({ id, kind })),
        );
        imported = createDefaultSpace(
          recoveredProgress,
          legacyQuestions,
          legacyContent.transferTask,
          legacyContent.chapters,
        );
      }
      const next = storageError ? imported : mergeStudySpace(spaceRef.current, imported);
      if (!commitSpace(next)) return;
      setStorageError("");
      setWorkspaceMessage("Fächer und Lernstände wurden ergänzt. Eventuell vorhandene PDF-Binärdateien sind nicht in JSON-Sicherungen enthalten.");
      setWorkspaceError(false);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Die Study-Space-Sicherung konnte nicht importiert werden.");
      setWorkspaceError(true);
    } finally {
      if (workspaceInput.current) workspaceInput.current.value = "";
    }
  }

  if (storageError) {
    return (
      <main className="error-state workspace-error" role="alert">
        <span className="eyebrow">Study Space</span>
        <h1>Gespeicherte Daten konnten nicht geprüft werden</h1>
        <p>{storageError} Die vorhandenen Daten wurden nicht überschrieben. Wähle eine gültige Study-Space-Sicherung oder ein unterstütztes ABWL-Lernstands-Backup zur Wiederherstellung.</p>
        {workspaceMessage && <p className="data-message" role={workspaceError ? "alert" : "status"}>{workspaceMessage}</p>}
        <button className="button secondary" onClick={() => workspaceInput.current?.click()}>Sicherung auswählen</button>
        <input ref={workspaceInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Study-Space-Sicherung auswählen" onChange={(event) => void importStudySpace(event.target.files?.[0])} />
      </main>
    );
  }

  if (activeCourse) {
    const setCourseProgress = (update: SetStateAction<Progress>) =>
      updateCourse(activeCourse.id, (course) => ({
        ...course,
        progress: typeof update === "function" ? update(course.progress) : update,
      }));
    return (
      <CourseApp
        key={activeCourse.id}
        course={activeCourse}
        progress={activeCourse.progress}
        setProgress={setCourseProgress}
        onCourseChange={(update) => updateCourse(activeCourse.id, update)}
        onBack={() => { commitSpace((previous) => ({ ...previous, activeCourseId: null })); }}
        saveWarning={storageWarning}
        setSaveWarning={setStorageWarning}
      />
    );
  }

  const shownCourses = space.courses.filter((course) => showArchived || !course.archived);
  return (
    <main className="study-space-home">
      <header className="workspace-header">
        <a className="brand workspace-brand" href="#study-space">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Persönlicher<span className="brand-light"> Study Space</span></span>
        </a>
        <span className="workspace-local"><span aria-hidden="true">●</span> Nur auf diesem Gerät</span>
      </header>
      <section className="workspace-welcome">
        <span className="eyebrow">Dein persönlicher Lernraum</span>
        <h1>Fach auswählen oder anlegen</h1>
        <p>Verwalte Fächer und importiere belegte Lerninhalte aus JSON-Paketen, die außerhalb der App erstellt wurden. Diese App erzeugt keine Inhalte und verbindet sich nicht mit KI-Diensten.</p>
      </section>
      {storageWarning && <p className="save-warning" role="alert">Die letzte Änderung wurde nicht übernommen oder eine notwendige Migration konnte nicht gespeichert werden. Der vorherige Lernstand bleibt erhalten. Exportiere eine Sicherung und prüfe den verfügbaren Browser-Speicher.</p>}
      {workspaceMessage && <p className="data-message" role={workspaceError ? "alert" : "status"}>{workspaceMessage}</p>}
      <section className="workspace-create" aria-labelledby="create-course-title">
        <div><span className="eyebrow">Starten</span><h2 id="create-course-title">Ein Fach hinzufügen</h2></div>
        <form onSubmit={addCourse}>
          <label className="visually-hidden" htmlFor="new-course-name">Fachname</label>
          <input id="new-course-name" value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Zum Beispiel: Kursname" maxLength={80} required />
          <button className="button reveal-button" type="submit">Fach anlegen</button>
        </form>
      </section>
      <section className="workspace-courses" aria-labelledby="courses-title">
        <div className="section-heading"><div><span className="eyebrow">Deine Fächer</span><h2 id="courses-title">Fächer und Kurse</h2></div><label className="check-option"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /><span>Archivierte anzeigen</span></label></div>
        {shownCourses.length === 0 ? (
          <section className="empty-panel"><h2>Noch keine Fächer</h2><p>Lege oben dein erstes Fach an. Inhalte können später als externe JSON-Pakete importiert werden.</p></section>
        ) : (
          <div className="workspace-course-grid">
            {shownCourses.map((course) => (
              <article className="workspace-course-card" key={course.id}>
                <div className="workspace-course-top"><span className="tag">{course.archived ? "Archiviert" : "Fach"}</span><span className="course-created">Seit {new Date(course.createdAt).toLocaleDateString("de-DE")}</span></div>
                {renamingCourseId === course.id ? (
                  <form className="rename-course-form" onSubmit={(event) => { event.preventDefault(); renameCourse(course); }}>
                    <label className="visually-hidden" htmlFor={`rename-${course.id}`}>Fachname ändern</label>
                    <input id={`rename-${course.id}`} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={80} autoFocus />
                    <button className="button secondary" type="submit">Speichern</button>
                    <button className="button secondary" type="button" onClick={() => setRenamingCourseId(null)}>Abbrechen</button>
                  </form>
                ) : <h3>{course.name}</h3>}
                <p>{course.questions.filter((question) => !question.placeholder).length} importierte Lerninhalte · {course.chapters.length} Kapitel</p>
                <div className="course-stats"><span>{Object.keys(course.progress.reviews).length} Wiederholungen</span><span>{course.progress.history.length} Lernverläufe</span></div>
                <div className="course-actions">
                  <button className="button reveal-button" onClick={() => chooseCourse(course.id)}>Fach öffnen</button>
                  <button className="button secondary" onClick={() => { setRenameValue(course.name); setRenamingCourseId(course.id); }}>Umbenennen</button>
                  <button className="button secondary" onClick={() => updateCourse(course.id, (current) => ({ ...current, archived: !current.archived }))}>{course.archived ? "Wiederherstellen" : "Archivieren"}</button>
                  <button className="button wrong-button" onClick={() => void removeCourse(course)}>Löschen</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="data-tools workspace-backup" aria-labelledby="workspace-backup-title">
        <div><span className="eyebrow">Datensicherung</span><h2 id="workspace-backup-title">Study Space übertragen</h2><p>JSON enthält Fächer, Fachfortschritt, erhaltene ältere Material-Metadaten und Lerninhalte. Frühere PDF-Dateien sind nicht enthalten; vorhandene IndexedDB-Daten bleiben unangetastet.</p></div>
        <div className="data-actions">
          <button className="button secondary" onClick={exportStudySpace}>Study Space exportieren</button>
          <button className="button secondary" onClick={() => workspaceInput.current?.click()}>Sicherung importieren</button>
          <input ref={workspaceInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Study-Space-Sicherung auswählen" onChange={(event) => void importStudySpace(event.target.files?.[0])} />
        </div>
      </section>
    </main>
  );
}

function CourseApp({ course, progress, setProgress, onCourseChange, onBack, saveWarning, setSaveWarning }: CourseAppProps) {
  const content: Content = {
    source: {
      path: "",
      available: false,
      note: "Quellenangaben stammen aus importierten Lernpaketen; die App speichert oder analysiert keine PDFs.",
    },
    questions: course.questions.map((question) => {
      const chapterId = resolveQuestionChapterId(question, course.chapters);
      return {
        ...question,
        ...(chapterId ? { chapterId } : {}),
        chapterNumber: chapterId
          ? course.chapters.findIndex((chapter) => chapter.id === chapterId) + 1
          : question.chapterNumber,
      };
    }),
    chapters: course.chapters.map((chapter, index) => ({ id: chapter.id, number: index + 1, title: chapter.title })),
    transferTask: course.transferTask,
  };
  const questions = content.questions;
  const chapterCatalog = content.chapters;
  const [view, setView] = useState<View>("overview");
  const [openGroups, setOpenGroups] = useState<Partial<Record<NavigationGroupId, boolean>>>({});
  const [chapterFilter, setChapterFilter] = useState("Alle Themen");
  const [typeFilter, setTypeFilter] = useState("Alle Fragetypen");
  const [search, setSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [queueQuizFeedback, setQueueQuizFeedback] = useState<QuizFeedback | null>(null);
  const [completedSummary, setCompletedSummary] = useState<StudyHistoryEntry | null>(null);
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [ownExplanation, setOwnExplanation] = useState("");
  const [focusRequest, setFocusRequest] = useState(0);
  const handledFocusRequest = useRef(0);
  const [reminderNotice, setReminderNotice] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [contentPreview, setContentPreview] = useState<ContentImportPreview | null>(null);
  const [contentMessage, setContentMessage] = useState("");
  const [contentError, setContentError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const searchInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const contentInput = useRef<HTMLInputElement>(null);
  const questionTitle = useRef<HTMLHeadingElement>(null);
  const pageTitle = useRef<HTMLHeadingElement>(null);
  const emptyStateTitle = useRef<HTMLHeadingElement>(null);
  const today = todayLocalDate(new Date(now));

  const usableQuestions = useMemo(
    () => questions.filter((question) => isLearnableFlashcard(question) || isPlayableQuiz(question)),
    [course.questions],
  );
  const chapters = chapterCatalog;
  const questionTypes = useMemo(
    () => [...new Set(usableQuestions.map((question) => question.questionType))].sort((a, b) => a.localeCompare(b, "de")),
    [usableQuestions],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase("de");
  const matchesSearch = (question: Question) => !normalizedSearch || [
    question.prompt,
    question.answer,
    question.explanation,
    question.shortExplanation,
    ...(question.keyTerms ?? []),
    ...(question.examples ?? []),
    question.chapter,
    question.section,
    question.questionType,
    progress.notes[question.id],
  ].some((value) => value?.toLocaleLowerCase("de").includes(normalizedSearch));
  const chapterForQuestion = (question: Question) => {
    const resolved = chapterCatalog.find((chapter) => chapter.id === resolveQuestionChapterId(question, course.chapters))?.title;
    return resolved ?? (isQuestionChapterUnresolved(question, course.chapters)
      ? `Nicht eindeutig zugeordnet · ${question.chapter}`
      : "");
  };
  const chapterIdForQuestion = (question: Question) =>
    resolveQuestionChapterId(question, course.chapters);
  const sectionKeyForQuestion = (question: Question) =>
    question.sectionId ?? question.section ?? question.questionType;
  const sectionLabelForQuestion = (question: Question) =>
    question.section ?? question.questionType;
  const selectedChapterIds = (selected: string[]) => [...new Set(selected.flatMap((value) => {
    const exact = chapterCatalog.find((chapter) => chapter.id === value);
    if (exact?.id) return [exact.id];
    return chapterCatalog.filter((chapter) => chapter.title === value).map((chapter) => chapter.id).filter((id): id is string => Boolean(id));
  }))];
  const matchesSelectedTopics = (question: Question, selected: string[]) => {
    if (selected.length === 0) return true;
    const chapterId = chapterIdForQuestion(question);
    return Boolean(chapterId && selectedChapterIds(selected).includes(chapterId));
  };
  const availableTopics = useMemo(
    () => chapterCatalog.filter((chapter) =>
      usableQuestions.some((question) => chapterIdForQuestion(question) === chapter.id),
    ),
    [chapterCatalog, usableQuestions],
  );
  const sessionCandidateCount = usableQuestions.filter((question) =>
    matchesSelectedTopics(question, progress.sessionPreferences.topics)
    && (question.kind === "quiz"
      ? progress.sessionPreferences.modes.includes("quiz")
      : progress.sessionPreferences.modes.some((mode) => mode === "lernen" || mode === "karten")),
  ).length;
  const examCandidateCount = usableQuestions.filter((question) =>
    question.kind === "quiz"
    && matchesSelectedTopics(question, progress.sessionPreferences.examTopics),
  ).length;
  const matchesTopic = (question: Question) =>
    (chapterFilter === "Alle Themen"
      || chapterFilter === unassignedTopic && isQuestionChapterUnresolved(question, course.chapters)
      || chapterIdForQuestion(question) === chapterFilter)
    && (typeFilter === "Alle Fragetypen" || question.questionType === typeFilter)
    && matchesSearch(question);

  const scheduleModes = (question: Question): LearningMode[] =>
    question.kind === "quiz" ? ["quiz"] : ["lernen", "karten"];
  const isKnown = (question: Question, mode: LearningMode) =>
    (progress.reviews[reviewKey(mode, question.id)]?.streak ?? 0) >= 2
    || progress.knownIds.includes(reviewKey(mode, question.id))
    || progress.knownIds.includes(question.id);
  const scheduledItems = useMemo(() => usableQuestions.flatMap((question) =>
    scheduleModes(question).flatMap((mode) => {
      const key = reviewKey(mode, question.id);
      const record = progress.reviews[key];
      return record ? [{ question, mode, key, record }] : [];
    }),
  ), [progress.reviews, usableQuestions]);
  const dueItems = scheduledItems.filter((item) => item.record.dueDate <= today);
  const overdueCount = dueItems.filter((item) => item.record.dueDate < today).length;
  const dueTodayCount = dueItems.filter((item) => item.record.dueDate === today).length;
  const plannedCount = scheduledItems.filter((item) => item.record.dueDate > today).length;
  const goalProgress = dailyGoalProgress(progress.history, progress.dailyGoal, today);
  const historySummary = weeklyMonthlySummary(progress.history, today);
  const retryableExam = [...progress.history].reverse().find((entry) =>
    entry.type === "exam" && entry.missedIds.some((id) => usableQuestions.some((question) => question.id === id)),
  );
  const retryableMissedIds = retryableExam?.missedIds.filter((id) =>
    usableQuestions.some((question) => question.id === id && question.kind === "quiz"),
  ) ?? [];
  const uncertainItems = usableQuestions.flatMap((question) => scheduleModes(question).map((mode) => {
    const key = reviewKey(mode, question.id);
    const record = progress.reviews[key];
    return {
      question,
      mode,
      key,
      record,
      isUncertain: question.uncertain || record?.rating === "unsicher"
        || (!record && (progress.wrongIds.includes(question.id) || progress.wrongIds.includes(key))),
    };
  })).filter((item) => item.isUncertain || progress.reviews[item.key]?.rating === "noch einmal");
  const reviewItems: ReviewItem[] = [...new Map(
    [
      ...dueItems.map(({ question, mode, key, record }) => ({ question, mode, key, record })),
      ...uncertainItems,
    ]
      .map((item) => [item.key, item] as const),
  ).values()].sort((left, right) => {
    const leftDate = progress.reviews[left.key]?.dueDate ?? today;
    const rightDate = progress.reviews[right.key]?.dueDate ?? today;
    return leftDate.localeCompare(rightDate) || left.question.prompt.localeCompare(right.question.prompt, "de");
  });
  const knownCount = usableQuestions.filter((question) => scheduleModes(question).some((mode) => isKnown(question, mode))).length;
  const markedQuestionIds = new Set(uncertainItems.map((item) => item.question.id));
  const confidentErrorIds = new Set(scheduledItems
    .filter(({ record }) => record.confidence === "hoch" && record.rating !== "sicher")
    .map(({ question }) => question.id));
  const topicAttention = summarizeTopicAttention(
    progress.history,
    usableQuestions.map((question) => ({
      questionId: question.id,
      topicId: chapterIdForQuestion(question) ?? unassignedTopic,
      markedForReview: markedQuestionIds.has(question.id),
      confidentError: confidentErrorIds.has(question.id),
    })),
  );
  const repeatedMistakeCount = topicAttention.reduce((total, topic) => total + topic.repeatedMistakes, 0);
  const confidentErrorCount = topicAttention.reduce((total, topic) => total + topic.confidentErrors, 0);
  const masteredChapters = chapterCatalog.filter((chapter) => {
    const topicQuestions = usableQuestions.filter((question) => chapterIdForQuestion(question) === chapter.id);
    return topicQuestions.length > 0 && topicQuestions.every((question) =>
      scheduleModes(question).some((mode) => isKnown(question, mode)));
  }).length;

  const visibleQuestions = useMemo(() => usableQuestions.filter((question) => {
    if (!matchesTopic(question)) return false;
    if (view === "quiz") return isPlayableQuiz(question);
    if (view === "cards" || view === "learn") return isLearnableFlashcard(question);
    if (view === "saved") return progress.bookmarks.includes(question.id) || Boolean(progress.notes[question.id]?.trim());
    return false;
  }), [chapterFilter, normalizedSearch, typeFilter, usableQuestions, view, progress.bookmarks, progress.notes]);
  const savedQuestions = visibleQuestions;
  const hasSavedItems = usableQuestions.some((question) =>
    progress.bookmarks.includes(question.id) || Boolean(progress.notes[question.id]?.trim()),
  );
  const unfinishedSession = progress.unfinishedSession;
  const resumableSession = unfinishedSession && !unfinishedSession.submitted && unfinishedSession.items.some((item) =>
    usableQuestions.some((question) => question.id === item.questionId),
  ) ? unfinishedSession : null;
  const nextStep = resumableSession
    ? { title: "Setze deine Sitzung fort", action: "Fortsetzen", run: () => setView(resumableSession.type === "study" ? "studySession" : "exam") }
    : overdueCount > 0
      ? { title: `${overdueCount} Wiederholung${overdueCount === 1 ? "" : "en"} sind überfällig`, action: "Überfällige wiederholen", run: () => changeView("review") }
      : dueTodayCount > 0
        ? { title: `${dueTodayCount} Wiederholung${dueTodayCount === 1 ? "" : "en"} heute fällig`, action: "Heute wiederholen", run: () => changeView("review") }
        : retryableMissedIds.length > 0
          ? { title: `${retryableMissedIds.length} verfehlte Prüfungsfrage${retryableMissedIds.length === 1 ? "" : "n"} erneut üben`, action: "Verfehlte Fragen üben", run: () => startExam(retryableMissedIds, true) }
          : usableQuestions.length > 0
            ? { title: "Eine kurze Lerneinheit starten", action: "Sitzung planen", run: () => changeView("sessions") }
            : { title: "Noch keine belegten Lerninhalte verfügbar", action: "", run: () => undefined };
  const sessionItems = unfinishedSession?.items ?? [];
  const sessionQuestions = sessionItems.flatMap((item) => {
    const question = usableQuestions.find((candidate) => candidate.id === item.questionId);
    return question ? [{ item, question }] : [];
  });
  const currentSessionEntry = unfinishedSession?.submitted ? undefined : sessionQuestions[unfinishedSession?.index ?? 0];
  const visibleReviewItems = reviewItems.filter((item) => {
    if (!matchesTopic(item.question)) return false;
    if (view === "review") return item.record?.dueDate !== undefined && item.record.dueDate <= today;
    if (view === "errors") {
      return item.question.uncertain
        || item.record?.rating === "unsicher"
        || item.record?.rating === "noch einmal"
        || progress.wrongIds.includes(item.question.id)
        || progress.wrongIds.includes(item.key);
    }
    return true;
  });
  const isSessionView = view === "studySession" || view === "exam";
  const activeListLength = isSessionView
    ? sessionItems.length
    : view === "review" || view === "errors"
    ? visibleReviewItems.length
    : visibleQuestions.length;
  const activeIndex = Math.min(currentIndex, Math.max(activeListLength - 1, 0));
  const currentReviewItem = view === "review" || view === "errors" ? visibleReviewItems[activeIndex] : undefined;
  const currentQuestion = view === "exam" && unfinishedSession?.submitted
    ? undefined
    : currentSessionEntry?.question
      ?? (currentReviewItem ? currentReviewItem.question : visibleQuestions[activeIndex]);
  const currentMode: LearningMode = currentSessionEntry?.item.mode
    ?? currentReviewItem?.mode
    ?? (view === "quiz" ? "quiz" : view === "learn" ? "lernen" : "karten");
  const title = viewLabels[view];
  const activeSection = sectionForView(view);
  const activeGroup = groupForView(view);
  const activeSubView = (subview: View) =>
    view === subview
    || subview === "sessions" && (view === "studySession" || view === "studySummary")
    || subview === "examSetup" && view === "exam"
    || subview === "progress" && view === "history";
  const activeSessionTimerSeconds = unfinishedSession?.durationMinutes && !unfinishedSession.submitted
    ? Math.max(0, Math.ceil((Date.parse(unfinishedSession.startedAt) + unfinishedSession.durationMinutes * 60_000 - now) / 1000))
    : null;
  useEffect(() => {
    setNoteDraft(currentQuestion ? progress.notes[currentQuestion.id] ?? "" : "");
  }, [currentQuestion?.id, progress.notes]);
  useEffect(() => {
    setConfidence(undefined);
    setOwnExplanation("");
  }, [currentQuestion?.id, currentMode]);

  useEffect(() => {
    setLoadState(
      isContentSource(content.source)
      && Array.isArray(content.questions)
      && content.questions.every(isValidQuestion)
        ? "ready"
        : "error",
    );
  }, [content.source.available, course.questions]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswerOpen(false);
    setSelectedOption(null);
    setQueueQuizFeedback(null);
  }, [chapterFilter, normalizedSearch, typeFilter, view]);
  useEffect(() => {
    if (activeGroup) setOpenGroups((previous) => ({ ...previous, [activeGroup]: true }));
  }, [activeGroup]);
  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(activeListLength - 1, 0)));
  }, [activeListLength]);
  useEffect(() => {
    if (handledFocusRequest.current === focusRequest) return;
    handledFocusRequest.current = focusRequest;
    (currentQuestion ? questionTitle.current : emptyStateTitle.current ?? pageTitle.current)?.focus();
  }, [currentQuestion?.id, focusRequest]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Date.now()),
      unfinishedSession?.durationMinutes && !unfinishedSession.submitted ? 1000 : 60_000,
    );
    return () => window.clearInterval(timer);
  }, [unfinishedSession?.durationMinutes, unfinishedSession?.submitted]);
  useEffect(() => {
    if (activeSessionTimerSeconds !== 0 || !unfinishedSession || unfinishedSession.submitted) return;
    if (unfinishedSession.type === "exam") submitExam();
    else finishStudySession();
  }, [activeSessionTimerSeconds, unfinishedSession?.startedAt, unfinishedSession?.submitted]);
  useEffect(() => {
    if (!progress.dailyGoal.enabled || !progress.dailyGoal.reminderEnabled || goalProgress.complete || !usableQuestions.length) {
      setReminderNotice("");
      return;
    }
    setReminderNotice("Dein optionaler Lernhinweis: Wenn es heute passt, steht eine kurze Lerneinheit bereit. Diese Erinnerung erscheint nur, solange die App geöffnet ist.");
  }, [progress.dailyGoal.reminderEnabled, goalProgress.complete, today, usableQuestions.length]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      const isInteractive = target instanceof Element
        && Boolean(target.closest("button, a, input, textarea, select, [role='tab'], [contenteditable='true']"));
      const isTyping = target instanceof Element
        && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
      if (event.altKey || event.ctrlKey || event.metaKey || isTyping) return;
      if (event.key === "/" && !isInteractive) {
        event.preventDefault();
        searchInput.current?.focus();
      } else if (event.code === "Space" && !isInteractive
        && (view === "learn" || view === "cards" || view === "studySession")
        && currentQuestion?.kind === "flashcard" && !answerOpen) {
        event.preventDefault();
        setAnswerOpen(true);
      } else if (event.key === "ArrowRight" && !isInteractive
        && ["learn", "quiz", "cards", "review", "errors", "studySession", "exam"].includes(view)) {
        event.preventDefault();
        moveNext();
      } else if (event.key === "ArrowLeft" && !isInteractive
        && ["learn", "quiz", "cards", "review", "errors", "studySession", "exam"].includes(view)) {
        event.preventDefault();
        movePrevious();
      } else if (["1", "2", "3"].includes(event.key) && !isInteractive
        && answerOpen && currentQuestion?.kind === "flashcard"
        && ["learn", "cards", "review", "errors", "studySession"].includes(view)) {
        event.preventDefault();
        const ratings: Rating[] = ["sicher", "unsicher", "noch einmal"];
        recordReview(currentQuestion, ratings[Number(event.key) - 1], currentMode);
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [answerOpen, currentMode, currentQuestion, view]);

  function changeView(nextView: View) {
    setView(nextView);
  }

  function openTopic(chapter: string) {
    setChapterFilter(chapter);
    setTypeFilter("Alle Fragetypen");
    setView("learn");
  }

  function updateSessionPreferences(update: Partial<Progress["sessionPreferences"]>) {
    setProgress((previous) => ({
      ...previous,
      sessionPreferences: { ...previous.sessionPreferences, ...update },
    }));
  }

  function startStudySession(items?: StudySessionItem[]) {
    if (progress.unfinishedSession && !progress.unfinishedSession.submitted) return;
    const selectedItems = items ?? makeStudySession(
      usableQuestions.map((question) => ({
        id: question.id,
        kind: question.kind,
        chapter: chapterIdForQuestion(question) ?? "",
        section: question.sectionId ?? question.section,
        modes: question.kind === "quiz" ? ["quiz"] as LearningMode[] : ["lernen", "karten"] as LearningMode[],
        due: false,
        weak: false,
        learned: false,
        dueModes: scheduleModes(question).filter((mode) => {
          const review = progress.reviews[reviewKey(mode, question.id)];
          return Boolean(review && review.dueDate <= today);
        }),
        weakModes: scheduleModes(question).filter((mode) => {
          const key = reviewKey(mode, question.id);
          return progress.wrongIds.includes(question.id)
            || progress.wrongIds.includes(key)
            || Boolean(progress.reviews[key] && progress.reviews[key].rating !== "sicher");
        }),
        learnedModes: scheduleModes(question).filter((mode) => isKnown(question, mode)),
      })),
      {
        ...progress.sessionPreferences,
        topics: selectedChapterIds(progress.sessionPreferences.topics),
        questionCount: progress.sessionPreferences.durationMinutes === null ? progress.sessionPreferences.questionCount : 100,
      },
    );
    if (!selectedItems.length) return;
    const now = new Date();
    if (!setProgress((previous) => ({
      ...previous,
      unfinishedSession: {
        type: "study",
        startedAt: now.toISOString(),
        items: selectedItems,
        index: 0,
        durationMinutes: progress.sessionPreferences.durationMinutes,
        answers: {},
        submitted: false,
        retryMissed: false,
      },
    }))) return;
    setCurrentIndex(0);
    setView("studySession");
    setAnnouncement(`Lernsitzung gestartet mit ${selectedItems.length} Fragen.`);
  }

  function startExam(questionIds?: string[], retryMissed = false) {
    if (progress.unfinishedSession && !progress.unfinishedSession.submitted) return;
    const pool = usableQuestions.filter((question) =>
      question.kind === "quiz"
      && (questionIds ? questionIds.includes(question.id) : (
        matchesSelectedTopics(question, progress.sessionPreferences.examTopics)
      )),
    );
    const selectedQuestions = makeExamSelection(
      pool,
      questionIds ? questionIds.length : progress.sessionPreferences.examCount,
    );
    if (!selectedQuestions.length) return;
    const now = new Date();
    if (!setProgress((previous) => ({
      ...previous,
      unfinishedSession: {
        type: "exam",
        startedAt: now.toISOString(),
        items: selectedQuestions.map((question) => ({ questionId: question.id, mode: "quiz" })),
        index: 0,
        durationMinutes: progress.sessionPreferences.examDurationMinutes,
        answers: {},
        submitted: false,
        retryMissed,
      },
    }))) return;
    setCurrentIndex(0);
    setSelectedOption(null);
    setView("exam");
    setAnnouncement(`Prüfungssimulation gestartet mit ${selectedQuestions.length} Fragen. Antworten und Erklärungen werden erst nach Abgabe ausgewertet.`);
  }

  function finishStudySession() {
    const session = progress.unfinishedSession;
    if (!session || session.type !== "study" || session.submitted) return;
    const answers = Object.values(session.answers);
    const nowDate = new Date();
    const entry: StudyHistoryEntry = {
      id: `${nowDate.getTime()}-study`,
      date: todayLocalDate(nowDate),
      type: "study",
      durationSeconds: Math.max(0, Math.floor((nowDate.getTime() - Date.parse(session.startedAt)) / 1000)),
      attempted: answers.length,
      correct: answers.filter((answer) => answer.isCorrect).length,
      questionIds: session.items.map((item) => item.questionId),
      missedIds: [...new Set(session.items.flatMap((item) => {
        const answer = session.answers[studyAnswerKey(item)];
        return answer && !answer.isCorrect ? [item.questionId] : [];
      }))],
    };
    if (!setProgress((previous) => ({
      ...previous,
      unfinishedSession: null,
      history: appendHistory(previous.history, entry),
    }))) return;
    setCompletedSummary(entry);
    setView("studySummary");
    setFocusRequest((request) => request + 1);
    setAnnouncement(`Lernsitzung abgeschlossen. ${entry.attempted} Fragen bearbeitet; ${entry.correct} sicher oder richtig beantwortet.`);
  }

  function advanceStudySession(item: StudySessionItem, isCorrect: boolean, outcome = "") {
    const session = progress.unfinishedSession;
    if (!session || session.type !== "study") return;
    const answers = {
      ...session.answers,
      [studyAnswerKey(item)]: { selectedOption: isCorrect ? 1 : 0, isCorrect },
    };
    if (session.index + 1 >= session.items.length) {
      const nowDate = new Date();
      const answerValues = Object.values(answers);
      const entry: StudyHistoryEntry = {
        id: `${nowDate.getTime()}-study`,
        date: todayLocalDate(nowDate),
        type: "study",
        durationSeconds: Math.max(0, Math.floor((nowDate.getTime() - Date.parse(session.startedAt)) / 1000)),
        attempted: answerValues.length,
        correct: answerValues.filter((answer) => answer.isCorrect).length,
        questionIds: session.items.map((sessionItem) => sessionItem.questionId),
        missedIds: [...new Set(session.items.flatMap((sessionItem) => {
          const answer = answers[studyAnswerKey(sessionItem)];
          return answer && !answer.isCorrect ? [sessionItem.questionId] : [];
        }))],
      };
      if (!setProgress((previous) => ({
        ...previous,
        unfinishedSession: null,
        history: appendHistory(previous.history, entry),
      }))) return;
      setCompletedSummary(entry);
      setView("studySummary");
      setFocusRequest((request) => request + 1);
      setAnnouncement(`${outcome} Lernsitzung abgeschlossen: ${entry.attempted} Fragen bearbeitet, ${entry.correct} sicher beantwortet.`);
      return;
    }
    const nextIndex = session.index + 1;
    const nextQuestion = usableQuestions.find((question) => question.id === session.items[nextIndex]?.questionId);
    if (!setProgress((previous) => ({
      ...previous,
      unfinishedSession: previous.unfinishedSession
        ? { ...previous.unfinishedSession, index: nextIndex, answers }
        : null,
    }))) return;
    setCurrentIndex(nextIndex);
    setSelectedOption(null);
    setAnswerOpen(false);
    setFocusRequest((request) => request + 1);
    setAnnouncement(nextQuestion ? `Sitzungsfortschritt ${nextIndex + 1} von ${session.items.length}. Nächste Frage: ${nextQuestion.prompt}` : "Nächste Frage nicht mehr verfügbar.");
  }

  function submitExam() {
    const session = progress.unfinishedSession;
    if (!session || session.type !== "exam" || session.submitted) return;
    const correct = Object.values(session.answers).filter((answer) => answer.isCorrect).length;
    if (!setProgress((previous) => previous.unfinishedSession?.type === "exam"
      ? completeExamProgress(previous, previous.unfinishedSession, new Date())
      : previous)) return;
    setSelectedOption(null);
    setFocusRequest((request) => request + 1);
    setAnnouncement(`Prüfung abgegeben. ${correct} von ${session.items.length} richtig. Die Ergebnisse verändern deinen Lernfortschritt nicht.`);
  }

  function answerExam(question: Question, optionIndex: number) {
    const session = progress.unfinishedSession;
    if (!session || session.type !== "exam" || session.submitted || session.answers[question.id]) return;
    const isCorrect = optionIndex === question.correctOption;
    const nextIndex = session.index + 1;
    if (!setProgress((previous) => ({
      ...previous,
      unfinishedSession: previous.unfinishedSession
        ? {
            ...previous.unfinishedSession,
            index: Math.min(nextIndex, previous.unfinishedSession.items.length - 1),
            answers: {
              ...previous.unfinishedSession.answers,
              [question.id]: { selectedOption: optionIndex, isCorrect },
            },
          }
        : null,
    }))) return;
    const nextQuestion = usableQuestions.find((candidate) => candidate.id === session.items[session.index + 1]?.questionId);
    setAnnouncement(`Antwort gespeichert. ${Object.keys(session.answers).length + 1} von ${session.items.length} beantwortet. Richtig/Falsch wird erst nach Abgabe angezeigt. ${nextQuestion ? `Nächste Prüfungsfrage: ${nextQuestion.prompt}` : "Letzte Frage beantwortet; du kannst die Prüfung abgeben."}`);
    if (session.index + 1 < session.items.length) {
      setCurrentIndex(nextIndex);
      setFocusRequest((request) => request + 1);
    }
  }

  function toggleBookmark(questionId: string) {
    if (!setProgress((previous) => ({
      ...previous,
      bookmarks: previous.bookmarks.includes(questionId)
        ? previous.bookmarks.filter((id) => id !== questionId)
        : [...previous.bookmarks, questionId],
    }))) return;
    setAnnouncement(progress.bookmarks.includes(questionId) ? "Lesezeichen entfernt." : "Frage gespeichert.");
  }

  function saveNote(questionId: string, value = noteDraft) {
    if (!setProgress((previous) => {
      const notes = { ...previous.notes };
      if (value.trim()) notes[questionId] = value.trim();
      else delete notes[questionId];
      return { ...previous, notes };
    })) return;
    setAnnouncement(value.trim() ? "Notiz gespeichert." : "Notiz gelöscht.");
  }

  function updateDailyGoal(update: Partial<Progress["dailyGoal"]>) {
    setProgress((previous) => ({
      ...previous,
      dailyGoal: { ...previous.dailyGoal, ...update },
    }));
  }

  function abandonSession() {
    if (!setProgress(abandonUnfinishedSession)) return;
    setCurrentIndex(0);
    setView("overview");
    setFocusRequest((request) => request + 1);
    setAnnouncement("Die laufende Sitzung wurde beendet. Noch nicht abgeschlossene Ergebnisse wurden nicht als Lernstand gewertet.");
  }

  function moveNext(outcome = "") {
    if (view === "exam") {
      const session = progress.unfinishedSession;
      if (!session || session.type !== "exam" || session.submitted) return;
      if (session.index + 1 < session.items.length) {
        const nextIndex = session.index + 1;
        if (!setProgress((previous) => ({
          ...previous,
          unfinishedSession: previous.unfinishedSession
            ? { ...previous.unfinishedSession, index: nextIndex }
            : null,
        }))) return;
        setCurrentIndex(nextIndex);
        setFocusRequest((request) => request + 1);
      }
      return;
    }
    if (view === "studySession") {
      const session = progress.unfinishedSession;
      const item = session?.items[session.index];
      if (!session || session.type !== "study" || !item) return;
      const answer = session.answers[studyAnswerKey(item)];
      if (answer) {
        advanceStudySession(item, answer.isCorrect);
      } else if (session.index + 1 < session.items.length) {
        const nextIndex = session.index + 1;
        const nextQuestion = usableQuestions.find((question) => question.id === session.items[nextIndex]?.questionId);
        if (!setProgress((previous) => ({
          ...previous,
          unfinishedSession: previous.unfinishedSession
            ? { ...previous.unfinishedSession, index: nextIndex }
            : null,
        }))) return;
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        setAnswerOpen(false);
        setFocusRequest((request) => request + 1);
        setAnnouncement(nextQuestion ? `Frage übersprungen. Nächste Frage: ${nextQuestion.prompt}` : "Frage übersprungen.");
      } else {
        finishStudySession();
      }
      return;
    }
    const isQueueView = view === "review" || view === "errors";
    const nextCount = isQueueView ? visibleReviewItems.length : visibleQuestions.length;
    const nextIndex = nextReviewIndex(activeIndex, nextCount, false);
    const nextQuestion = isQueueView
      ? visibleReviewItems[nextIndex]?.question
      : visibleQuestions[nextIndex];
    setCurrentIndex(nextIndex);
    setAnswerOpen(false);
    setSelectedOption(null);
    setFocusRequest((request) => request + 1);
    setAnnouncement([
      outcome,
      nextQuestion
        ? `Nächste Frage: ${nextQuestion.prompt}`
        : view === "review" ? "Heute ist keine weitere Wiederholung fällig." : "Diese Liste ist vollständig bearbeitet.",
    ].filter(Boolean).join(" "));
  }

  function movePrevious() {
    if (view === "exam") {
      const session = progress.unfinishedSession;
      if (!session || session.type !== "exam" || session.submitted || session.index <= 0) return;
      const previousIndex = session.index - 1;
      if (!setProgress((previous) => ({
        ...previous,
        unfinishedSession: previous.unfinishedSession
          ? { ...previous.unfinishedSession, index: previousIndex }
          : null,
      }))) return;
      setCurrentIndex(previousIndex);
      setFocusRequest((request) => request + 1);
      return;
    }
    const isQueueView = view === "review" || view === "errors";
    const remainingQuestions = isQueueView
      ? visibleReviewItems.map((item) => item.question)
      : visibleQuestions;
    const count = remainingQuestions.length;
    const index = count > 0 ? (activeIndex - 1 + count) % count : 0;
    setCurrentIndex(index);
    setAnswerOpen(false);
    setSelectedOption(null);
    setFocusRequest((request) => request + 1);
    setAnnouncement(remainingQuestions[index] ? `Vorherige Frage: ${remainingQuestions[index].prompt}` : "Keine Frage in dieser Liste.");
  }

  function recordReview(question: Question, rating: Rating, mode: LearningMode, confidenceValue = confidence) {
    const reviewedAt = new Date();
    const key = reviewKey(mode, question.id);
    const review = scheduleReview(progress.reviews[key], rating, reviewedAt, confidenceValue);
    const confidenceNote = confidenceValue ? ` Sicherheit: ${confidenceValue}.` : "";
    const outcome = (rating === "sicher"
      ? `${review.streak >= 2 ? "Sichere Erinnerung erfasst." : "Erste sichere Erinnerung erfasst."} Nächste Wiederholung: ${dueLabel(review.dueDate, todayLocalDate(reviewedAt))}.`
      : `${rating === "unsicher" ? "Als unsicher markiert." : "Zur Wiederholung vorgemerkt."} Nächste Wiederholung: ${dueLabel(review.dueDate, todayLocalDate(reviewedAt))}.`) + confidenceNote;
    if (!setProgress((previous) => {
      const known = new Set(previous.knownIds);
      const wrong = new Set(previous.wrongIds);
      if (rating === "sicher") {
        if (review.streak >= 2) known.add(key);
        wrong.delete(question.id);
        wrong.delete(key);
      } else {
        known.delete(question.id);
        known.delete(key);
        wrong.add(key);
      }
      return {
        ...previous,
        knownIds: [...known],
        wrongIds: [...wrong],
        reviews: {
          ...previous.reviews,
          [key]: review,
        },
      };
    })) return;
    setQueueQuizFeedback(null);
    setNow(reviewedAt.getTime());

    if (view === "review" || view === "errors") {
      const remainsInErrors = view === "errors" && (rating !== "sicher" || question.uncertain);
      const remainingItems = remainsInErrors
        ? visibleReviewItems
        : visibleReviewItems.filter((item) => item.key !== key);
      const nextIndex = nextReviewIndex(activeIndex, remainingItems.length, !remainsInErrors);
      const nextItem = remainingItems[nextIndex];
      const nextAnnouncement = nextItem && nextItem.key !== key
        ? `Nächste Frage: ${nextItem.question.prompt}`
        : remainsInErrors
          ? "Diese Frage bleibt in der Fehlerliste, bis sie sicher beantwortet oder als unsicherer Inhalt geprüft wurde."
          : view === "review" ? "Heute ist keine weitere Wiederholung fällig." : "Die Fehlerliste ist leer.";
      setCurrentIndex(nextIndex);
      setAnswerOpen(false);
      setSelectedOption(null);
      setFocusRequest((request) => request + 1);
      setAnnouncement(`${outcome} ${nextAnnouncement}`);
    } else if (view === "studySession") {
      advanceStudySession({ questionId: question.id, mode }, rating === "sicher", outcome);
    } else {
      moveNext(outcome);
    }
  }

  function answerQuiz(question: Question, optionIndex: number) {
    if (selectedOption !== null || !isPlayableQuiz(question)) return;
    const isCorrect = optionIndex === question.correctOption;
    const reviewedAt = new Date();
    const todayDate = todayLocalDate(reviewedAt);
    const key = reviewKey("quiz", question.id);
    const previousReview = progress.reviews[key];
    const review = scheduleReview(previousReview, isCorrect ? "sicher" : "noch einmal", reviewedAt, confidence);

    if (!setProgress((previous) => {
      const known = new Set(previous.knownIds);
      const wrong = new Set(previous.wrongIds);
      if (isCorrect) {
        if (review.streak >= 2) known.add(key);
        wrong.delete(question.id);
        wrong.delete(key);
      } else {
        known.delete(question.id);
        known.delete(key);
        wrong.add(key);
      }
      return {
        ...previous,
        knownIds: [...known],
        wrongIds: [...wrong],
        correctAnswers: previous.correctAnswers + Number(isCorrect),
        incorrectAnswers: previous.incorrectAnswers + Number(!isCorrect),
        reviews: {
          ...previous.reviews,
          [key]: review,
        },
        ...(view === "studySession" && previous.unfinishedSession?.type === "study"
          ? {
              unfinishedSession: {
                ...previous.unfinishedSession,
                answers: {
                  ...previous.unfinishedSession.answers,
                  [studyAnswerKey(previous.unfinishedSession.items[previous.unfinishedSession.index])]: { selectedOption: optionIndex, isCorrect },
                },
              },
            }
          : {}),
      };
    })) return;
    setSelectedOption(optionIndex);
    setNow(reviewedAt.getTime());
    const leavesQueue = view === "review"
      || view === "errors" && isCorrect && !question.uncertain;
    const isQueueView = view === "review" || view === "errors";
    const nextQueueItems = isQueueView
      ? leavesQueue
        ? visibleReviewItems.filter((item) => item.key !== key)
        : visibleReviewItems
      : [];
    const nextCount = isQueueView ? nextQueueItems.length : visibleQuestions.length;
    const nextIndex = nextReviewIndex(activeIndex, nextCount, isQueueView && leavesQueue);
    const nextSessionItem = view === "studySession"
      ? unfinishedSession?.items[(unfinishedSession.index ?? activeIndex) + 1]
      : undefined;
    const nextQuestion = isQueueView
      ? nextQueueItems[nextIndex]?.question
      : view === "studySession"
        ? usableQuestions.find((candidate) => candidate.id === nextSessionItem?.questionId)
      : visibleQuestions[nextIndex];
    const result = isCorrect
      ? `Richtig beantwortet.${confidence ? ` Sicherheit vorher: ${confidence}.` : ""}`
      : `Noch nicht richtig. Die Frage ist für ${dueLabel(review.dueDate, todayDate).toLocaleLowerCase("de")} vorgemerkt.${confidence ? ` Sicherheit vorher: ${confidence}.` : ""}`;
    if (isQueueView) {
      setQueueQuizFeedback({ question, selectedOption: optionIndex, isCorrect });
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setAnswerOpen(false);
      setFocusRequest((request) => request + 1);
      setAnnouncement(`${result} ${nextQuestion ? `Nächste Frage: ${nextQuestion.prompt}` : "Es ist keine weitere Frage in dieser Liste offen."}`);
    } else {
      setAnnouncement(`${result} ${nextQuestion ? `Nach „Nächste Frage“ folgt: ${nextQuestion.prompt}` : "Nach dieser Antwort ist keine weitere Frage in der aktuellen Liste offen."}`);
    }
  }

  function exportProgress() {
    const file = new Blob([JSON.stringify(createProgressExport(progress), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${course.name.toLocaleLowerCase("de").replace(/[^a-z0-9]+/g, "-")}-lernstand-${today}.json`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setImportMessage("Lernstand als JSON-Datei exportiert.");
    setImportError(false);
  }

  async function importProgress(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Die Lernstandsdatei darf höchstens 2 MB groß sein.");
      const imported = parseProgressImport(
        await file.text(),
        usableQuestions.map(({ id, kind }) => ({ id, kind })),
      );
      if (!setProgress(imported)) {
        setImportMessage("Der importierte Lernstand wurde nicht übernommen, weil er nicht lokal gespeichert werden konnte.");
        setImportError(true);
        return;
      }
      setImportMessage("Lernstand erfolgreich importiert.");
      setImportError(false);
      setAnnouncement("Der importierte Lernstand wurde gespeichert.");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Die Datei konnte nicht geprüft werden.");
      setImportError(true);
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  }

  function resetProgress() {
    if (!window.confirm("Möchtest du den gespeicherten Lernstand auf diesem Gerät wirklich zurücksetzen?")) return;
    if (!setProgress(emptyProgress)) {
      setImportMessage("Der Lernstand wurde nicht zurückgesetzt, weil die Änderung nicht lokal gespeichert werden konnte.");
      setImportError(true);
      return;
    }
    setSaveWarning(false);
    setImportMessage(`Lernstand für „${course.name}“ wurde zurückgesetzt.`);
    setImportError(false);
    setAnnouncement(`Lernstand für ${course.name} zurückgesetzt.`);
  }

  async function inspectContentPackage(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("Das Lerninhalte-Paket darf höchstens 1 MB groß sein.");
      const preview = parseContentPackage(await file.text(), course);
      setContentPreview(preview);
      setContentMessage("");
      setContentError(false);
    } catch (error) {
      setContentPreview(null);
      setContentMessage(error instanceof Error ? error.message : "Das Lernpaket konnte nicht geprüft werden.");
      setContentError(true);
    } finally {
      if (contentInput.current) contentInput.current.value = "";
    }
  }

  function confirmContentImport() {
    if (!contentPreview) return;
    try {
      const updated = applyContentImport(course, contentPreview);
      if (!onCourseChange(() => updated)) {
        setContentMessage("Das Lernpaket wurde nicht übernommen, weil es nicht lokal gespeichert werden konnte. Der bisherige Inhalt blieb unverändert.");
        setContentError(true);
        return;
      }
      setContentMessage(`${contentPreview.questions.length} belegte Lerninhalte wurden in „${course.name}“ übernommen.`);
      setContentError(false);
      setContentPreview(null);
      setAnnouncement("Das bestätigte Lernpaket wurde übernommen.");
      setView("overview");
    } catch (error) {
      setContentMessage(error instanceof Error ? error.message : "Das Lernpaket konnte nicht übernommen werden.");
      setContentError(true);
    }
  }

  if (loadState === "loading") {
    return <main className="loading-state" role="status">Lernmaterial wird geladen …</main>;
  }

  if (loadState === "error") {
    return (
      <main className="error-state" role="alert">
        <span className="eyebrow">Lernraum</span>
        <h1>Lernmaterial konnte nicht geladen werden</h1>
        <p>Prüfe bitte Aufbau und Pflichtfelder in <code>src/content/fragen.json</code>.</p>
      </main>
    );
  }

  const topicQuestions = (chapter: Chapter) => usableQuestions.filter((question) =>
    chapterIdForQuestion(question) === chapter.id && matchesSearch(question));
  const unassignedQuestions = usableQuestions.filter((question) =>
    isQuestionChapterUnresolved(question, course.chapters));
  const visibleUnassignedQuestions = unassignedQuestions.filter(matchesSearch);
  const unassignedTopic = "__unassigned_chapter__";
  const getNavigationCount = (target: View): number | null => {
    if (target === "learn" || target === "cards") return usableQuestions.filter(isLearnableFlashcard).length;
    if (target === "quiz") return usableQuestions.filter(isPlayableQuiz).length;
    if (target === "review") return dueItems.length;
    if (target === "errors") return uncertainItems.length;
    if (target === "sessions") return usableQuestions.length;
    if (target === "saved") return progress.bookmarks.length
      + Object.keys(progress.notes).filter((id) => !progress.bookmarks.includes(id)).length;
    return null;
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#start" aria-label={`Zum Lernpfad in ${course.name}`}>
          <span className="brand-mark" aria-hidden="true">{course.name.trim().slice(0, 1).toLocaleUpperCase("de")}</span>
          <span>{course.name}<span className="brand-light"> Study Space</span></span>
        </a>

        <div className="sidebar-course-actions">
          <button className="mode-link course-switch-link" onClick={onBack}><span aria-hidden="true">←</span> Alle Fächer</button>
        </div>
        <div className="sidebar-label">{course.name} · Lernbereich</div>
        <div className="sidebar-navigation-scroll">
          <nav className="mode-nav" aria-label="Hauptnavigation">
            {NAVIGATION.map((item) => item.kind === "link" ? (
              <button
                aria-current={activeSection === item.id ? "page" : undefined}
                className={activeSection === item.id ? "mode-link active" : "mode-link"}
                key={item.id}
                onClick={() => changeView(item.view)}
                type="button"
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === "progress" && view === "history" && <span className="nav-context">Lernverlauf</span>}
              </button>
            ) : (
              <div className="nav-group" key={item.id}>
                <button
                  aria-controls={`nav-group-${item.id}`}
                  aria-expanded={Boolean(openGroups[item.id])}
                  aria-current={activeGroup === item.id ? "true" : undefined}
                  aria-label={item.id === "review"
                    ? `${item.label}: ${dueItems.length} fällige gesamt, davon ${overdueCount} überfällig`
                    : item.label}
                  className={`mode-link nav-group-toggle${activeGroup === item.id ? " active" : ""}`}
                  onClick={() => setOpenGroups((previous) => ({
                    ...previous,
                    [item.id]: !previous[item.id],
                  }))}
                  type="button"
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === "review" && <span className="nav-count" aria-hidden="true">{dueItems.length}</span>}
                  <span className="nav-chevron" aria-hidden="true">{openGroups[item.id] ? "⌄" : "›"}</span>
                </button>
                <div className="section-subnav" id={`nav-group-${item.id}`} hidden={!openGroups[item.id]}>
                    {item.items.map(({ view: subview, label }) => {
                      const count = getNavigationCount(subview);
                      return (
                        <button
                          aria-current={activeSubView(subview) ? "page" : undefined}
                          className={activeSubView(subview) ? "section-subnav-link active" : "section-subnav-link"}
                          key={subview}
                          onClick={() => changeView(subview)}
                          type="button"
                        >
                          <span>{label}</span>
                          {count !== null && <span className="nav-count" aria-label={`${count} Einträge`}>{count}</span>}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="progress-card">
            <div className="progress-card-top"><span>Themen sicher</span><span>{masteredChapters}/{chapters.length}</span></div>
            <div className="progress-track" aria-label={`${masteredChapters} von ${chapters.length} Themen sicher`}>
              <span style={{ width: `${chapters.length ? masteredChapters / chapters.length * 100 : 0}%` }} />
            </div>
            <p>{dueTodayCount} heute · {overdueCount} überfällig</p>
          </div>
          <div className="local-label"><span aria-hidden="true">●</span> Nur auf diesem Gerät</div>
        </div>
      </aside>

      <main className="main-content" id="start">
        <header className="topbar">
          <div className="breadcrumb">{course.name} <span>/</span> <strong>{title}</strong></div>
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <span className="visually-hidden">Lerninhalte suchen</span>
            <input
              ref={searchInput}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Inhalte suchen"
            />
            <kbd aria-hidden="true">/</kbd>
          </label>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">{course.name} · Study Space</div>
            <h1 ref={pageTitle} tabIndex={-1}>{title}</h1>
            <p className="subtitle">
              {view === "overview" && "Heute fällige Inhalte, Lernpfad und nächste sinnvolle Aktion."}
              {view === "learn" && "Wähle ein Thema und rufe die Inhalte aktiv aus dem Gedächtnis ab."}
              {view === "quiz" && "Beantworte belegte Fragen und erhalte direkt Rückmeldung."}
              {view === "cards" && "Decke Antworten auf und bewerte ehrlich, wie sicher du bist."}
              {view === "review" && "Heute fällige und überfällige Inhalte bearbeiten."}
              {view === "errors" && "Falsch beantwortete und als unsicher markierte Inhalte."}
              {view === "progress" && "Sieh, was du beherrschst und was als Nächstes ansteht."}
              {view === "sessions" && "Stelle eine kurze, passende Lerneinheit zusammen."}
              {view === "examSetup" && "Übe eine Prüfungssituation ohne Einfluss auf deinen Lernstand."}
              {view === "saved" && "Lesezeichen und persönliche Notizen an einem Ort."}
              {view === "history" && "Abgeschlossene Lernsitzungen und Prüfungen im Überblick."}
              {view === "importContent" && "Ein extern erstelltes, belegtes JSON-Lernpaket prüfen und übernehmen."}
              {view === "studySession" && "Deine Sitzung und ihr Fortschritt."}
              {view === "studySummary" && "Zusammenfassung deiner abgeschlossenen Lerneinheit."}
              {view === "exam" && "Bearbeite alle Fragen und gib die Prüfung am Ende ab."}
            </p>
          </div>
          {["learn", "quiz", "cards", "review", "errors", "studySession", "exam"].includes(view) && (
            <div className="session-count" role="status" aria-live="polite" aria-atomic="true">
              <span className="visually-hidden">Frage </span>
              <span className="count-number">{activeListLength ? activeIndex + 1 : 0}</span>
              <span className="count-divider">/</span>
              <span>{isSessionView ? sessionItems.length : view === "review" || view === "errors" ? visibleReviewItems.length : visibleQuestions.length}</span>
            </div>
          )}
        </section>

        {saveWarning && <div className="save-warning" role="alert">Die letzte Änderung wurde nicht übernommen, weil sie nicht lokal gespeichert werden konnte. Der vorherige Lernstand blieb erhalten. Exportiere zur Sicherheit eine Sicherung und prüfe den verfügbaren Browser-Speicher.</div>}
        <span className="visually-hidden" role="status" aria-live="polite">{announcement}</span>

        {view === "overview" && (
          <>
            <section className="overview-stats" aria-label="Lernfortschritt auf einen Blick">
              <article className="stat-card"><span>Heute fällig</span><strong>{dueTodayCount}</strong><small>Fälligkeit am heutigen Kalendertag</small></article>
              <article className="stat-card"><span>Überfällig</span><strong>{overdueCount}</strong><small>vor dem heutigen Datum fällig</small></article>
            </section>
            <section className="next-step-panel">
              <div><span className="eyebrow">Nächster Schritt</span><h2>{nextStep.title}</h2>
                {resumableSession && <p>{resumableSession.type === "study" ? "Eine Lernsitzung ist noch offen." : "Eine Prüfungssimulation ist noch offen."}</p>}
              </div>
              {nextStep.action && <button className="button reveal-button" onClick={nextStep.run}>{nextStep.action} <span aria-hidden="true">→</span></button>}
            </section>
            <section className="section-heading">
              <div><span className="eyebrow">Dein Lernpfad</span><h2>Themen dieses Fachs</h2></div>
              <span className="section-count">{usableQuestions.length} belegte Fragen</span>
            </section>
            <div className="topic-grid">
              {chapterCatalog.length === 0 ? (
                <section className="empty-panel course-topic-empty">
                  <h2>Noch keine Kapitel hinterlegt</h2>
                  <p>Importiere ein geprüftes JSON-Lernpaket, um die vom Inhaltsersteller angegebenen Kapitel und Lernziele anzulegen.</p>
                  <button className="button secondary" onClick={() => changeView("importContent")}>Lernpaket prüfen</button>
                </section>
              ) : chapterCatalog.filter((chapter) =>
                !normalizedSearch
                || chapter.title.toLocaleLowerCase("de").includes(normalizedSearch)
                || topicQuestions(chapter).length > 0,
              ).map((chapter) => {
                const items = topicQuestions(chapter);
                const mastered = items.filter((question) =>
                  scheduleModes(question).some((mode) => isKnown(question, mode)),
                ).length;
                const sections = [...new Map(items.map((question) => [
                  sectionKeyForQuestion(question),
                  sectionLabelForQuestion(question),
                ] as const))];
                return (
                  <article className="topic-card" key={chapter.id ?? chapter.number}>
                    <div className="topic-card-top">
                      <span className="tag">Themenbereich {chapter.number}</span>
                      <span className="topic-progress-label">{mastered}/{items.length} sicher</span>
                    </div>
                    <h3>{chapter.title}</h3>
                    {items.length > 0 ? (
                      <>
                        <p>{items.length} belegte Lernziele · {mastered} mehrfach sicher erinnert</p>
                        <div className="topic-progress" role="progressbar" aria-label={`${chapter.title}: ${mastered} von ${items.length} Lernzielen sicher`} aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={mastered}>
                          <span style={{ width: `${mastered / items.length * 100}%` }} />
                        </div>
                        <ul className="section-progress-list">
                          {sections.map(([sectionKey, sectionLabel]) => {
                            const sectionQuestions = items.filter((question) => sectionKeyForQuestion(question) === sectionKey);
                            const sectionMastered = sectionQuestions.filter((question) =>
                              scheduleModes(question).some((mode) => isKnown(question, mode)),
                            ).length;
                            return <li key={sectionKey}><span>{sectionLabel}</span><span>{sectionMastered}/{sectionQuestions.length} sicher</span></li>;
                          })}
                        </ul>
                      </>
                    ) : (
                      <p className="topic-empty-note">Noch nicht mit belegten Lerninhalten aus dem Foliensatz gefüllt.</p>
                    )}
                    <div className="topic-card-footer">
                      <span>{items.length ? `${sections.length} Abschnitte` : "Noch keine Fragen für dieses Kapitel"}</span>
                      <button className="button secondary" onClick={() => openTopic(chapter.id ?? chapter.title)}>Kapitel ansehen <span aria-hidden="true">→</span></button>
                    </div>
                  </article>
                );
              })}
            </div>
            {visibleUnassignedQuestions.length > 0 && (
              <section className="empty-panel" aria-labelledby="unassigned-topic-title">
                <span className="eyebrow">Kapitelzuordnung offen</span>
                <h2 id="unassigned-topic-title">Nicht eindeutig zugeordnet</h2>
                <p>{visibleUnassignedQuestions.length} Lerninhalte konnten keinem Kapitel sicher zugeordnet werden. Sie bleiben erhalten und können hier gezielt gelernt werden; es wurde keine Zuordnung anhand einer möglicherweise veralteten Kapitelnummer erfunden.</p>
                <button className="button secondary" onClick={() => openTopic(unassignedTopic)}>Lerninhalte anzeigen <span aria-hidden="true">→</span></button>
              </section>
            )}
            {normalizedSearch && chapterCatalog.every((chapter) =>
              !chapter.title.toLocaleLowerCase("de").includes(normalizedSearch) && topicQuestions(chapter).length === 0,
            ) && <section className="empty-panel"><h2>Keine Treffer</h2><p>Ändere den Suchbegriff, um Kapitel oder Lerninhalte anzuzeigen.</p></section>}

            {content.transferTask && (
              <section className="transfer-note" aria-labelledby="transfer-title">
                <span className="eyebrow">Prüfhinweis · Folie {content.transferTask.sourceSlide}</span>
                <div className="transfer-title-row"><h2 id="transfer-title">{content.transferTask.title}</h2><span className="tag tag-due">Annahme geändert</span></div>
                <p>{content.transferTask.note}</p>
                <div className="transfer-assumptions">
                  <div><strong>Genau 3.000 € einsetzen</strong><span>Alternative C – laut deiner Beschreibung die auf Folie 45 genannte Lösung; am Original noch zu prüfen.</span></div>
                  <div><strong>Budgetobergrenze 3.000 €, Rest darf ungenutzt bleiben</strong><span>Alternative F – laut deiner Beschreibung mehr Output unter dieser geänderten Annahme; am Original noch zu prüfen.</span></div>
                </div>
                <p className="source-pending">Der Foliensatz fehlt im Projekt. Dieser Hinweis ist nicht als verifizierter Folieninhalt oder Quizlösung freigegeben.</p>
              </section>
            )}
            <section className="goal-summary" aria-labelledby="goal-summary-title">
              <div>
                <span className="eyebrow">Dein Tagesziel</span>
                <h2 id="goal-summary-title">{progress.dailyGoal.enabled ? `${progress.dailyGoal.target} ${progress.dailyGoal.type === "questions" ? "Fragen" : "Minuten"} pro Tag` : "Optional – du entscheidest"}</h2>
                {!progress.dailyGoal.enabled
                  ? <p>Aktiviere bei Bedarf ein persönliches Ziel in der Fortschrittsansicht.</p>
                  : goalProgress.hasActivity
                  ? <p>Heute: {Math.min(goalProgress.value, goalProgress.target)} von {goalProgress.target} {progress.dailyGoal.type === "questions" ? "Fragen" : "Minuten"} aus abgeschlossenen Lernsitzungen.</p>
                  : <p>Noch keine abgeschlossene Lernsitzung heute. Es wird kein Fortschritt vorgetäuscht.</p>}
                {progress.dailyGoal.enabled && goalProgress.hasActivity && <div className="goal-track" role="progressbar" aria-label="Fortschritt zum Tagesziel" aria-valuemin={0} aria-valuemax={goalProgress.target} aria-valuenow={Math.min(goalProgress.value, goalProgress.target)}><span style={{ width: `${Math.min(100, goalProgress.value / goalProgress.target * 100)}%` }} /></div>}
              </div>
              <button className="button secondary" onClick={() => changeView("progress")}>Tagesziel einstellen</button>
            </section>
          </>
        )}

        {reminderNotice && <p className="reminder-notice" role="status">{reminderNotice}</p>}

        {view === "sessions" && (
          <section className="setup-layout">
            {resumableSession && (
              <section className="setup-card resume-card">
                <div><span className="eyebrow">Offene Sitzung</span><h2>{resumableSession.type === "study" ? "Lernsitzung fortsetzen" : "Prüfung fortsetzen"}</h2><p>Deine letzte Sitzung wurde lokal gespeichert.</p></div>
                <button className="button reveal-button" onClick={() => changeView(resumableSession.type === "study" ? "studySession" : "exam")}>Fortsetzen</button>
              </section>
            )}
            <section className="setup-card">
              <div><span className="eyebrow">Kurze Lerneinheit</span><h2>Sitzung einrichten</h2>              <p>Fällige Wiederholungen kommen zuerst. Optional mischt die Sitzung bereits gelernte Fragen nach Kapitel und Abschnitt ein.</p></div>
              {usableQuestions.length === 0 ? (
                <div className="empty-panel compact-empty"><h3>Noch keine belegten Fragen</h3><p>Die Sitzungsoptionen werden aktiv, sobald geprüfte Inhalte mit Quelle verfügbar sind.</p></div>
              ) : (
                <>
                  <fieldset className="choice-group">
                    <legend>Lernmodi</legend>
                    {(["lernen", "karten", "quiz"] as LearningMode[]).map((mode) => {
                      const available = usableQuestions.some((question) => mode === "quiz" ? question.kind === "quiz" : question.kind === "flashcard");
                      const checked = progress.sessionPreferences.modes.includes(mode);
                      return <label className="check-option" key={mode}><input type="checkbox" checked={checked} disabled={!available || (checked && progress.sessionPreferences.modes.length === 1)} onChange={() => updateSessionPreferences({ modes: checked ? progress.sessionPreferences.modes.filter((value) => value !== mode) : [...progress.sessionPreferences.modes, mode] })} /><span>{modeLabels[mode]}</span></label>;
                    })}
                  </fieldset>
                  <fieldset className="choice-group">
                    <legend>Themen</legend>
                    {availableTopics.length ? availableTopics.map((topic) => {
                      const selected = selectedChapterIds(progress.sessionPreferences.topics).includes(topic.id ?? "");
                      return <label className="check-option" key={topic.id ?? topic.number}><input type="checkbox" checked={selected} onChange={() => updateSessionPreferences({ topics: selected ? selectedChapterIds(progress.sessionPreferences.topics).filter((id) => id !== topic.id) : [...selectedChapterIds(progress.sessionPreferences.topics), topic.id ?? topic.title] })} /><span>{topic.number}. {topic.title}</span></label>;
                    }) : <p>Für die vorhandenen Fragen ist noch kein geprüftes Thema zugeordnet.</p>}
                    {progress.sessionPreferences.topics.length > 0 && <button className="button secondary" onClick={() => updateSessionPreferences({ topics: [] })}>Alle Themen verwenden</button>}
                  </fieldset>
                  <fieldset className="choice-group limit-choice"><legend>Umfang festlegen</legend>
                    <label className="check-option"><input type="radio" name="session-limit" checked={progress.sessionPreferences.durationMinutes === null} onChange={() => updateSessionPreferences({ durationMinutes: null })} /><span>Nach Fragenzahl</span></label>
                    <label className="check-option"><input type="radio" name="session-limit" checked={progress.sessionPreferences.durationMinutes !== null} onChange={() => updateSessionPreferences({ durationMinutes: progress.sessionPreferences.durationMinutes ?? 10 })} /><span>Nach Zeit</span></label>
                  </fieldset>
                  {progress.sessionPreferences.durationMinutes === null
                    ? <label className="field-label">Anzahl Fragen<input type="number" min="1" max="100" value={progress.sessionPreferences.questionCount} onChange={(event) => updateSessionPreferences({ questionCount: Math.max(1, Math.min(100, Number(event.target.value) || 1)) })} /></label>
                    : <label className="field-label">Zeitlimit in Minuten<input type="number" min="1" max="240" value={progress.sessionPreferences.durationMinutes} onChange={(event) => updateSessionPreferences({ durationMinutes: Math.max(1, Math.min(240, Number(event.target.value) || 1)) })} /></label>}
                  <p className="setup-hint">Bei einem Zeitlimit endet die Sitzung automatisch nach der gewählten Zeit; die Fragezahl wird dann durch verfügbare Inhalte begrenzt.</p>
                  <label className="check-option"><input type="checkbox" checked={progress.sessionPreferences.includeWeak} onChange={(event) => updateSessionPreferences({ includeWeak: event.target.checked })} /><span>Schwächere Bereiche zusätzlich priorisieren</span></label>
                  <label className="check-option"><input type="checkbox" checked={progress.sessionPreferences.mixedReview} onChange={(event) => updateSessionPreferences({ mixedReview: event.target.checked })} /><span>Fällige Wiederholungen mit bereits zweimal sicher erinnerten Fragen mischen</span></label>
                  {progress.sessionPreferences.mixedReview && <p className="setup-hint">Fällige Fragen bleiben zuerst. Danach werden gelernte Fragen aus den gewählten Themen und Abschnitten verteilt eingestreut.</p>}
                  <p className="setup-availability">{sessionCandidateCount} passende Fragen in der Auswahl.</p>
                  <button className="button reveal-button" disabled={!sessionCandidateCount || !progress.sessionPreferences.modes.length || Boolean(unfinishedSession && !unfinishedSession.submitted)} onClick={() => startStudySession()}>Lernsitzung starten</button>
                </>
              )}
            </section>
            <section className="shortcut-panel" aria-labelledby="shortcut-title"><h2 id="shortcut-title">Tastaturkürzel</h2><p><kbd>/</kbd> Suche · <kbd>Leertaste</kbd> Erklärung aufdecken · <kbd>←</kbd>/<kbd>→</kbd> Frage wechseln · <kbd>1</kbd> sicher · <kbd>2</kbd> unsicher · <kbd>3</kbd> noch einmal</p></section>
          </section>
        )}

        {view === "examSetup" && (
          <section className="setup-layout">
            <section className="setup-card">
              <div><span className="eyebrow">Ohne Lernstandswertung</span><h2>Prüfungssimulation einrichten</h2><p>Richtige Lösungen und Erklärungen bleiben bis zur Abgabe verborgen. Prüfungsergebnisse verändern keine Wiederholungspläne.</p></div>
              {examCandidateCount === 0 ? (
                <div className="empty-panel compact-empty"><h3>Keine geeigneten Quizfragen</h3><p>Für eine Prüfung werden belegte Multiple-Choice-Fragen mit geprüfter Lösung benötigt.</p></div>
              ) : (
                <>
                  <fieldset className="choice-group"><legend>Themen</legend>
                    {availableTopics.map((topic) => {
                      const selected = selectedChapterIds(progress.sessionPreferences.examTopics).includes(topic.id ?? "");
                      return <label className="check-option" key={topic.id ?? topic.number}><input type="checkbox" checked={selected} onChange={() => updateSessionPreferences({ examTopics: selected ? selectedChapterIds(progress.sessionPreferences.examTopics).filter((id) => id !== topic.id) : [...selectedChapterIds(progress.sessionPreferences.examTopics), topic.id ?? topic.title] })} /><span>{topic.number}. {topic.title}</span></label>;
                    })}
                    {progress.sessionPreferences.examTopics.length > 0 && <button className="button secondary" onClick={() => updateSessionPreferences({ examTopics: [] })}>Alle Themen verwenden</button>}
                  </fieldset>
                  <div className="setup-fields">
                    <label className="field-label">Fragen<input type="number" min="1" max={examCandidateCount} value={progress.sessionPreferences.examCount} onChange={(event) => updateSessionPreferences({ examCount: Math.max(1, Math.min(100, Number(event.target.value) || 1)) })} /></label>
                    <label className="field-label">Zeitlimit (optional, Minuten)<input type="number" min="1" max="240" placeholder="Kein Zeitlimit" value={progress.sessionPreferences.examDurationMinutes ?? ""} onChange={(event) => updateSessionPreferences({ examDurationMinutes: event.target.value ? Math.max(1, Math.min(240, Number(event.target.value) || 1)) : null })} /></label>
                  </div>
                  <p className="setup-availability">{Math.min(examCandidateCount, progress.sessionPreferences.examCount)} zufällig ausgewählte Fragen.</p>
                  <button className="button reveal-button" disabled={Boolean(unfinishedSession && !unfinishedSession.submitted)} onClick={() => startExam()}>Prüfung starten</button>
                </>
              )}
            </section>
          </section>
        )}

        {view === "saved" && (
          <section className="saved-list">
            {!hasSavedItems ? (
              <section className="empty-panel"><h2>Noch nichts gespeichert</h2><p>Setze bei einer belegten Frage ein Lesezeichen oder füge eine persönliche Notiz hinzu. Deine gespeicherten Inhalte erscheinen hier.</p></section>
            ) : savedQuestions.length === 0 ? (
              <section className="empty-panel"><h2>Keine passenden gespeicherten Inhalte</h2><p>Ändere Suche oder Filter, um gespeicherte Fragen zu finden.</p></section>
            ) : savedQuestions.map((question) => (
              <article className="saved-card" key={question.id}>
                <div className="question-tags"><span className="tag">{chapterForQuestion(question) || question.chapter}</span><span className="tag">{question.kind === "quiz" ? "Quizfrage" : "Lernkarte"}</span></div>
                <h2>{question.prompt}</h2><SourceNote question={question} />
                <label className="field-label">Persönliche Notiz<textarea rows={3} maxLength={10000} value={progress.notes[question.id] ?? ""} onChange={(event) => {
                  const value = event.target.value;
                  setProgress((previous) => {
                    const notes = { ...previous.notes };
                    if (value.trim()) notes[question.id] = value;
                    else delete notes[question.id];
                    return { ...previous, notes };
                  });
                }} /></label>
                <div className="data-actions">
                  {progress.bookmarks.includes(question.id) && <button className="button secondary" onClick={() => toggleBookmark(question.id)}>Lesezeichen entfernen</button>}
                  {progress.notes[question.id] && <button className="button secondary" onClick={() => saveNote(question.id, "")}>Notiz löschen</button>}
                </div>
              </article>
            ))}
          </section>
        )}

        {view === "history" && (
          <section className="history-layout">
            <div className="overview-stats">
              <article className="stat-card"><span>Diese Woche</span><strong>{historySummary.week.sessions}</strong><small>{historySummary.week.questions} Fragen · {historySummary.week.minutes} Minuten</small></article>
              <article className="stat-card"><span>Dieser Monat</span><strong>{historySummary.month.sessions}</strong><small>{historySummary.month.questions} Fragen · {historySummary.month.minutes} Minuten</small></article>
              <article className="stat-card"><span>Prüfungen im Monat</span><strong>{historySummary.month.exams}</strong><small>Ergebnis getrennt vom Lernstand</small></article>
            </div>
            {progress.history.length === 0 ? <section className="empty-panel"><h2>Noch keine abgeschlossenen Sitzungen</h2><p>Abgeschlossene Lern- und Prüfungssitzungen werden hier lokal gespeichert. Eine begonnene, nicht abgeschlossene Sitzung zählt noch nicht als Aktivität.</p></section> : (
              <ol className="history-list">{[...progress.history].reverse().map((entry) => (
                <li key={entry.id}><div><strong>{entry.type === "exam" ? "Prüfungssimulation" : "Lernsitzung"}</strong><span>{entry.date} · {Math.floor(entry.durationSeconds / 60)} Min. · {entry.attempted}/{entry.questionIds.length} beantwortet</span></div><span className="history-result">{entry.correct}/{entry.questionIds.length} richtig</span></li>
              ))}</ol>
            )}
            <p className="schedule-explanation">Die letzten 100 Sitzungen bleiben in deinem lokalen Lernstand. Prüfungsergebnisse zeigen nur die Leistung in dieser Sitzung und verändern weder Wiederholungspläne noch Beherrschung.</p>
          </section>
        )}

        {(view === "learn" && chapterFilter !== "Alle Themen") && (
          <section className="chapter-focus">
            <span className="eyebrow">{chapterFilter === unassignedTopic ? "Kapitelzuordnung offen" : "Kapitelansicht"}</span>
            <h2>{chapterFilter === unassignedTopic
              ? "Nicht eindeutig zugeordnet"
              : chapterCatalog.find((chapter) => chapter.id === chapterFilter)?.title ?? chapterFilter}</h2>
            <p>{chapterFilter === unassignedTopic
              ? "Diese erhaltenen Lerninhalte haben keine sichere Kapitel-ID. Ähnliche oder doppelte Kapitelnamen und frühere Kapitelnummern reichen nicht für eine verlässliche Zuordnung."
              : usableQuestions.some((question) => chapterIdForQuestion(question) === chapterFilter)
              ? "Die folgenden Lernziele, Zusammenfassungen und Begriffe stammen ausschließlich aus belegten Einträgen. Die Folienangaben erscheinen direkt an der Frage."
              : `Für ${chapterCatalog.find((chapter) => chapter.id === chapterFilter)?.title ?? chapterFilter} liegen noch keine am Original-Foliensatz geprüften Lernziele oder Zusammenfassungen vor. Prüfe Kapitelname und Foliengliederung an der Originalquelle außerhalb der App.`}</p>
          </section>
        )}

        {view === "studySession" && currentQuestion && unfinishedSession?.type === "study" && !unfinishedSession.submitted && (
          <section className="question-card" aria-labelledby="question-title">
            <div className="question-card-top"><div className="question-tags"><span className="tag tag-kind">{modeLabels[currentSessionEntry?.item.mode ?? "lernen"]}</span><span className="tag">{chapterForQuestion(currentQuestion) || currentQuestion.chapter}</span></div><span className="question-id">{activeIndex + 1} / {sessionItems.length}</span></div>
            <div className="question-body"><div className="question-overline">Lernsitzung{activeSessionTimerSeconds !== null ? ` · ${Math.floor(activeSessionTimerSeconds / 60)}:${String(activeSessionTimerSeconds % 60).padStart(2, "0")} verbleibend` : ""}</div><h2 ref={questionTitle} id="question-title" tabIndex={-1}>{currentQuestion.prompt}</h2><SourceNote question={currentQuestion} />{currentQuestion.uncertain && <p className="uncertain-note">Dieser Inhalt ist als unsicher oder schlecht lesbar markiert. Prüfe die angegebene Originalquelle, bevor du dich darauf verlässt.</p>}</div>
            {currentQuestion.kind === "quiz" ? (
              <>
              <ConfidencePicker id={`${currentQuestion.id}-${currentMode}`} value={confidence} onChange={setConfidence} />
              <div className="quiz-options" role="group" aria-label="Antwortoptionen">
                {currentQuestion.options!.map((option, index) => <button className={`option-button ${selectedOption === index ? (selectedOption === currentQuestion.correctOption ? "correct" : "incorrect") : ""}`} key={`${currentQuestion.id}-${index}`} disabled={selectedOption !== null} onClick={() => answerQuiz(currentQuestion, index)}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}
                {selectedOption !== null && <div className={selectedOption === currentQuestion.correctOption ? "feedback feedback-correct" : "feedback feedback-incorrect"}><strong role="status" aria-live="polite">{selectedOption === currentQuestion.correctOption ? "Richtig beantwortet." : `Noch nicht richtig. Erneute Wiederholung ${dueLabel(progress.reviews[reviewKey("quiz", currentQuestion.id)]?.dueDate ?? today, today).toLocaleLowerCase("de")}.`}</strong><p>Richtige Antwort: {currentQuestion.options?.[currentQuestion.correctOption ?? -1]}</p>{confidence === "hoch" && selectedOption !== currentQuestion.correctOption && <p>Du warst dir vorher sehr sicher und lagst trotzdem falsch. Diese Kombination ist für die gezielte Nachbereitung markiert.</p>}{currentQuestion.explanation && <p>{currentQuestion.explanation}</p>}<SourceNote question={currentQuestion} /><button className="button secondary next-button" onClick={() => moveNext()}>{activeIndex + 1 === sessionItems.length ? "Sitzung abschließen" : "Nächste Frage"} <span aria-hidden="true">→</span></button></div>}
              </div>
              </>
            ) : (
              <div className="answer-area">
                {!answerOpen ? <><ConfidencePicker id={`${currentQuestion.id}-${currentMode}`} value={confidence} onChange={setConfidence} /><label className="field-label own-explanation">Deine Erklärung vor dem Aufdecken<textarea rows={3} maxLength={3000} value={ownExplanation} onChange={(event) => setOwnExplanation(event.target.value)} placeholder="Optional: Erkläre das Lernziel in eigenen Worten." /><small>Wird nicht automatisch bewertet oder dauerhaft gespeichert.</small></label><button className="button reveal-button" onClick={() => setAnswerOpen(true)}>Erklärung aufdecken</button></> : <div className="answer-reveal" aria-live="polite"><div className="answer-label">Erklärung</div>{ownExplanation.trim() && <div className="self-explanation-compare"><strong>Deine Erklärung</strong><p>{ownExplanation}</p></div>}{currentQuestion.shortExplanation && <p>{currentQuestion.shortExplanation}</p>}{currentQuestion.answer && <p>{currentQuestion.answer}</p>}{currentQuestion.keyTerms?.length ? <div className="detail-list"><strong>Wichtige Begriffe</strong><ul>{currentQuestion.keyTerms.map((term) => <li key={term}>{term}</li>)}</ul></div> : null}<SourceNote question={currentQuestion} /></div>}
                {answerOpen && <div className="self-rating"><span>Wie konntest du es erklären? Die Sicherheitseinschätzung bleibt getrennt davon.</span><div className="rating-buttons"><button className="button known-button" onClick={() => recordReview(currentQuestion, "sicher", currentMode)}>Sicher</button><button className="button unsure-button" onClick={() => recordReview(currentQuestion, "unsicher", currentMode)}>Unsicher</button><button className="button wrong-button" onClick={() => recordReview(currentQuestion, "noch einmal", currentMode)}>Noch einmal</button></div></div>}
              </div>
            )}
            <div className="card-footer"><span>{activeIndex + 1} von {sessionItems.length} Fragen · Nur Bewertungen zählen als Lernstand.</span><div className="step-controls"><button className="button secondary" onClick={() => moveNext()}>{activeIndex + 1 === sessionItems.length ? "Sitzung beenden" : "Überspringen"}</button><button className="button wrong-button" onClick={finishStudySession}>Zusammenfassung</button><button className="button secondary" onClick={abandonSession}>Abbrechen</button></div></div>
          </section>
        )}

        {view === "exam" && unfinishedSession?.type === "exam" && !unfinishedSession.submitted && currentQuestion && (
          <section className="question-card" aria-labelledby="question-title">
            <div className="question-card-top"><div className="question-tags"><span className="tag tag-kind">Prüfung · Ergebnis verborgen</span><span className="tag">{chapterForQuestion(currentQuestion) || currentQuestion.chapter}</span></div><span className="question-id">{activeIndex + 1} / {sessionItems.length}</span></div>
            <div className="question-body"><div className="question-overline">{activeSessionTimerSeconds !== null ? `Verbleibend ${Math.floor(activeSessionTimerSeconds / 60)}:${String(activeSessionTimerSeconds % 60).padStart(2, "0")}` : "Keine Zeitbegrenzung"}</div><h2 ref={questionTitle} id="question-title" tabIndex={-1}>{currentQuestion.prompt}</h2><SourceNote question={currentQuestion} /></div>
            <div className="quiz-options" role="group" aria-label="Antwortoptionen">
              {currentQuestion.options!.map((option, index) => {
                const answer = unfinishedSession.answers[currentQuestion.id];
                return <button className="option-button" key={`${currentQuestion.id}-${index}`} aria-pressed={answer?.selectedOption === index} disabled={Boolean(answer)} onClick={() => answerExam(currentQuestion, index)}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{answer?.selectedOption === index && <span className="tag">Ausgewählt</span>}</button>;
              })}
            </div>
            <div className="card-footer"><span>{Object.keys(unfinishedSession.answers).length} von {sessionItems.length} Antworten gespeichert. Lösungen werden erst nach Abgabe angezeigt.</span><div className="step-controls"><button className="icon-button" aria-label="Vorherige Prüfungsfrage" disabled={activeIndex === 0} onClick={movePrevious}>←</button><button className="icon-button" aria-label="Nächste Prüfungsfrage" disabled={activeIndex + 1 >= sessionItems.length} onClick={() => moveNext()}>→</button><button className="button reveal-button" onClick={submitExam}>Prüfung abgeben</button><button className="button secondary" onClick={abandonSession}>Prüfung abbrechen</button></div></div>
          </section>
        )}

        {view === "exam" && unfinishedSession?.type === "exam" && unfinishedSession.submitted && (
          <section className="exam-results">
            {(() => {
              const missed = unfinishedSession.items.filter((item) => !unfinishedSession.answers[item.questionId]?.isCorrect);
              const correct = Object.values(unfinishedSession.answers).filter((answer) => answer.isCorrect).length;
              return <>
                <div className="setup-card"><span className="eyebrow">Prüfung abgeschlossen</span><h2 ref={emptyStateTitle} tabIndex={-1}>{correct} von {unfinishedSession.items.length} richtig</h2><p>{Object.keys(unfinishedSession.answers).length} von {unfinishedSession.items.length} Fragen beantwortet. Diese Auswertung verändert deinen Lernstand und Wiederholungspläne nicht.</p></div>
                {missed.length ? <><h2>Fragen zur Nachbereitung</h2>{missed.map((item) => {
                  const question = usableQuestions.find((candidate) => candidate.id === item.questionId);
                  if (!question) return null;
                  const answer = unfinishedSession.answers[item.questionId];
                  return <article className="saved-card" key={item.questionId}><h3>{question.prompt}</h3><p>Deine Antwort: {answer ? question.options?.[answer.selectedOption] : "Nicht beantwortet"}</p><p>Richtige Antwort: {question.options?.[question.correctOption ?? -1]}</p>{question.explanation && <p>{question.explanation}</p>}<SourceNote question={question} /></article>;
                })}<button className="button reveal-button" onClick={() => startExam(missed.map((item) => item.questionId), true)}>Verfehlte Fragen erneut prüfen</button></> : <p className="schedule-explanation">Keine verfehlten Fragen. Gut gemacht.</p>}
                <button className="button secondary" onClick={() => { if (setProgress(abandonUnfinishedSession)) setView("overview"); }}>Zum Lernpfad</button>
              </>;
            })()}
          </section>
        )}

        {view === "studySummary" && completedSummary && (
          <section className="history-layout" aria-labelledby="study-summary-title">
            <section className="setup-card">
              <span className="eyebrow">Lernsitzung abgeschlossen</span>
              <h2 ref={emptyStateTitle} id="study-summary-title" tabIndex={-1}>{completedSummary.correct} von {completedSummary.attempted} beantworteten Fragen richtig oder sicher erinnert</h2>
              <p>{completedSummary.attempted} Fragen bearbeitet · {Math.floor(completedSummary.durationSeconds / 60)} Minuten · {completedSummary.date}</p>
              <p>Nur beantwortete oder bewertete Fragen zählen. Das bloße Anzeigen einer Frage wurde nicht als Beherrschung gewertet.</p>
            </section>
            {completedSummary.missedIds.length > 0 ? (
              <section className="saved-list" aria-label="Fragen zur Nachbereitung">
                <h2>Zur Nachbereitung</h2>
                {completedSummary.missedIds.map((id) => {
                  const question = usableQuestions.find((candidate) => candidate.id === id);
                  return question ? <article className="saved-card" key={id}><h3>{question.prompt}</h3><SourceNote question={question} /></article> : null;
                })}
              </section>
            ) : <p className="schedule-explanation">Keine falschen Antworten in dieser Sitzung. Weiterlernen kannst du jederzeit.</p>}
            <div className="data-actions">
              <button className="button reveal-button" onClick={() => changeView("sessions")}>Weitere Sitzung planen</button>
              {completedSummary.missedIds.length > 0 && <button className="button secondary" onClick={() => changeView("errors")}>Fehlerliste öffnen</button>}
              <button className="button secondary" onClick={() => changeView("history")}>Lernverlauf</button>
              <button className="button secondary" onClick={() => changeView("overview")}>Zum Lernpfad</button>
            </div>
          </section>
        )}

        {["learn", "quiz", "cards", "review", "errors"].includes(view) && (
          <>
            {(view === "review" || view === "errors") && (
              <section className="overview-stats review-summary" aria-label="Wiederholungsstatus">
                <article className="stat-card"><span>Heute fällig</span><strong>{dueTodayCount}</strong></article>
                <article className="stat-card"><span>Überfällig</span><strong>{overdueCount}</strong></article>
                <article className="stat-card"><span>Später geplant</span><strong>{plannedCount}</strong></article>
                <article className="stat-card"><span>Unsicher / falsch</span><strong>{uncertainItems.length}</strong></article>
              </section>
            )}
            {view === "review" && (
              <p className="schedule-explanation">
                Das einfache lokale Wiederholungsschema nutzt steigende Abstände (1, 3, 7, 14 und anschließend 30 Tage); es ist eine nachvollziehbare Planungshilfe, keine Aussage über ein einzig optimales Schema. Falsche oder unsichere Antworten werden für morgen vorgemerkt. Bei niedriger Sicherheit wird auch eine richtige Antwort bereits nach einem Tag erneut eingeplant.
              </p>
            )}
            <section className="filters" aria-label="Inhalte filtern">
              <label><span>Thema</span><select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)}><option>Alle Themen</option>{chapters.map((chapter) => <option key={chapter.id ?? chapter.number} value={chapter.id ?? chapter.title}>{chapter.number}. {chapter.title}</option>)}{unassignedQuestions.length > 0 && <option value={unassignedTopic}>Nicht eindeutig zugeordnet ({unassignedQuestions.length})</option>}</select></label>
              <label><span>Fragetyp</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Alle Fragetypen</option>{questionTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              <span className="filter-hint">Suche und Filter gelten gemeinsam.</span>
            </section>
            {queueQuizFeedback && (view === "review" || view === "errors") && (
              <section className="queue-feedback" aria-label="Rückmeldung zur vorherigen Quizfrage">
                <span className="eyebrow">Quiz-Rückmeldung</span>
                <h2>{queueQuizFeedback.question.prompt}</h2>
                <p className={queueQuizFeedback.isCorrect ? "feedback-text correct-text" : "feedback-text incorrect-text"} role="status" aria-live="polite" aria-atomic="true">
                  {queueQuizFeedback.isCorrect
                    ? "Richtig beantwortet."
                    : view === "review"
                      ? "Noch nicht richtig. Die nächste Wiederholung ist am folgenden lokalen Kalendertag fällig."
                      : "Noch nicht richtig. Die Frage bleibt zur gezielten Wiederholung in der Fehlerliste."}
                </p>
                {!queueQuizFeedback.isCorrect && (
                  <p>Deine Antwort: {queueQuizFeedback.question.options?.[queueQuizFeedback.selectedOption]}</p>
                )}
                <p>Richtige Antwort: {queueQuizFeedback.question.options?.[queueQuizFeedback.question.correctOption ?? -1]}</p>
                {queueQuizFeedback.question.explanation && <p>{queueQuizFeedback.question.explanation}</p>}
                <SourceNote question={queueQuizFeedback.question} />
                <button className="button secondary" onClick={() => setQueueQuizFeedback(null)}>Rückmeldung schließen</button>
              </section>
            )}
            {((view === "review" || view === "errors") ? visibleReviewItems.length : visibleQuestions.length) === 0 ? (
              <section className="empty-panel" aria-live="polite">
                <div className="empty-symbol" aria-hidden="true">{view === "review" ? "↻" : view === "errors" ? "!" : "⌕"}</div>
                <h2 ref={emptyStateTitle} tabIndex={-1}>{view === "review" ? "Heute ist nichts fällig" : view === "errors" ? "Keine Fehler oder Unsicherheiten" : "Noch keine passenden Lerninhalte"}</h2>
                <p>{usableQuestions.length === 0
                  ? "Hier erscheinen nur importierte, belegte Lerninhalte mit Quellenangabe. Prüfe und importiere ein extern erstelltes JSON-Lernpaket, um zu beginnen."
                  : "Für diese Auswahl gibt es keine passenden Fragen. Ändere Thema oder Fragetyp."}</p>
                {(view === "review" || view === "errors") && <button className="button secondary" onClick={() => changeView(view === "review" ? "errors" : "overview")}>{view === "review" ? "Fehlerliste ansehen" : "Zum Lernpfad"}</button>}
              </section>
            ) : currentQuestion ? (
              <section className="question-card" aria-labelledby="question-title">
                <div className="question-card-top">
                  <div className="question-tags">
                    <span className="tag tag-kind">{currentQuestion.kind === "quiz" ? "Quizfrage" : "Lernkarte"}</span>
                    <span className="tag">{chapterForQuestion(currentQuestion) || currentQuestion.chapter}</span>
                    <span className="tag">{currentQuestion.questionType}</span>
                    {(view === "review" || view === "errors") && <span className="tag">Modus: {modeLabels[currentMode]}</span>}
                    {progress.reviews[reviewKey(currentMode, currentQuestion.id)]?.dueDate <= today && <span className="tag tag-due">Wiederholung fällig</span>}
                    {currentQuestion.kind === "quiz"
                      && progress.reviews[reviewKey(currentMode, currentQuestion.id)]?.confidence === "hoch"
                      && progress.reviews[reviewKey(currentMode, currentQuestion.id)]?.rating !== "sicher"
                      && <span className="tag tag-due">Sehr sicher · falsch</span>}
                  </div>
                  <span className="question-id">FRAGE {String(activeIndex + 1).padStart(2, "0")} / {activeListLength}</span>
                </div>

                <div className="question-body">
                  <div className="question-overline">{view === "review" ? "Heute wiederholen" : view === "errors" ? "Fehlerliste" : view === "learn" ? "Erklär es selbst" : "Deine Frage"}</div>
                  <h2 ref={questionTitle} id="question-title" tabIndex={-1} aria-live="polite" aria-atomic="true">{currentQuestion.prompt}</h2>
                  <SourceNote question={currentQuestion} />
                  {view === "learn" && <p className="learning-prompt">Versuche erst, das Lernziel in eigenen Worten zu erklären. Decke die vorhandene Erklärung erst danach auf.</p>}
                  {currentQuestion.kind === "quiz" && selectedOption === null && <ConfidencePicker id={`${currentQuestion.id}-${currentMode}`} value={confidence} onChange={setConfidence} />}
                  {currentQuestion.kind === "flashcard" && !answerOpen && <><ConfidencePicker id={`${currentQuestion.id}-${currentMode}`} value={confidence} onChange={setConfidence} /><label className="field-label own-explanation">Deine Erklärung vor dem Aufdecken<textarea rows={3} maxLength={3000} value={ownExplanation} onChange={(event) => setOwnExplanation(event.target.value)} placeholder="Optional: Erkläre das Lernziel in eigenen Worten." /><small>Wird nicht automatisch bewertet oder dauerhaft gespeichert.</small></label></>}
                  {currentQuestion.uncertain && <p className="uncertain-note">Dieser Inhalt ist als unsicher oder schlecht lesbar markiert. Prüfe die angegebene Originalquelle, bevor du dich darauf verlässt.</p>}
                  <div className="saved-actions">
                    <button className="button secondary" aria-pressed={progress.bookmarks.includes(currentQuestion.id)} onClick={() => toggleBookmark(currentQuestion.id)}>{progress.bookmarks.includes(currentQuestion.id) ? "★ Gespeichert" : "☆ Merken"}</button>
                  </div>
                  <label className="field-label note-editor">Persönliche Notiz<textarea rows={3} maxLength={10000} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Deine private Notiz zu dieser Frage" /></label>
                  <button className="button secondary note-save" onClick={() => saveNote(currentQuestion.id)}>{noteDraft.trim() ? "Notiz speichern" : "Notiz entfernen"}</button>
                </div>

                {currentQuestion.kind === "quiz" ? (
                  <div className="quiz-options" role="group" aria-label="Antwortoptionen">
                    {currentQuestion.options!.map((option, index) => {
                      const isCorrect = index === currentQuestion.correctOption;
                      const isSelected = selectedOption === index;
                      const optionClass = selectedOption === null
                        ? "option-button"
                        : `option-button ${isCorrect ? "correct" : isSelected ? "incorrect" : "disabled-option"}`;
                      return (
                        <button className={optionClass} key={`${currentQuestion.id}-${option}`} onClick={() => answerQuiz(currentQuestion, index)} disabled={selectedOption !== null}>
                          <span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
                          {selectedOption !== null && isCorrect && <span className="option-result" aria-label="Richtig">✓</span>}
                          {isSelected && !isCorrect && <span className="option-result" aria-label="Deine Auswahl">×</span>}
                        </button>
                      );
                    })}
                    {selectedOption !== null && (
                      <div className={selectedOption === currentQuestion.correctOption ? "feedback feedback-correct" : "feedback feedback-incorrect"}>
                        <strong role="status" aria-live="polite" aria-atomic="true">{selectedOption === currentQuestion.correctOption ? "Richtig beantwortet." : `Noch nicht richtig. Erneute Wiederholung ${dueLabel(progress.reviews[reviewKey("quiz", currentQuestion.id)]?.dueDate ?? today, today).toLocaleLowerCase("de")}.`}</strong>
                        <p>Richtige Antwort: {currentQuestion.options?.[currentQuestion.correctOption ?? -1]}</p>
                        {confidence === "hoch" && selectedOption !== currentQuestion.correctOption && <p>Du warst dir vorher sehr sicher und lagst trotzdem falsch. Diese Kombination wird für die gezielte Nachbereitung markiert.</p>}
                        {currentQuestion.explanation && <p>{currentQuestion.explanation}</p>}
                        <SourceNote question={currentQuestion} />
                        <button className="button secondary next-button" onClick={() => moveNext()}>Nächste Frage <span aria-hidden="true">→</span></button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="answer-area">
                    {answerOpen ? (
                      <div className="answer-reveal" aria-live="polite">
                        <div className="answer-label">Erklärung</div>
                        {ownExplanation.trim() && <div className="self-explanation-compare"><strong>Deine Erklärung</strong><p>{ownExplanation}</p></div>}
                        {currentQuestion.shortExplanation && <p>{currentQuestion.shortExplanation}</p>}
                        {currentQuestion.answer && <p>{currentQuestion.answer}</p>}
                        {currentQuestion.keyTerms && currentQuestion.keyTerms.length > 0 && (
                          <div className="detail-list"><strong>Wichtige Begriffe</strong><ul>{currentQuestion.keyTerms.map((term) => <li key={term}>{term}</li>)}</ul></div>
                        )}
                        {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                          <div className="detail-list"><strong>Beispiele</strong><ul>{currentQuestion.examples.map((example) => <li key={example}>{example}</li>)}</ul></div>
                        )}
                        <SourceNote question={currentQuestion} />
                      </div>
                    ) : (
                      <button className="button reveal-button" onClick={() => setAnswerOpen(true)}>Erklärung aufdecken <span aria-hidden="true">↓</span></button>
                    )}
                    {answerOpen && (
                      <div className="self-rating">
                        <span>Wie konntest du es erklären? Die Sicherheitseinschätzung bleibt getrennt davon.</span>
                        <div className="rating-buttons">
                          <button className="button known-button" onClick={() => recordReview(currentQuestion, "sicher", currentMode)}>Sicher</button>
                          <button className="button unsure-button" onClick={() => recordReview(currentQuestion, "unsicher", currentMode)}>Unsicher</button>
                          <button className="button wrong-button" onClick={() => recordReview(currentQuestion, "noch einmal", currentMode)}>Noch einmal</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="card-footer">
                  <span>{progress.reviews[reviewKey(currentMode, currentQuestion.id)]
                    ? `Nächste Wiederholung: ${dueLabel(progress.reviews[reviewKey(currentMode, currentQuestion.id)].dueDate, today)} · ${progress.reviews[reviewKey(currentMode, currentQuestion.id)].intervalDays} Tage`
                    : "Noch keine Wiederholung erfasst"}</span>
                  <div className="step-controls">
                    <button className="icon-button" aria-label="Vorherige Frage" onClick={movePrevious}>←</button>
                    <button className="icon-button" aria-label="Nächste Frage" onClick={() => moveNext()}>→</button>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}

        {view === "progress" && (
          <>
            <section className="overview-stats" aria-label="Dein Lernfortschritt">
              <article className="stat-card"><span>Beherrschte Inhalte</span><strong>{knownCount}<small> / {usableQuestions.length}</small></strong><small>mindestens zweimal sicher</small></article>
              <article className="stat-card"><span>Richtige Quizantworten</span><strong>{progress.correctAnswers}</strong><small>über alle Sitzungen</small></article>
              <article className="stat-card"><span>Heute fällig</span><strong>{dueTodayCount}</strong><small>am heutigen Kalendertag fällig</small></article>
              <article className="stat-card"><span>Überfällig</span><strong>{overdueCount}</strong><small>vor heute fällig</small></article>
              <article className="stat-card"><span>Später geplant</span><strong>{plannedCount}</strong><small>modusbezogene Wiederholungen</small></article>
              <article className="stat-card"><span>Unsicher / falsch</span><strong>{uncertainItems.length}</strong><small>in der Fehlerliste</small></article>
            </section>
            <section className="next-step-panel progress-guidance" aria-labelledby="progress-guidance-title">
              <div>
                <span className="eyebrow">Nächste sinnvolle Schritte</span>
                <h2 id="progress-guidance-title">Was braucht gerade Übung?</h2>
                {dueItems.length > 0 ? (
                  <p>{dueItems.length} fällige Wiederholungen warten. Beginne damit, bevor du neue Themen vertiefst.</p>
                ) : (
                  <p>Es sind aktuell keine Wiederholungen fällig.</p>
                )}
              </div>
              {dueItems.length > 0 && <button className="button reveal-button" onClick={() => changeView("review")}>Fällige Inhalte öffnen <span aria-hidden="true">→</span></button>}
              {topicAttention.length > 0 ? (
                <ul className="section-progress-list">
                  {topicAttention.slice(0, 3).map((topic) => {
                    const title = topic.topicId === unassignedTopic
                      ? "Nicht eindeutig zugeordnet"
                      : chapterCatalog.find((chapter) => chapter.id === topic.topicId)?.title ?? "Kapitel";
                    const details = [
                      topic.markedForReview ? `${topic.markedForReview} markiert` : "",
                      topic.repeatedMistakes ? `${topic.repeatedMistakes} mehrfach falsch` : "",
                      topic.confidentErrors ? `${topic.confidentErrors} zuletzt selbstsicher falsch` : "",
                    ].filter(Boolean).join(" · ");
                    return (
                      <li key={topic.topicId}>
                        <span><strong>{title}</strong><small>{details}</small></span>
                        <button className="button secondary" onClick={() => openTopic(topic.topicId)}>Üben</button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Noch keine Themen mit markierten oder wiederholt falsch beantworteten Inhalten.</p>
              )}
              {(repeatedMistakeCount > 0 || confidentErrorCount > 0) && (
                <p className="setup-hint">
                  {repeatedMistakeCount > 0 && `${repeatedMistakeCount} Inhalte wurden in mehreren Lernsitzungen falsch beantwortet. `}
                  {confidentErrorCount > 0 && `${confidentErrorCount} zuletzt falsch beantwortete Inhalte waren mit hoher Sicherheit markiert.`}
                </p>
              )}
            </section>
            <div className="progress-history-link">
              <p>Deine abgeschlossenen Lern- und Prüfungssitzungen bleiben vom Beherrschungsstatus getrennt.</p>
              <button className="button secondary" onClick={() => changeView("history")}>Lernverlauf öffnen</button>
            </div>
            <section className="goal-settings" aria-labelledby="goal-settings-title">
              <div><span className="eyebrow">Optionales Tagesziel</span><h2 id="goal-settings-title">Lernen in deinem Tempo</h2><p>Gezählt werden nur abgeschlossene Lernsitzungen; Prüfungssimulationen verändern das Ziel nicht.</p></div>
              <label className="check-option"><input type="checkbox" checked={progress.dailyGoal.enabled} onChange={(event) => updateDailyGoal({ enabled: event.target.checked, reminderEnabled: event.target.checked && progress.dailyGoal.reminderEnabled })} /><span>Persönliches Tagesziel aktivieren</span></label>
              {progress.dailyGoal.enabled && <div className="setup-fields">
                <label className="field-label">Zielart<select value={progress.dailyGoal.type} onChange={(event) => updateDailyGoal({ type: event.target.value as Progress["dailyGoal"]["type"] })}><option value="questions">Fragen</option><option value="minutes">Minuten</option></select></label>
                <label className="field-label">Tagesziel<input type="number" min="1" max="1000" value={progress.dailyGoal.target} onChange={(event) => updateDailyGoal({ target: Math.max(1, Math.min(1000, Number(event.target.value) || 1)) })} /></label>
              </div>}
              {progress.dailyGoal.enabled && <label className="check-option"><input type="checkbox" checked={progress.dailyGoal.reminderEnabled} onChange={(event) => updateDailyGoal({ reminderEnabled: event.target.checked })} /><span>In-App-Erinnerung aktivieren</span></label>}
              {progress.dailyGoal.enabled && <p className="setup-hint">Die Erinnerung erscheint nur, solange die App geöffnet ist. Sie verwendet keine Browser-Benachrichtigungen und läuft nicht im Hintergrund.</p>}
              {progress.dailyGoal.enabled && goalProgress.hasActivity
                ? <p className="goal-progress-text">Heute {Math.min(goalProgress.value, goalProgress.target)} von {goalProgress.target} {progress.dailyGoal.type === "questions" ? "Fragen" : "Minuten"} erreicht.</p>
                : progress.dailyGoal.enabled ? <p className="goal-progress-text">Heute noch keine abgeschlossene Lernsitzung; deshalb wird kein Fortschritt angezeigt.</p> : null}
              {progress.dailyGoal.enabled && goalProgress.hasActivity && <div className="goal-track" role="progressbar" aria-label="Fortschritt zum Tagesziel" aria-valuemin={0} aria-valuemax={goalProgress.target} aria-valuenow={Math.min(goalProgress.value, goalProgress.target)}><span style={{ width: `${Math.min(100, goalProgress.value / goalProgress.target * 100)}%` }} /></div>}
            </section>
            <section className="shortcut-panel" aria-labelledby="shortcut-title-progress"><h2 id="shortcut-title-progress">Tastaturkürzel</h2><p><kbd>/</kbd> Suche · <kbd>Leertaste</kbd> Erklärung aufdecken · <kbd>←</kbd>/<kbd>→</kbd> Frage wechseln · <kbd>1</kbd> sicher · <kbd>2</kbd> unsicher · <kbd>3</kbd> noch einmal</p></section>
            <section className="section-heading"><div><span className="eyebrow">Kapitel und Abschnitte</span><h2>Dein Lernstand</h2></div></section>
            <div className="progress-topic-list">
              {chapterCatalog.map((chapter) => {
                const items = usableQuestions.filter((question) => chapterIdForQuestion(question) === chapter.id);
                const mastered = items.filter((question) =>
                  scheduleModes(question).some((mode) => isKnown(question, mode)),
                ).length;
                const sections = [...new Map(items.map((question) => [
                  sectionKeyForQuestion(question),
                  sectionLabelForQuestion(question),
                ] as const))];
                return (
                  <article className="progress-topic" key={chapter.id ?? chapter.number}>
                    <div className="progress-topic-detail">
                      <h3>{chapter.number}. {chapter.title}</h3>
                      {items.length ? (
                        <>
                          <p>{mastered} von {items.length} Lernzielen zweimal sicher erinnert</p>
                          <ul className="section-progress-list">
                            {sections.map(([sectionKey, sectionLabel]) => {
                              const sectionQuestions = items.filter((question) => sectionKeyForQuestion(question) === sectionKey);
                              const sectionMastered = sectionQuestions.filter((question) =>
                                scheduleModes(question).some((mode) => isKnown(question, mode)),
                              ).length;
                              return <li key={sectionKey}><span>{sectionLabel}</span><span>{sectionMastered}/{sectionQuestions.length} sicher</span></li>;
                            })}
                          </ul>
                        </>
                      ) : <p>Noch keine belegten Lerninhalte hinterlegt.</p>}
                    </div>
                    <div className="topic-progress" role="progressbar" aria-label={`${chapter.title}: ${mastered} von ${items.length} Lernzielen sicher`} aria-valuemin={0} aria-valuemax={items.length || 1} aria-valuenow={mastered}><span style={{ width: `${items.length ? mastered / items.length * 100 : 0}%` }} /></div>
                    <span className="topic-progress-label">{items.length ? `${mastered}/${items.length} sicher` : "Noch leer"}</span>
                  </article>
                );
              })}
              {unassignedQuestions.length > 0 && (
                <article className="progress-topic">
                  <div className="progress-topic-detail">
                    <h3>Nicht eindeutig zugeordnet</h3>
                    <p>{unassignedQuestions.filter((question) =>
                      scheduleModes(question).some((mode) => isKnown(question, mode)),
                    ).length} von {unassignedQuestions.length} Lerninhalten zweimal sicher erinnert</p>
                    <button className="button secondary" onClick={() => openTopic(unassignedTopic)}>Lerninhalte prüfen <span aria-hidden="true">→</span></button>
                  </div>
                </article>
              )}
            </div>
            <section className="next-step-panel">
            <div><span className="eyebrow">Wiederholungsrhythmus</span><h2>Einfache, nachvollziehbare Wiederholungsplanung</h2><p>Sichere Antworten führen zu steigenden lokalen Kalenderabständen; falsche oder unsichere Antworten werden am nächsten Tag wieder fällig. Eine niedrige Sicherheit verkürzt auch bei richtiger Antwort auf einen Tag. Als beherrscht zählen Inhalte erst nach zwei sicheren, fälligen Wiederholungen. Das ist eine praktische Planungshilfe, keine Behauptung eines einzig optimalen Intervalls.</p></div>
              <button className="button secondary" onClick={() => changeView("review")}>Heute wiederholen</button>
            </section>
            <section className="data-tools" aria-labelledby="data-tools-title">
              <div><span className="eyebrow">Sicherung</span><h2 id="data-tools-title">Lernstand übertragen</h2><p>Export und Import verwenden das versionierte JSON-Format. Ein ungültiger Import verändert deinen aktuellen Lernstand nicht.</p></div>
              <div className="data-actions">
                <button className="button secondary" onClick={exportProgress}>JSON exportieren</button>
                <button className="button secondary" onClick={() => importInput.current?.click()}>JSON importieren</button>
                <input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="JSON-Lernstand auswählen" onChange={(event) => void importProgress(event.target.files?.[0])} />
                <button className="button wrong-button" onClick={resetProgress}>Lernstand zurücksetzen</button>
              </div>
              {importMessage && <p className="data-message" role={importError ? "alert" : "status"}>{importMessage}</p>}
            </section>
            <p className="local-storage-notice" role="note">Der Lernstand wird lokal in diesem Browser gespeichert. Browserdaten, privates Surfen oder das Löschen von Website-Daten können ihn entfernen. Exportiere regelmäßig eine JSON-Sicherung.</p>
          </>
        )}

        {view === "importContent" && (
          <section className="content-import-view" aria-labelledby="content-import-title">
            <div className="section-heading"><div><span className="eyebrow">Externe Lerninhalte</span><h2 id="content-import-title">JSON-Lernpaket prüfen</h2></div></div>
            <p className="subtitle">Wähle ein Paket, das außerhalb dieser App erstellt wurde. Es wird erst nach vollständiger Prüfung und deiner Bestätigung gespeichert. Die App nutzt keine KI und lädt nichts hoch.</p>
            <div className="import-drop-row">
              <button className="button secondary" onClick={() => contentInput.current?.click()}>JSON-Paket auswählen</button>
              <span>Format <code>study-space-content</code> · Version 1</span>
              <input ref={contentInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Externes Lernpaket auswählen" onChange={(event) => void inspectContentPackage(event.target.files?.[0])} />
            </div>
            {contentMessage && <p className="data-message" role={contentError ? "alert" : "status"}>{contentMessage}</p>}
            {contentPreview && (
              <section className="package-preview" aria-labelledby="package-preview-title">
                <span className="eyebrow">Vorschau · noch nicht übernommen</span>
                <h3 id="package-preview-title">Paket für {course.name}</h3>
                <div className="overview-stats">
                  <article className="stat-card"><span>Kapitel</span><strong>{contentPreview.chapters.length}</strong></article>
                  <article className="stat-card"><span>Lernkarten</span><strong>{contentPreview.flashcardCount}</strong></article>
                  <article className="stat-card"><span>Quizfragen</span><strong>{contentPreview.quizCount}</strong></article>
                  <article className="stat-card"><span>Quellen</span><strong>{contentPreview.materialNames.length}</strong></article>
                </div>
                <p>{contentPreview.questions.length} belegte Lerninhalte · Quellen: {contentPreview.materialNames.join(", ")}</p>
                <h4>Kapitel</h4>
                <ul className="package-list">{contentPreview.chapters.map((chapter) => <li key={chapter.id}><strong>{chapter.title}</strong>{chapter.sections.length > 0 && <span>{chapter.sections.map((section) => section.title).join(" · ")}</span>}</li>)}</ul>
                <h4>Warnhinweise</h4>
                <ul className="package-list">{contentPreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                <div className="data-actions">
                  <button className="button reveal-button" onClick={confirmContentImport}>Import bestätigen</button>
                  <button className="button secondary" onClick={() => { setContentPreview(null); setContentMessage("Import verworfen. Es wurden keine Inhalte geändert."); }}>Abbrechen</button>
                </div>
              </section>
            )}
            {course.questions.length === 0 && !contentPreview && <section className="empty-panel"><h2>Noch keine Lerninhalte in diesem Fach</h2><p>Nach dem Import bleiben die Lernansichten bis zur Übernahme belegter Einträge leer.</p></section>}
          </section>
        )}

        <footer className="page-footer"><span>Dein Lernstand bleibt in diesem Browser.</span><span>Aktives Fach: {course.name}</span></footer>
      </main>
    </div>
  );
}

export default App;
