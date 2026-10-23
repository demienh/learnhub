# Personal Study Space — AI Showcase

## Zweck und aktueller Stand

Dieses eigenständige Handoff enthält den aktuellen relevanten Quellstand für die externe Code-Review. Es wurden keine fachlichen Fragen oder Beispieldaten ergänzt.

- Stack: React 19, TypeScript 5.7, Vite 6; lokal, ohne Backend, Cloud, Konto, KI-Anbindung oder PWA.
- Hauptnavigation: Übersicht, Lernen, Wiederholen, Prüfung, Inhalte, Fortschritt. Modi und ähnliche Ansichten sind als Unteransichten gruppiert.
- Inhalte stammen ausschließlich aus importierten JSON-Lernpaketen. Leere Fächer bleiben absichtlich leer.
- PDF-Upload, PDF-Verwaltung und IndexedDB-Zugriffe sind entfernt. Bereits früher gespeicherte PDF-Blobs werden nicht gelesen, verändert oder gelöscht; ältere Material-Metadaten bleiben für Migration und Sicherungen erhalten.
- JSON-Pakete können Quellen-Dateiname und Seite ohne lokalen Upload referenzieren. Die Vorschau kennzeichnet sie als im Paket angegebene Quellen.
- Gemischte Lernsitzungen priorisieren Fälliges und mischen optional beherrschte Fragen nach Kapitel/Abschnitt. Lernpläne bleiben pro Modus getrennt; identische Fragen werden in einer Sitzung nicht doppelt eingeplant.
- Sicherheit ist optional und getrennt von Antwortbewertung/Beherrschung. Niedrige Sicherheit verkürzt auch nach richtiger Antwort den nächsten Abstand auf einen Tag.
- `npm test`: 33 Tests bestanden. `npm run build`: TypeScript-Prüfung und Vite-Build erfolgreich.
- Browsercheck: Sechs Hauptbereiche und Unteransichten, absichtliche leere Listenansichten sowie `/`-Fokus der Suche wurden geprüft. Für angefragte Viewport-Einstellungen 360/768/1280 px meldete der Browser Body-Clientbreiten 276/602/1024 px; in den gemessenen Layouts gab es keinen Body-Überlauf.

## Review-Schwerpunkte

Prüfe Navigation und Sichtbarkeit aller vorhandenen Lernmodi, Rückwärtskompatibilität von Lernständen/Backups, vollständige atomare Paketvalidierung, lokale Wiederholungslogik, leere Zustände und Tastaturbedienbarkeit. Keine Lerninhalte erfinden und keine nicht ausgeführten Prüfungen behaupten.

## Eingebettete Projektdateien

### `README.md`

````markdown
# Persönlicher Study Space

Eine lokale Lern-App auf React, TypeScript und Vite. Verwalte mehrere Fächer und importiere belegte Lernkarten und Quizfragen aus einem versionierten JSON-Paket, das außerhalb der App erstellt wurde. Es gibt keine KI-Anbindung, Benutzerkonten, Cloud-Synchronisierung, PDF-Verarbeitung oder Netzwerk-Uploads.

## Lerninhalte und Quellen

Es werden keine Fragen, Antworten, Zusammenfassungen oder Beispiele erzeugt. Ein neues Fach bleibt absichtlich leer, bis du ein extern erstelltes JSON-Lernpaket importiert hast. Die Quellenangaben (Dateiname und Seite) stammen aus dem importierten Paket. Die App lädt keine PDFs hoch, speichert oder analysiert sie nicht und führt keine OCR aus.

Die bestehende Datei `src/content/fragen.json` enthält nur markierte ABWL-Platzhalter. Die erwartete `materials/ABWL.pdf` ist im Repository nicht vorhanden. Deshalb wurden keine ABWL-Inhalte oder bestätigten Folienverweise ergänzt. Der bisherige ABWL-Lernstand wird beim ersten Start in das Fach „ABWL“ migriert; die bestehenden Daten bleiben pro Fach getrennt gespeichert.

## Navigation und Lernen

Die sechs Hauptbereiche sind **Übersicht**, **Lernen**, **Wiederholen**, **Prüfung**, **Inhalte** und **Fortschritt**. Lernmodi und Sitzungsplanung, fällige/überfällige Wiederholungen und Fehlerliste sowie Lernverlauf sind als Unteransichten gruppiert. Eine optionale gemischte Sitzung priorisiert fällige Fragen und kann bereits gelernte Fragen nach Kapitel/Abschnitt einstreuen.

Vor einer Antwort kann die Sicherheit optional eingeschätzt werden. Eine niedrige Sicherheit verkürzt den nächsten Abstand auf einen Tag. Quizfeedback zeigt die belegte richtige Antwort und eine Erklärung nur, falls sie im importierten Inhalt vorhanden ist. Bei Lernkarten kann eine eigene Erklärung eingegeben und anschließend mit der Musterantwort verglichen werden; sie wird weder automatisch bewertet noch gespeichert.

## Externe Lernpakete

Das JSON-Schema liegt unter [`schemas/study-space-content.schema.json`](./schemas/study-space-content.schema.json). Format und Version sind `study-space-content`, Version `1`. Das Paket enthält:

- optionale `courseId`, die mit dem gerade ausgewählten Fach übereinstimmen muss
- `chapters` mit stabilen IDs, Titeln und optionalen `sections`
- `items` mit eindeutigen IDs, `kind` (`flashcard` oder `quiz`), Frage/Lernziel und Kapitelzuordnung
- Lernkarten mit `answer`; Quizfragen mit mindestens zwei `options` und `correctOption` als nullbasiertem Index
- optional `explanation`, `shortExplanation`, `keyTerms`, `examples`, `questionType` und `uncertain`
- `source` mit positiver ganzzahliger `page` und entweder einer `materialId`, die auf erhaltene ältere Material-Metadaten im Fach verweist, oder einem extern angegebenen `fileName`

Vor dem Speichern prüft die App das gesamte Paket einschließlich Fachzuordnung, IDs, Kapitel-/Abschnittsverweisen, Antwortoptionen und Seitenangaben. Du siehst eine Vorschau mit Anzahl, Inhaltstypen und den im Paket angegebenen Quellen und musst den Import ausdrücklich bestätigen. Datei-/Seitenverweise erfordern keinen lokalen PDF-Upload und belegen nicht, dass die App die Datei geprüft hat. Ungültige Pakete oder ID-Konflikte ändern keine Inhalte. Eine kurze technische Feldbeschreibung und die Implementierung befinden sich in `src/studySpace.ts`.

## Fächer, Lernstand und Sicherungen

Jedes Fach hat eigene Kapitel, Lerninhalte und einen unabhängigen Lernstand. Bestehende ältere Material-Metadaten werden aus Kompatibilitätsgründen in Fachobjekten und Sicherungen erhalten. Fächer lassen sich anlegen, umbenennen, archivieren und nach einer Bestätigung löschen. Gleichlautende Fragen-IDs verschiedener Fächer kollidieren dadurch nicht. Der frühere ABWL-Schlüssel `abwl-lernraum-fortschritt-v1` wird in das ABWL-Fach migriert und erst entfernt, nachdem der neue Study-Space-Datensatz erfolgreich gespeichert wurde.

Eine Study-Space-Sicherung aus dem Übersichtsbildschirm umfasst Fächer, erhaltene ältere Material-Metadaten, Lerninhalte und Lernstände. PDF-Binärdateien sind nicht enthalten. Bereits früher von einer Projektversion in IndexedDB gespeicherte PDFs werden durch diese Version nicht gelesen, verändert oder gelöscht. Auch beim Löschen eines Fachs bleiben solche früheren Blobs unangetastet; diese App-Version bietet keine PDF-Verwaltung mehr. Beim Sicherungsimport werden ausschließlich neue Fach-IDs hinzugefügt; vorhandene Fächer werden nie still überschrieben.

Die Lernfunktionen umfassen aktives Erinnern, Lernkarten, Quiz, Fehlerliste, Wiederholungsplanung, kurze Lernsitzungen, Prüfungssimulationen, Notizen, Lesezeichen, Tagesziel, Verlauf, Suche und Tastaturkürzel. Leere Lernansichten sind beabsichtigt. Prüfungen ändern weder Wiederholungspläne noch Beherrschungsstatus.

Der Lernstand und die Study-Space-Metadaten bleiben im `localStorage` des aktuellen Browsers. Browserdaten, privates Surfen oder das Löschen von Website-Daten können Daten entfernen; exportiere regelmäßig eine Study-Space-Sicherung. Es wird nichts an einen Server gesendet.

## Voraussetzungen und Start

- Node.js und npm
- die im Projekt enthaltenen React-, Vite- und TypeScript-Abhängigkeiten

```sh
npm install
npm run dev
```

Öffne anschließend die von Vite angezeigte lokale Adresse. Prüfungen:

```sh
npm test
npm run build
```
````

### `package.json`

````json
{
  "name": "abwl-lernapp",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "node --test tests/progress.test.cjs tests/studySpace.test.cjs tests/navigation.test.cjs"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "~5.7.2",
    "vite": "^6.1.0"
  }
}
````

### `index.html`

````html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f3f5f2" />
    <meta name="description" content="Lokaler persönlicher Study Space für mehrere Fächer und Kurse" />
    <title>Persönlicher Study Space</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

### `src/main.tsx`

````tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
````

### `src/content/fragen.json`

````json
{
  "source": {
    "path": "./materials/ABWL.pdf",
    "available": false,
    "note": "Die erwartete PDF wurde nicht gefunden. Es werden deshalb keine fachlichen Inhalte angezeigt."
  },
  "chapters": [
    { "number": 1, "title": "Kapitel 1" },
    { "number": 2, "title": "Kapitel 2" },
    { "number": 3, "title": "Kapitel 3" },
    { "number": 4, "title": "Kapitel 4" },
    { "number": 5, "title": "Kapitel 5" },
    { "number": 6, "title": "Kapitel 6" },
    { "number": 7, "title": "Kapitel 7" },
    { "number": 8, "title": "Kapitel 8" },
    { "number": 9, "title": "Kapitel 9" }
  ],
  "transferTask": {
    "title": "Nutzwertanalyse – Transferfrage",
    "sourceSlide": 45,
    "verification": "unverified",
    "note": "Von dir vorgegebener, am Original noch ungeprüfter Hinweis: Laut deiner Beschreibung nennt Folie 45 Alternative C. Bei genau 3.000 € Einsatz ist C die genannte Lösung; bei einer Budgetobergrenze von 3.000 € mit erlaubtem Restbudget erzielt F mehr Output. Diese Transferfrage ändert die Annahme ausdrücklich und ist keine bestätigte Wiedergabe der Folie."
  },
  "questions": [
    {
      "id": "karte-platzhalter-1",
      "kind": "flashcard",
      "prompt": "Lernkartenfrage aus der PDF ergänzen",
      "answer": "Antwort anhand der PDF ergänzen und Seitenzahl eintragen.",
      "chapter": "Nicht zugeordnet",
      "questionType": "Nicht festgelegt",
      "sourcePages": [],
      "placeholder": true,
      "uncertain": false
    },
    {
      "id": "karte-platzhalter-2",
      "kind": "flashcard",
      "prompt": "Weitere Lernkartenfrage aus der PDF ergänzen",
      "answer": "Antwort anhand der PDF ergänzen und Seitenzahl eintragen.",
      "chapter": "Nicht zugeordnet",
      "questionType": "Nicht festgelegt",
      "sourcePages": [],
      "placeholder": true,
      "uncertain": false
    },
    {
      "id": "quiz-platzhalter-1",
      "kind": "quiz",
      "prompt": "Multiple-Choice-Frage aus der PDF ergänzen",
      "options": [],
      "correctOption": null,
      "explanation": "Begründung anhand der PDF ergänzen.",
      "chapter": "Nicht zugeordnet",
      "questionType": "Nicht festgelegt",
      "sourcePages": [],
      "placeholder": true,
      "uncertain": false
    },
    {
      "id": "quiz-platzhalter-2",
      "kind": "quiz",
      "prompt": "Weitere Multiple-Choice-Frage aus der PDF ergänzen",
      "options": [],
      "correctOption": null,
      "explanation": "Begründung anhand der PDF ergänzen.",
      "chapter": "Nicht zugeordnet",
      "questionType": "Nicht festgelegt",
      "sourcePages": [],
      "placeholder": true,
      "uncertain": false
    }
  ]
}
````

### `src/navigation.ts`

````typescript
export type View =
  | "overview" | "learn" | "quiz" | "cards" | "review" | "errors" | "progress"
  | "sessions" | "studySession" | "studySummary" | "examSetup" | "exam"
  | "saved" | "history" | "importContent";

export type NavigationSection = "overview" | "learn" | "review" | "exam" | "contents" | "progress";

export const PRIMARY_NAVIGATION: Array<{ id: NavigationSection; label: string; icon: string; view: View }> = [
  { id: "overview", label: "Übersicht", icon: "⌂", view: "overview" },
  { id: "learn", label: "Lernen", icon: "▤", view: "learn" },
  { id: "review", label: "Wiederholen", icon: "↻", view: "review" },
  { id: "exam", label: "Prüfung", icon: "▣", view: "examSetup" },
  { id: "contents", label: "Inhalte", icon: "⇧", view: "importContent" },
  { id: "progress", label: "Fortschritt", icon: "◷", view: "progress" },
];

export const SECTION_VIEWS: Record<NavigationSection, Array<{ view: View; label: string }>> = {
  overview: [{ view: "overview", label: "Lernpfad" }],
  learn: [
    { view: "learn", label: "Erklär es selbst" },
    { view: "cards", label: "Lernkarten" },
    { view: "quiz", label: "Quiz" },
    { view: "sessions", label: "Lernsitzung" },
  ],
  review: [
    { view: "review", label: "Fällig" },
    { view: "errors", label: "Fehlerliste" },
  ],
  exam: [{ view: "examSetup", label: "Prüfungssimulation" }],
  contents: [
    { view: "importContent", label: "Lernpaket importieren" },
    { view: "saved", label: "Gespeicherte Inhalte" },
  ],
  progress: [
    { view: "progress", label: "Lernstand" },
    { view: "history", label: "Lernverlauf" },
  ],
};

const VIEW_SECTION: Record<View, NavigationSection> = {
  overview: "overview",
  learn: "learn",
  quiz: "learn",
  cards: "learn",
  sessions: "learn",
  studySession: "learn",
  studySummary: "learn",
  review: "review",
  errors: "review",
  examSetup: "exam",
  exam: "exam",
  importContent: "contents",
  saved: "contents",
  progress: "progress",
  history: "progress",
};

export function sectionForView(view: View): NavigationSection {
  return VIEW_SECTION[view];
}
````

### `src/progress.ts`

````typescript
export const STORAGE_KEY = "abwl-lernraum-fortschritt-v1";
export const EXPORT_FORMAT = "abwl-lernraum-fortschritt";
export const EXPORT_VERSION = 3;
export const MAX_HISTORY_ENTRIES = 100;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

export type LearningMode = "lernen" | "karten" | "quiz";
export type Rating = "sicher" | "unsicher" | "noch einmal";
export type Confidence = "niedrig" | "mittel" | "hoch";
export type ReviewRecord = {
  streak: number;
  intervalDays: number;
  dueDate: string;
  lastReviewedAt: string;
  rating: Rating;
  confidence?: Confidence;
};
export type Progress = {
  knownIds: string[];
  wrongIds: string[];
  correctAnswers: number;
  incorrectAnswers: number;
  reviews: Record<string, ReviewRecord>;
  bookmarks: string[];
  notes: Record<string, string>;
  dailyGoal: DailyGoal;
  sessionPreferences: SessionPreferences;
  history: StudyHistoryEntry[];
  unfinishedSession: UnfinishedSession | null;
};
export type DailyGoal = {
  enabled: boolean;
  type: "questions" | "minutes";
  target: number;
  reminderEnabled: boolean;
};
export type SessionPreferences = {
  questionCount: number;
  durationMinutes: number | null;
  topics: string[];
  modes: LearningMode[];
  includeWeak: boolean;
  mixedReview: boolean;
  examCount: number;
  examTopics: string[];
  examDurationMinutes: number | null;
};
export type StudySessionItem = { questionId: string; mode: LearningMode };
export type ExamAnswer = { selectedOption: number; isCorrect: boolean };
export type UnfinishedSession = {
  type: "study" | "exam";
  startedAt: string;
  items: StudySessionItem[];
  index: number;
  durationMinutes: number | null;
  answers: Record<string, ExamAnswer>;
  submitted: boolean;
  retryMissed: boolean;
};
export type StudyHistoryEntry = {
  id: string;
  date: string;
  type: "study" | "exam";
  durationSeconds: number;
  attempted: number;
  correct: number;
  questionIds: string[];
  missedIds: string[];
};
export type QuestionProgressInfo = { id: string; kind: "flashcard" | "quiz" };
export type ImportEnvelope = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  progress: Progress;
};

export const emptyProgress: Progress = {
  knownIds: [],
  wrongIds: [],
  correctAnswers: 0,
  incorrectAnswers: 0,
  reviews: {},
  bookmarks: [],
  notes: {},
  dailyGoal: { enabled: false, type: "questions", target: 10, reminderEnabled: false },
  sessionPreferences: {
    questionCount: 10,
    durationMinutes: null,
    topics: [],
    modes: ["lernen", "karten", "quiz"],
    includeWeak: true,
    mixedReview: false,
    examCount: 10,
    examTopics: [],
    examDurationMinutes: null,
  },
  history: [],
  unfinishedSession: null,
};

function defaultProgressFields() {
  return {
    bookmarks: [] as string[],
    notes: {} as Record<string, string>,
    dailyGoal: { enabled: false, type: "questions" as const, target: 10, reminderEnabled: false },
    sessionPreferences: {
      questionCount: 10,
      durationMinutes: null,
      topics: [],
      modes: ["lernen", "karten", "quiz"] as LearningMode[],
      includeWeak: true,
      mixedReview: false,
      examCount: 10,
      examTopics: [],
      examDurationMinutes: null,
    },
    history: [] as StudyHistoryEntry[],
    unfinishedSession: null as UnfinishedSession | null,
  };
}

export function dailyGoalProgress(history: StudyHistoryEntry[], goal: DailyGoal, date: string) {
  if (!goal.enabled) return { value: 0, target: goal.target, hasActivity: false, complete: false };
  const today = history.filter((entry) => entry.type === "study" && entry.date === date);
  const questions = today.reduce((total, entry) => total + entry.attempted, 0);
  const seconds = today.reduce((total, entry) => total + entry.durationSeconds, 0);
  const value = goal.type === "questions" ? questions : Math.floor(seconds / 60);
  return { value, target: goal.target, hasActivity: questions > 0, complete: value >= goal.target };
}

export function appendHistory(history: StudyHistoryEntry[], entry: StudyHistoryEntry): StudyHistoryEntry[] {
  return [...history, entry].slice(-MAX_HISTORY_ENTRIES);
}

export function completeExamProgress(
  progress: Progress,
  session: UnfinishedSession,
  completedAt = new Date(),
): Progress {
  if (session.type !== "exam" || session.submitted) return progress;
  const answers = Object.entries(session.answers);
  const entry: StudyHistoryEntry = {
    id: `${completedAt.getTime()}-exam`,
    date: todayLocalDate(completedAt),
    type: "exam",
    durationSeconds: Math.max(0, Math.floor((completedAt.getTime() - Date.parse(session.startedAt)) / 1000)),
    attempted: answers.length,
    correct: answers.filter(([, answer]) => answer.isCorrect).length,
    questionIds: session.items.map((item) => item.questionId),
    missedIds: session.items.flatMap((item) =>
      session.answers[item.questionId]?.isCorrect ? [] : [item.questionId]),
  };
  return {
    ...progress,
    history: appendHistory(progress.history, entry),
    unfinishedSession: { ...session, submitted: true, index: session.items.length },
  };
}

export function makeStudySession(
  questions: Array<{
    id: string;
    kind: "flashcard" | "quiz";
    chapter: string;
    section?: string;
    modes: LearningMode[];
    due: boolean;
    weak: boolean;
    learned?: boolean;
    dueModes?: LearningMode[];
    weakModes?: LearningMode[];
    learnedModes?: LearningMode[];
  }>,
  preferences: SessionPreferences,
  random = Math.random,
): StudySessionItem[] {
  if (questions.length === 0 || preferences.modes.length === 0) return [];
  const candidates = questions.flatMap((question) => {
    if (preferences.topics.length > 0 && !preferences.topics.includes(question.chapter)) return [];
    return question.modes
      .filter((mode) => preferences.modes.includes(mode))
      .map((mode) => ({
        item: { questionId: question.id, mode },
        id: question.id,
        topic: `${question.chapter}\u0000${question.section ?? ""}`,
        due: question.dueModes ? question.dueModes.includes(mode) : question.due,
        weak: question.weakModes ? question.weakModes.includes(mode) : question.weak,
        learned: question.learnedModes ? question.learnedModes.includes(mode) : question.learned === true,
      }));
  });
  const shuffle = <T,>(items: T[]) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  };
  const topicMix = <T extends { topic: string }>(items: T[]): T[] => {
    const buckets = new Map<string, T[]>();
    for (const item of shuffle(items)) {
      const bucket = buckets.get(item.topic) ?? [];
      bucket.push(item);
      buckets.set(item.topic, bucket);
    }
    const topics = shuffle([...buckets.keys()]);
    const mixed: T[] = [];
    while (topics.length > 0) {
      const topic = topics.shift()!;
      const bucket = buckets.get(topic)!;
      mixed.push(bucket.shift()!);
      if (bucket.length > 0) topics.push(topic);
    }
    return mixed;
  };
  const due = topicMix(candidates.filter((item) => item.due));
  const learned = preferences.mixedReview
    ? topicMix(candidates.filter((item) => !item.due && item.learned))
    : [];
  const weak = preferences.includeWeak
    ? topicMix(candidates.filter((item) => !item.due && !(preferences.mixedReview && item.learned) && item.weak))
    : [];
  const regular = topicMix(candidates.filter((item) =>
    !item.due && !(preferences.mixedReview && item.learned) && !(preferences.includeWeak && item.weak)));
  const selected: typeof candidates = [];
  const selectedIds = new Set<string>();
  for (const candidate of [...due, ...learned, ...weak, ...regular]) {
    if (selectedIds.has(candidate.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.id);
    if (selected.length >= Math.max(1, preferences.questionCount)) break;
  }
  return selected.map((item) => item.item);
}

export function makeExamSelection<T>(items: T[], count: number, random = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.max(0, count));
}

export function weeklyMonthlySummary(history: StudyHistoryEntry[], today: string) {
  const todayDate = new Date(`${today}T12:00:00`);
  const startOfWeek = new Date(todayDate);
  const weekday = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - weekday);
  const weekStart = todayLocalDate(startOfWeek);
  const monthStart = `${today.slice(0, 7)}-01`;
  const summarize = (entries: StudyHistoryEntry[]) => ({
    sessions: entries.length,
    questions: entries.reduce((total, entry) => total + entry.attempted, 0),
    minutes: Math.floor(entries.reduce((total, entry) => total + entry.durationSeconds, 0) / 60),
    exams: entries.filter((entry) => entry.type === "exam").length,
  });
  return {
    week: summarize(history.filter((entry) => entry.date >= weekStart && entry.date <= today)),
    month: summarize(history.filter((entry) => entry.date >= monthStart && entry.date <= today)),
  };
}

export function todayLocalDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addLocalDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(year, month - 1, day);
  result.setDate(result.getDate() + days);
  return todayLocalDate(result);
}

export function reviewKey(mode: LearningMode, id: string): string {
  return `${mode}:${id}`;
}

export function nextReviewIndex(currentIndex: number, remainingCount: number, removedCurrent: boolean): number {
  if (remainingCount <= 0) return 0;
  return removedCurrent
    ? Math.min(currentIndex, remainingCount - 1)
    : (currentIndex + 1) % remainingCount;
}

export function scheduleReview(
  previous: ReviewRecord | undefined,
  rating: Rating,
  reviewedAt = new Date(),
  confidence?: Confidence,
): ReviewRecord {
  const today = todayLocalDate(reviewedAt);
  const intervalReached = !previous || previous.dueDate <= today;
  const streak = rating === "sicher"
    ? intervalReached ? (previous?.streak ?? 0) + 1 : previous.streak
    : 0;
  const intervalDays = rating === "sicher"
    ? confidence === "niedrig"
      ? 1
      : REVIEW_INTERVALS[Math.min(Math.max(streak - 1, 0), REVIEW_INTERVALS.length - 1)]
    : 1;
  const dueDate = rating === "sicher" && confidence !== "niedrig" && !intervalReached && previous
    ? previous.dueDate
    : addLocalDays(today, intervalDays);

  return {
    streak,
    intervalDays,
    dueDate,
    lastReviewedAt: reviewedAt.toISOString(),
    rating,
    ...(confidence ? { confidence } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isIsoInstant(value: unknown): value is string {
  return typeof value === "string"
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function isRating(value: unknown): value is Rating {
  return value === "sicher" || value === "unsicher" || value === "noch einmal";
}

function isConfidence(value: unknown): value is Confidence {
  return value === "niedrig" || value === "mittel" || value === "hoch";
}

function isReviewRecord(value: unknown): value is ReviewRecord {
  if (!isRecord(value)
    || !isNonNegativeInteger(value.streak)
    || !REVIEW_INTERVALS.includes(value.intervalDays as typeof REVIEW_INTERVALS[number])
    || !isCalendarDate(value.dueDate)
    || !isIsoInstant(value.lastReviewedAt)
    || !isRating(value.rating)
    || value.confidence !== undefined && !isConfidence(value.confidence)) return false;
  const expectedInterval = value.rating === "sicher" && value.confidence !== "niedrig"
    ? REVIEW_INTERVALS[Math.min(Math.max(Number(value.streak) - 1, 0), REVIEW_INTERVALS.length - 1)]
    : 1;
  return Number(value.intervalDays) === expectedInterval
    && (value.rating === "sicher" || Number(value.streak) === 0);
}

function modeForQuestion(question: QuestionProgressInfo): LearningMode {
  return question.kind === "quiz" ? "quiz" : "karten";
}

function modesForQuestion(question: QuestionProgressInfo): LearningMode[] {
  return question.kind === "quiz" ? ["quiz"] : ["lernen", "karten"];
}

export function migrateStoredProgress(
  value: unknown,
  questions: QuestionProgressInfo[],
): Progress {
  if (!isRecord(value)) return emptyProgress;
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const knownIds = Array.isArray(value.knownIds)
    ? [...new Set(value.knownIds.filter((id): id is string => typeof id === "string"))]
    : [];
  const wrongIds = Array.isArray(value.wrongIds)
    ? [...new Set(value.wrongIds.filter((id): id is string => typeof id === "string"))]
    : [];
  const reviews: Record<string, ReviewRecord> = {};

  if (isRecord(value.reviews)) {
    for (const [storedKey, storedValue] of Object.entries(value.reviews)) {
      if (
        isReviewRecord(storedValue)
        && /^(lernen|karten|quiz):.+$/.test(storedKey)
      ) {
        reviews[storedKey] = storedValue;
        continue;
      }

      const question = questionById.get(storedKey);
      if (
        !isRecord(storedValue)
        || !isNonNegativeInteger(storedValue.streak)
        || !Number.isFinite(storedValue.dueAt)
        || !Number.isFinite(storedValue.lastReviewedAt)
        || !isRating(storedValue.rating)
      ) continue;

      const legacyDueDate = new Date(Number(storedValue.dueAt));
      const legacyReviewedAt = new Date(Number(storedValue.lastReviewedAt));
      if (!Number.isFinite(legacyDueDate.getTime()) || !Number.isFinite(legacyReviewedAt.getTime())) continue;
      const streak = Math.min(Number(storedValue.streak), 1000);
      const intervalDays = streak === 0 ? 1 : REVIEW_INTERVALS[Math.min(streak - 1, REVIEW_INTERVALS.length - 1)];
      const legacyKey = reviewKey(question ? modeForQuestion(question) : "karten", question?.id ?? storedKey);
      reviews[legacyKey] = {
        streak,
        intervalDays,
        dueDate: todayLocalDate(legacyDueDate),
        lastReviewedAt: legacyReviewedAt.toISOString(),
        rating: storedValue.rating,
      };
      if (storedValue.rating !== "sicher") {
        wrongIds.push(legacyKey);
      }
    }
  }

  const defaults = defaultProgressFields();
  const validIds = new Set(questions.map((question) => question.id));
  const bookmarks = Array.isArray(value.bookmarks)
    ? [...new Set(value.bookmarks.filter((id): id is string => typeof id === "string" && validIds.has(id)))]
    : defaults.bookmarks;
  const notes: Record<string, string> = {};
  if (isRecord(value.notes)) {
    for (const [id, note] of Object.entries(value.notes)) {
      if (validIds.has(id) && typeof note === "string" && note.length <= 10_000) notes[id] = note;
    }
  }
  const rawGoal = isRecord(value.dailyGoal) ? value.dailyGoal : undefined;
  const dailyGoal = rawGoal
    && (rawGoal.type === "questions" || rawGoal.type === "minutes")
    && Number.isInteger(rawGoal.target)
    && Number(rawGoal.target) >= 1
    && Number(rawGoal.target) <= 1000
    && (rawGoal.enabled === undefined || typeof rawGoal.enabled === "boolean")
    ? {
        enabled: rawGoal.enabled !== false,
        type: rawGoal.type as DailyGoal["type"],
        target: Number(rawGoal.target),
        reminderEnabled: rawGoal.reminderEnabled === true,
      }
    : defaults.dailyGoal;
  const rawPreferences = isRecord(value.sessionPreferences) ? value.sessionPreferences : undefined;
  const sessionPreferences = rawPreferences
    && isNonNegativeInteger(rawPreferences.questionCount)
    && Number(rawPreferences.questionCount) >= 1
    && Number(rawPreferences.questionCount) <= 100
    && (rawPreferences.durationMinutes === null || isNonNegativeInteger(rawPreferences.durationMinutes))
    && Array.isArray(rawPreferences.topics)
    && rawPreferences.topics.every((topic) => typeof topic === "string")
    && Array.isArray(rawPreferences.modes)
    && rawPreferences.modes.every(isLearningMode)
    && typeof rawPreferences.includeWeak === "boolean"
    && (rawPreferences.mixedReview === undefined || typeof rawPreferences.mixedReview === "boolean")
    && isNonNegativeInteger(rawPreferences.examCount)
    && Number(rawPreferences.examCount) >= 1
    && Number(rawPreferences.examCount) <= 100
    && Array.isArray(rawPreferences.examTopics)
    && rawPreferences.examTopics.every((topic) => typeof topic === "string")
    && (rawPreferences.examDurationMinutes === null || isNonNegativeInteger(rawPreferences.examDurationMinutes))
    ? {
        questionCount: Number(rawPreferences.questionCount),
        durationMinutes: rawPreferences.durationMinutes as number | null,
        topics: rawPreferences.topics as string[],
        modes: rawPreferences.modes as LearningMode[],
        includeWeak: rawPreferences.includeWeak,
        mixedReview: rawPreferences.mixedReview === true,
        examCount: Number(rawPreferences.examCount),
        examTopics: rawPreferences.examTopics as string[],
        examDurationMinutes: rawPreferences.examDurationMinutes as number | null,
      }
    : defaults.sessionPreferences;
  const history = Array.isArray(value.history)
    ? value.history.filter((entry): entry is StudyHistoryEntry => isHistoryEntry(entry, validIds)).slice(-MAX_HISTORY_ENTRIES)
    : defaults.history;
  const unfinishedSession = isUnfinishedSession(value.unfinishedSession, questionById)
    ? value.unfinishedSession
    : defaults.unfinishedSession;

  return {
    knownIds,
    wrongIds: [...new Set(wrongIds)],
    correctAnswers: isNonNegativeInteger(value.correctAnswers) ? value.correctAnswers : 0,
    incorrectAnswers: isNonNegativeInteger(value.incorrectAnswers) ? value.incorrectAnswers : 0,
    reviews,
    bookmarks,
    notes,
    dailyGoal,
    sessionPreferences,
    history,
    unfinishedSession,
  };
}

function isLearningMode(value: unknown): value is LearningMode {
  return value === "lernen" || value === "karten" || value === "quiz";
}

function isHistoryEntry(value: unknown, knownIds: Set<string>): value is StudyHistoryEntry {
  return isRecord(value)
    && typeof value.id === "string"
    && isCalendarDate(value.date)
    && (value.type === "study" || value.type === "exam")
    && isNonNegativeInteger(value.durationSeconds)
    && isNonNegativeInteger(value.attempted)
    && isNonNegativeInteger(value.correct)
    && Number(value.correct) <= Number(value.attempted)
    && Array.isArray(value.questionIds)
    && value.questionIds.every((id) => typeof id === "string" && knownIds.has(id))
    && Number(value.attempted) <= value.questionIds.length
    && Array.isArray(value.missedIds)
    && value.missedIds.every((id) => typeof id === "string" && knownIds.has(id) && (value.questionIds as string[]).includes(id));
}

function isUnfinishedSession(
  value: unknown,
  questionById: Map<string, QuestionProgressInfo>,
): value is UnfinishedSession | null {
  if (value === null || value === undefined) return true;
  if (!isRecord(value)
    || (value.type !== "study" && value.type !== "exam")
    || !isIsoInstant(value.startedAt)
    || !Array.isArray(value.items)
    || value.items.length === 0
    || !value.items.every((item) => {
      if (!isRecord(item) || typeof item.questionId !== "string" || !isLearningMode(item.mode)) return false;
      const question = questionById.get(item.questionId);
      return Boolean(question)
        && (question?.kind === "quiz" ? item.mode === "quiz" : item.mode !== "quiz")
        && (value.type !== "exam" || item.mode === "quiz");
    })
    || !isNonNegativeInteger(value.index)
    || Number(value.index) > value.items.length
    || !(value.durationMinutes === null || (isNonNegativeInteger(value.durationMinutes) && Number(value.durationMinutes) >= 1 && Number(value.durationMinutes) <= 240))
    || !isRecord(value.answers)
    || typeof value.submitted !== "boolean"
    || value.submitted && (value.type !== "exam" || Number(value.index) !== value.items.length)
    || !value.submitted && Number(value.index) >= value.items.length
    || typeof value.retryMissed !== "boolean"
  ) return false;
  const uniqueItems = new Set<string>();
  const items = value.items as UnfinishedSession["items"];
  for (const item of items) {
    const key = value.type === "exam" ? item.questionId : reviewKey(item.mode, item.questionId);
    if (uniqueItems.has(key)) return false;
    uniqueItems.add(key);
  }
  return Object.entries(value.answers).every(([id, answer]) => {
    if (!isRecord(answer)
      || !isNonNegativeInteger(answer.selectedOption)
      || Number(answer.selectedOption) > 25
      || typeof answer.isCorrect !== "boolean") return false;
    return items.some((item) => value.type === "exam"
      ? id === item.questionId && item.mode === "quiz"
      : id === reviewKey(item.mode, item.questionId) || id === item.questionId);
  });
}

function validateProgress(value: unknown, questions: QuestionProgressInfo[], allowLegacy = false): Progress {
  if (!isRecord(value)) throw new Error("Die Datei enthält keinen gültigen Lernstand.");
  const knownIds = value.knownIds;
  const wrongIds = value.wrongIds;
  const rawReviews = value.reviews;
  if (
    !Array.isArray(knownIds)
    || !knownIds.every((id) => typeof id === "string")
    || !Array.isArray(wrongIds)
    || !wrongIds.every((id) => typeof id === "string")
    || !isNonNegativeInteger(value.correctAnswers)
    || !isNonNegativeInteger(value.incorrectAnswers)
    || !Number.isSafeInteger(Number(value.correctAnswers) + Number(value.incorrectAnswers))
    || !isRecord(rawReviews)
  ) throw new Error("Der Lernstand enthält ungültige Zähler, Listen oder Wiederholungsdaten.");

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const validScheduleKeys = new Set(questions.flatMap((question) =>
    modesForQuestion(question).map((mode) => reviewKey(mode, question.id)),
  ));
  const normalizeIds = (ids: string[], label: string): Set<string> => {
    const normalized = new Set<string>();
    for (const id of ids) {
      const question = questionById.get(id);
      const modeSeparator = id.indexOf(":");
      const prefix = modeSeparator === -1 ? "" : id.slice(0, modeSeparator);
      const modeId = prefix === "lernen" || prefix === "karten" || prefix === "quiz"
        ? id
        : undefined;
      const keys = question
        ? modesForQuestion(question).map((mode) => reviewKey(mode, question.id))
        : modeId && validScheduleKeys.has(modeId)
          ? [modeId]
          : [];
      if (keys.length === 0) {
        throw new Error("Der Lernstand enthält unbekannte Fragen-IDs oder unpassende Lernmodi.");
      }
      for (const key of keys) {
        if (normalized.has(key)) {
          throw new Error(`Die Liste „${label}“ enthält doppelte Fragen-IDs.`);
        }
        normalized.add(key);
      }
    }
    return normalized;
  };
  const knownKeys = normalizeIds(knownIds as string[], "sicher");
  const wrongKeys = normalizeIds(wrongIds as string[], "falsch/unsicher");
  const assertNoConflicts = (known: Set<string>, wrong: Set<string>) => {
    if ([...known].some((key) => wrong.has(key))) {
      throw new Error("Dieselbe Frage darf im passenden Lernmodus nicht gleichzeitig als sicher und als falsch/unsicher markiert sein.");
    }
  };
  assertNoConflicts(knownKeys, wrongKeys);

  const reviews: Record<string, ReviewRecord> = {};
  for (const [key, record] of Object.entries(rawReviews)) {
    if (!validScheduleKeys.has(key) || !isReviewRecord(record)) {
      throw new Error("Mindestens ein Wiederholungseintrag ist ungültig oder gehört nicht zu diesem Lernmaterial.");
    }
    const [mode, id] = key.split(":", 2);
    const question = questionById.get(id);
    if (!question || (question.kind === "quiz" ? mode !== "quiz" : mode === "quiz")) {
      throw new Error("Ein Wiederholungseintrag verwendet einen unpassenden Lernmodus.");
    }
    reviews[key] = record;
    if (record.rating === "sicher" && wrongKeys.has(key)
      || record.rating !== "sicher" && knownKeys.has(key)) {
      throw new Error("Eine Frage ist im Lernstand gleichzeitig als sicher und als falsch/unsicher bewertet.");
    }
  }

  const defaults = defaultProgressFields();
  const validQuestionIds = new Set(questionById.keys());
  const rawBookmarks = value.bookmarks ?? (allowLegacy ? defaults.bookmarks : undefined);
  const rawNotes = value.notes ?? (allowLegacy ? defaults.notes : undefined);
  const rawGoal = value.dailyGoal ?? (allowLegacy ? defaults.dailyGoal : undefined);
  const rawPreferences = value.sessionPreferences ?? (allowLegacy ? defaults.sessionPreferences : undefined);
  const rawHistory = value.history ?? (allowLegacy ? defaults.history : undefined);
  const rawUnfinished = value.unfinishedSession === undefined
    ? allowLegacy ? defaults.unfinishedSession : undefined
    : value.unfinishedSession;
  if (!Array.isArray(rawBookmarks)
    || !rawBookmarks.every((id) => typeof id === "string" && validQuestionIds.has(id))
    || new Set(rawBookmarks).size !== rawBookmarks.length) {
    throw new Error("Die Lesezeichen enthalten ungültige oder doppelte Fragen-IDs.");
  }
  if (!isRecord(rawNotes)
    || Object.entries(rawNotes).some(([id, note]) =>
      !validQuestionIds.has(id) || typeof note !== "string" || note.length > 10_000)) {
    throw new Error("Die persönlichen Notizen enthalten ungültige Fragen-IDs oder sind zu lang.");
  }
  if (!isRecord(rawGoal)
    || (rawGoal.type !== "questions" && rawGoal.type !== "minutes")
    || (rawGoal.enabled !== undefined && typeof rawGoal.enabled !== "boolean")
    || !isNonNegativeInteger(rawGoal.target)
    || Number(rawGoal.target) < 1
    || Number(rawGoal.target) > 1000
    || typeof rawGoal.reminderEnabled !== "boolean") {
    throw new Error("Das Tagesziel muss zwischen 1 und 1000 Fragen oder Minuten liegen.");
  }
  if (!isRecord(rawPreferences)
    || !isNonNegativeInteger(rawPreferences.questionCount)
    || Number(rawPreferences.questionCount) < 1
    || Number(rawPreferences.questionCount) > 100
    || !(rawPreferences.durationMinutes === null
      || (isNonNegativeInteger(rawPreferences.durationMinutes) && Number(rawPreferences.durationMinutes) <= 240))
    || !Array.isArray(rawPreferences.topics)
    || !rawPreferences.topics.every((topic) => typeof topic === "string")
    || !Array.isArray(rawPreferences.modes)
    || rawPreferences.modes.length === 0
    || !rawPreferences.modes.every(isLearningMode)
    || new Set(rawPreferences.modes).size !== rawPreferences.modes.length
    || typeof rawPreferences.includeWeak !== "boolean"
    || rawPreferences.mixedReview !== undefined && typeof rawPreferences.mixedReview !== "boolean"
    || !isNonNegativeInteger(rawPreferences.examCount)
    || Number(rawPreferences.examCount) < 1
    || Number(rawPreferences.examCount) > 100
    || !(rawPreferences.examDurationMinutes === null
      || (isNonNegativeInteger(rawPreferences.examDurationMinutes) && Number(rawPreferences.examDurationMinutes) <= 240))
    || !Array.isArray(rawPreferences.examTopics)
    || !rawPreferences.examTopics.every((topic) => typeof topic === "string")) {
    throw new Error("Die gespeicherten Sitzungs- oder Prüfungseinstellungen sind ungültig.");
  }
  if (!Array.isArray(rawHistory)
    || rawHistory.length > MAX_HISTORY_ENTRIES
    || !rawHistory.every((entry) => isHistoryEntry(entry, validQuestionIds))) {
    throw new Error("Der Lernverlauf enthält ungültige Einträge oder überschreitet das Speicherlimit.");
  }
  if (new Set(rawHistory.map((entry) => (entry as StudyHistoryEntry).id)).size !== rawHistory.length) {
    throw new Error("Der Lernverlauf enthält doppelte Sitzungs-IDs.");
  }
  if (!isUnfinishedSession(rawUnfinished, questionById)) {
    throw new Error("Die gespeicherte laufende Sitzung enthält ungültige Fragen oder Antworten.");
  }
  const sessionPreferences: SessionPreferences = {
    questionCount: Number(rawPreferences.questionCount),
    durationMinutes: rawPreferences.durationMinutes as number | null,
    topics: rawPreferences.topics as string[],
    modes: rawPreferences.modes as LearningMode[],
    includeWeak: rawPreferences.includeWeak,
    mixedReview: rawPreferences.mixedReview === true,
    examCount: Number(rawPreferences.examCount),
    examTopics: rawPreferences.examTopics as string[],
    examDurationMinutes: rawPreferences.examDurationMinutes as number | null,
  };

  return {
    knownIds: [...new Set(knownIds as string[])],
    wrongIds: [...new Set(wrongIds as string[])],
    correctAnswers: value.correctAnswers,
    incorrectAnswers: value.incorrectAnswers,
    reviews,
    bookmarks: rawBookmarks as string[],
    notes: rawNotes as Record<string, string>,
    dailyGoal: {
      enabled: rawGoal.enabled !== false,
      type: rawGoal.type as DailyGoal["type"],
      target: Number(rawGoal.target),
      reminderEnabled: rawGoal.reminderEnabled,
    },
    sessionPreferences,
    history: rawHistory as StudyHistoryEntry[],
    unfinishedSession: rawUnfinished,
  };
}

export function parseProgressImport(
  text: string,
  questions: QuestionProgressInfo[],
): Progress {
  if (text.length > 2_000_000) throw new Error("Die JSON-Datei ist zu groß (maximal 2 MB).");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }
  if (
    !isRecord(parsed)
    || parsed.format !== EXPORT_FORMAT
    || parsed.version !== EXPORT_VERSION && parsed.version !== 2
    || !isIsoInstant(parsed.exportedAt)
  ) throw new Error(`Unbekanntes Dateiformat oder nicht unterstützte Version. Erwartet wird Version ${EXPORT_VERSION}.`);
  return validateProgress(parsed.progress, questions, parsed.version === 2);
}

export function createProgressExport(progress: Progress): ImportEnvelope {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    progress,
  };
}
````

### `src/studySpace.ts`

````typescript
import {
  createProgressExport,
  migrateStoredProgress,
  parseProgressImport,
  type Progress,
} from "./progress";

export const STUDY_SPACE_KEY = "study-space-v1";
export const STUDY_SPACE_FORMAT = "personal-study-space";
export const STUDY_SPACE_VERSION = 1;
export const CONTENT_PACKAGE_FORMAT = "study-space-content";
export const CONTENT_PACKAGE_VERSION = 1;

export type StudyMaterial = {
  id: string;
  fileName: string;
  size: number;
  addedAt: string;
  status: "stored" | "missing";
};
export type StudyChapter = {
  id: string;
  title: string;
  sections: Array<{ id: string; title: string }>;
};
export type StudyQuestion = {
  id: string;
  kind: "flashcard" | "quiz";
  prompt: string;
  answer?: string;
  options?: string[];
  correctOption?: number;
  explanation?: string;
  shortExplanation?: string;
  keyTerms?: string[];
  examples?: string[];
  chapter: string;
  chapterNumber?: number;
  section?: string;
  questionType: string;
  sourcePages: number[];
  sourceMaterialId?: string;
  sourceFileName?: string;
  placeholder: boolean;
  uncertain: boolean;
};
export type Course = {
  id: string;
  name: string;
  archived: boolean;
  createdAt: string;
  materials: StudyMaterial[];
  chapters: StudyChapter[];
  questions: StudyQuestion[];
  progress: Progress;
  transferTask?: { title: string; sourceSlide: number; verification: string; note: string };
};
export type StudySpace = {
  format: typeof STUDY_SPACE_FORMAT;
  version: typeof STUDY_SPACE_VERSION;
  activeCourseId: string | null;
  courses: Course[];
};

export type ContentImportPreview = {
  courseId: string;
  chapters: StudyChapter[];
  questions: StudyQuestion[];
  materialNames: string[];
  flashcardCount: number;
  quizCount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]): boolean =>
  Object.keys(value).every((key) => keys.includes(key));

const isInstant = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function validateCourse(value: unknown): value is Course {
  if (!isRecord(value)
    || typeof value.id !== "string" || !value.id
    || typeof value.name !== "string" || !value.name.trim()
    || typeof value.archived !== "boolean"
    || !isInstant(value.createdAt)
    || !Array.isArray(value.materials)
    || !Array.isArray(value.chapters)
    || !Array.isArray(value.questions)
    || !isRecord(value.progress)) return false;
  if (value.transferTask !== undefined
    && (!isRecord(value.transferTask)
      || typeof value.transferTask.title !== "string"
      || !Number.isSafeInteger(value.transferTask.sourceSlide)
      || Number(value.transferTask.sourceSlide) < 1
      || typeof value.transferTask.verification !== "string"
      || typeof value.transferTask.note !== "string")) return false;
  const materials = value.materials;
  if (!materials.every((item) => isRecord(item)
    && typeof item.id === "string" && Boolean(item.id)
    && typeof item.fileName === "string" && Boolean(item.fileName)
    && Number.isSafeInteger(item.size) && Number(item.size) > 0
    && isInstant(item.addedAt) && (item.status === "stored" || item.status === "missing"))) return false;
  const chapters = value.chapters;
  if (!chapters.every((item) => isRecord(item)
    && typeof item.id === "string" && Boolean(item.id)
    && typeof item.title === "string" && Boolean(item.title.trim())
    && Array.isArray(item.sections)
    && item.sections.every((section) => isRecord(section)
      && typeof section.id === "string" && Boolean(section.id)
      && typeof section.title === "string" && Boolean(section.title.trim()))
    && new Set(item.sections.map((section) => (section as { id: string }).id)).size === item.sections.length)) return false;
  const chapterIds = new Set(chapters.map((chapter) => (chapter as StudyChapter).id));
  const questionIds = new Set<string>();
  if (!value.questions.every((item) => {
    if (!isRecord(item) || typeof item.id !== "string" || questionIds.has(item.id)) return false;
    questionIds.add(item.id);
    return (item.kind === "flashcard" || item.kind === "quiz")
      && typeof item.prompt === "string" && Boolean(item.prompt.trim())
      && typeof item.chapter === "string"
      && typeof item.questionType === "string"
      && Array.isArray(item.sourcePages)
      && item.sourcePages.every((page) => Number.isSafeInteger(page) && Number(page) > 0)
      && typeof item.placeholder === "boolean"
      && typeof item.uncertain === "boolean"
      && (item.placeholder || item.sourcePages.length > 0)
      && (item.kind !== "flashcard" || typeof item.answer === "string" && Boolean(item.answer.trim()))
      && (item.placeholder || item.kind !== "quiz" || Array.isArray(item.options)
        && item.options.length >= 2
        && item.options.every((option) => typeof option === "string" && Boolean(option.trim()))
        && Number.isInteger(item.correctOption)
        && Number(item.correctOption) >= 0
        && Number(item.correctOption) < item.options.length)
      && (item.chapterNumber === undefined || Number.isSafeInteger(item.chapterNumber) && Number(item.chapterNumber) >= 1)
      && (!item.sourceMaterialId || materials.some((material) =>
        (material as StudyMaterial).id === item.sourceMaterialId))
      && (item.sourceFileName === undefined || typeof item.sourceFileName === "string")
      && (item.explanation === undefined || typeof item.explanation === "string")
      && (item.shortExplanation === undefined || typeof item.shortExplanation === "string")
      && (item.keyTerms === undefined || Array.isArray(item.keyTerms) && item.keyTerms.every((term) => typeof term === "string"))
      && (item.examples === undefined || Array.isArray(item.examples) && item.examples.every((example) => typeof example === "string"))
      && (item.options === undefined || Array.isArray(item.options) && item.options.every((option) => typeof option === "string"))
      && (item.correctOption === undefined
        || item.placeholder && item.correctOption === null
        || Number.isSafeInteger(item.correctOption));
  })) return false;
  if (chapterIds.size !== chapters.length
    || new Set(materials.map((material) => (material as StudyMaterial).id)).size !== materials.length
    || questionIds.size !== value.questions.length) return false;
  try {
    parseProgressImport(
      JSON.stringify(createProgressExport(value.progress as unknown as Progress)),
      value.questions.map((question) => ({
        id: (question as StudyQuestion).id,
        kind: (question as StudyQuestion).kind,
      })),
    );
  } catch {
    return false;
  }
  return true
}

export function createDefaultSpace(
  legacyProgress: unknown,
  legacyQuestions: StudyQuestion[],
  transferTask?: Course["transferTask"],
  legacyChapters: Array<{ number: number; title: string }> = [],
): StudySpace {
  const now = new Date().toISOString();
  const abwl: Course = {
    id: "course-abwl",
    name: "ABWL",
    archived: false,
    createdAt: now,
    materials: [],
    chapters: legacyChapters.map((chapter) => ({
      id: `chapter-${chapter.number}`,
      title: chapter.title,
      sections: [],
    })),
    questions: legacyQuestions,
    progress: migrateStoredProgress(legacyProgress, legacyQuestions),
    ...(transferTask ? { transferTask } : {}),
  };
  return {
    format: STUDY_SPACE_FORMAT,
    version: STUDY_SPACE_VERSION,
    activeCourseId: null,
    courses: [abwl],
  };
}

export function parseStudySpace(text: string): StudySpace {
  if (text.length > 20_000_000) throw new Error("Die Study-Space-Sicherung ist zu groß (maximal 20 MB).");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }
  if (!isRecord(parsed) || parsed.format !== STUDY_SPACE_FORMAT || parsed.version !== STUDY_SPACE_VERSION
    || !Array.isArray(parsed.courses) || parsed.courses.length > 100
    || (parsed.activeCourseId !== null && typeof parsed.activeCourseId !== "string")
    || !parsed.courses.every(validateCourse)
    || new Set(parsed.courses.map((course) => (course as Course).id)).size !== parsed.courses.length
    || parsed.activeCourseId !== null && !parsed.courses.some((course) => (course as Course).id === parsed.activeCourseId)) {
    throw new Error("Die Study-Space-Sicherung hat ein ungültiges Format oder enthält fehlerhafte Fächer.");
  }
  return parsed as unknown as StudySpace;
}

export function mergeStudySpace(current: StudySpace, imported: StudySpace): StudySpace {
  const existingIds = new Set(current.courses.map((course) => course.id));
  const duplicate = imported.courses.find((course) => existingIds.has(course.id));
  if (duplicate) {
    throw new Error(`Das Fach „${duplicate.name}“ (ID ${duplicate.id}) ist bereits vorhanden. Es wurde nichts importiert.`);
  }
  return {
    ...current,
    courses: [
      ...current.courses,
      ...imported.courses.map((course) => ({
        ...course,
        materials: course.materials.map((material) => ({ ...material, status: "missing" as const })),
      })),
    ],
  };
}

export function parseContentPackage(
  text: string,
  course: Course,
): ContentImportPreview {
  if (text.length > 5_000_000) throw new Error("Das Lerninhalte-Paket ist zu groß (maximal 5 MB).");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }
  if (!isRecord(parsed)
    || !hasOnlyKeys(parsed, ["format", "version", "courseId", "chapters", "items"])
    || parsed.format !== CONTENT_PACKAGE_FORMAT
    || parsed.version !== CONTENT_PACKAGE_VERSION) {
    throw new Error(`Unbekanntes Paketformat. Erwartet wird „${CONTENT_PACKAGE_FORMAT}“, Version ${CONTENT_PACKAGE_VERSION}.`);
  }
  if (parsed.courseId !== undefined && parsed.courseId !== course.id) {
    throw new Error("Das Paket ist einem anderen Fach zugeordnet. Wähle das passende Fach aus.");
  }
  if (!Array.isArray(parsed.chapters) || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("Das Paket benötigt mindestens ein Kapitel und einen Lerninhalt.");
  }
  const chapters: StudyChapter[] = [];
  const chapterIds = new Set<string>();
  for (const raw of parsed.chapters) {
    if (!isRecord(raw) || !hasOnlyKeys(raw, ["id", "title", "sections"])
      || typeof raw.id !== "string" || !raw.id.trim() || raw.id !== raw.id.trim()
      || typeof raw.title !== "string" || !raw.title.trim()
      || chapterIds.has(raw.id)
      || raw.sections !== undefined && (!Array.isArray(raw.sections)
        || !raw.sections.every((section) => isRecord(section)
          && hasOnlyKeys(section, ["id", "title"])
          && typeof section.id === "string" && Boolean(section.id.trim()) && section.id === section.id.trim()
          && typeof section.title === "string" && Boolean(section.title.trim())))) {
      throw new Error("Mindestens ein Kapitel oder Abschnitt ist ungültig oder doppelt.");
    }
    chapterIds.add(raw.id);
    const sections = (raw.sections ?? []) as Array<{ id: string; title: string }>;
    if (new Set(sections.map((section) => section.id)).size !== sections.length) {
      throw new Error(`Kapitel „${raw.title}“ enthält doppelte Abschnitts-IDs.`);
    }
    chapters.push({ id: raw.id, title: raw.title.trim(), sections: sections.map((section) => ({ id: section.id, title: section.title.trim() })) });
  }
  const existingChapterIds = new Set(course.chapters.map((chapter) => chapter.id));
  const duplicateChapter = chapters.find((chapter) => existingChapterIds.has(chapter.id));
  if (duplicateChapter) throw new Error(`Kapitel-ID „${duplicateChapter.id}“ ist bereits im Fach vorhanden.`);

  const existingQuestionIds = new Set(course.questions.map((question) => question.id));
  const incomingIds = new Set<string>();
  const materialNames = new Set<string>();
  const questions = parsed.items.map((raw): StudyQuestion => {
    if (!isRecord(raw)
      || !hasOnlyKeys(raw, [
        "id", "kind", "prompt", "answer", "options", "correctOption", "explanation",
        "shortExplanation", "keyTerms", "examples", "chapterId", "sectionId",
        "questionType", "uncertain", "source",
      ])
      || typeof raw.id !== "string" || !raw.id.trim()
      || raw.id !== raw.id.trim()
      || incomingIds.has(raw.id) || existingQuestionIds.has(raw.id)) {
      throw new Error(`Lerninhalt-ID „${isRecord(raw) && typeof raw.id === "string" ? raw.id : "(fehlend)"}“ ist ungültig, doppelt oder bereits vorhanden. Es wurde nichts importiert.`);
    }
    incomingIds.add(raw.id);
    if ((raw.kind !== "flashcard" && raw.kind !== "quiz")
      || typeof raw.prompt !== "string" || !raw.prompt.trim()
      || typeof raw.chapterId !== "string" || !chapterIds.has(raw.chapterId)
      || raw.sectionId !== undefined && (typeof raw.sectionId !== "string"
        || !chapters.find((chapter) => chapter.id === raw.chapterId)?.sections.some((section) => section.id === raw.sectionId))
      || raw.questionType !== undefined && (typeof raw.questionType !== "string" || !raw.questionType.trim())
      || raw.uncertain !== undefined && typeof raw.uncertain !== "boolean"
      || raw.answer !== undefined && typeof raw.answer !== "string"
      || raw.options !== undefined && (!Array.isArray(raw.options) || !raw.options.every((option) => typeof option === "string"))
      || raw.correctOption !== undefined && !Number.isSafeInteger(raw.correctOption)) {
      throw new Error(`Lerninhalt „${raw.id}“ hat ungültige Felder oder verweist auf ein unbekanntes Kapitel/Abschnitt.`);
    }
    if (raw.kind === "flashcard" && (typeof raw.answer !== "string" || !raw.answer.trim())) {
      throw new Error(`Lernkarte „${raw.id}“ benötigt eine Antwort.`);
    }
    if (raw.kind === "quiz"
      && (!Array.isArray(raw.options)
        || raw.options.length < 2
        || !raw.options.every((option) => typeof option === "string" && Boolean(option.trim()))
        || !Number.isInteger(raw.correctOption)
        || Number(raw.correctOption) < 0
        || Number(raw.correctOption) >= raw.options.length)) {
      throw new Error(`Quizfrage „${raw.id}“ benötigt mindestens zwei Antwortoptionen und einen gültigen Index der richtigen Antwort.`);
    }
    if (raw.explanation !== undefined && typeof raw.explanation !== "string"
      || raw.shortExplanation !== undefined && typeof raw.shortExplanation !== "string"
      || raw.keyTerms !== undefined && (!Array.isArray(raw.keyTerms) || !raw.keyTerms.every((term) => typeof term === "string"))
      || raw.examples !== undefined && (!Array.isArray(raw.examples) || !raw.examples.every((example) => typeof example === "string"))) {
      throw new Error(`Erklärung, Begriffe oder Beispiele bei „${raw.id}“ haben einen ungültigen Datentyp.`);
    }
    if (!isRecord(raw.source)
      || !hasOnlyKeys(raw.source, ["materialId", "fileName", "page"])) {
      throw new Error(`Lerninhalt „${raw.id}“ benötigt eine positive ganzzahlige Quellseite.`);
    }
    const source = raw.source;
    if (!Number.isSafeInteger(source.page) || Number(source.page) < 1) {
      throw new Error(`Lerninhalt „${raw.id}“ benötigt eine positive ganzzahlige Quellseite.`);
    }
    if (source.materialId !== undefined && typeof source.materialId !== "string"
      || source.fileName !== undefined && typeof source.fileName !== "string") {
      throw new Error(`Die Quellenangabe von „${raw.id}“ ist ungültig.`);
    }
    const sourceMaterialId = typeof source.materialId === "string" ? source.materialId : undefined;
    const material = sourceMaterialId
      ? course.materials.find((item) => item.id === sourceMaterialId)
      : typeof source.fileName === "string"
        ? course.materials.find((item) => item.fileName === source.fileName)
        : undefined;
    if (sourceMaterialId && !material
      || material && typeof source.fileName === "string" && source.fileName !== material.fileName
      || !material && (typeof source.fileName !== "string" || !source.fileName.trim())) {
      throw new Error(`Die Quelle von „${raw.id}“ muss eine Datei und Seite angeben oder auf vorhandenes Material dieses Fachs verweisen.`);
    }
    const sourceFileName = material?.fileName
      ?? (typeof source.fileName === "string" ? source.fileName.trim() : "");
    materialNames.add(sourceFileName);
    const chapter = chapters.find((item) => item.id === raw.chapterId)!;
    const section = typeof raw.sectionId === "string"
      ? chapter.sections.find((item) => item.id === raw.sectionId)?.title
      : undefined;
    return {
      id: raw.id,
      kind: raw.kind,
      prompt: raw.prompt.trim(),
      ...(typeof raw.answer === "string" ? { answer: raw.answer } : {}),
      ...(Array.isArray(raw.options) ? { options: raw.options as string[] } : {}),
      ...(Number.isInteger(raw.correctOption) ? { correctOption: Number(raw.correctOption) } : {}),
      ...(typeof raw.explanation === "string" ? { explanation: raw.explanation } : {}),
      ...(typeof raw.shortExplanation === "string" ? { shortExplanation: raw.shortExplanation } : {}),
      ...(Array.isArray(raw.keyTerms) ? { keyTerms: raw.keyTerms as string[] } : {}),
      ...(Array.isArray(raw.examples) ? { examples: raw.examples as string[] } : {}),
      chapter: chapter.title,
      chapterNumber: chapters.findIndex((item) => item.id === chapter.id) + 1,
      ...(section ? { section } : {}),
      questionType: typeof raw.questionType === "string" ? raw.questionType : raw.kind === "quiz" ? "Multiple Choice" : "Lernkarte",
      sourcePages: [Number(source.page)],
      ...(material ? { sourceMaterialId: material.id } : {}),
      sourceFileName,
      placeholder: false,
      uncertain: raw.uncertain === true,
    };
  });
  return {
    courseId: course.id,
    chapters,
    questions,
    materialNames: [...materialNames],
    flashcardCount: questions.filter((question) => question.kind === "flashcard").length,
    quizCount: questions.filter((question) => question.kind === "quiz").length,
  };
}

export function applyContentImport(course: Course, preview: ContentImportPreview): Course {
  if (preview.courseId !== course.id) throw new Error("Die Vorschau gehört nicht zum ausgewählten Fach.");
  const existingIds = new Set(course.questions.map((question) => question.id));
  if (preview.questions.some((question) => existingIds.has(question.id))) {
    throw new Error("Ein Lerninhalt ist inzwischen bereits vorhanden. Bitte Paket erneut prüfen.");
  }
  const existingChapterIds = new Set(course.chapters.map((chapter) => chapter.id));
  if (preview.chapters.some((chapter) => existingChapterIds.has(chapter.id))) {
    throw new Error("Eine Kapitel-ID ist inzwischen bereits vorhanden. Bitte Paket erneut prüfen.");
  }
  if (preview.questions.some((question) =>
    !Number.isSafeInteger(question.sourcePages[0]) || question.sourcePages[0] < 1
    || !question.sourceFileName?.trim()
    || question.sourceMaterialId !== undefined && !course.materials.some((material) =>
      material.id === question.sourceMaterialId && material.fileName === question.sourceFileName))) {
    throw new Error("Eine Quellenangabe ist ungültig. Bitte Paket erneut prüfen.");
  }
  return {
    ...course,
    chapters: [...course.chapters, ...preview.chapters],
    questions: [...course.questions, ...preview.questions],
  };
}

export function createStudySpaceBackup(space: StudySpace): string {
  return JSON.stringify(space, null, 2);
}
````

### `src/App.tsx`

````tsx
import { useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import rawContent from "./content/fragen.json";
import {
  applyContentImport,
  createDefaultSpace,
  createStudySpaceBackup,
  mergeStudySpace,
  parseContentPackage,
  parseStudySpace,
  STUDY_SPACE_KEY,
  type ContentImportPreview,
  type Course,
  type StudyQuestion,
  type StudySpace,
} from "./studySpace";
import {
  createProgressExport,
  appendHistory,
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
  PRIMARY_NAVIGATION,
  SECTION_VIEWS,
  sectionForView,
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
  chapterNumber?: number;
  section?: string;
  questionType: string;
  sourcePages: number[];
  sourceFileName?: string;
  placeholder: boolean;
  uncertain: boolean;
};

type Chapter = { number: number; title: string };
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
  overview: "Übersicht",
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

function readStudySpace(): { space: StudySpace; warning: boolean; fatalError: string; migratedLegacy: boolean } {
  try {
    const storedSpace = window.localStorage.getItem(STUDY_SPACE_KEY);
    if (storedSpace) return { space: parseStudySpace(storedSpace), warning: false, fatalError: "", migratedLegacy: false };
    const legacy = readProgress();
    if (legacy.warning) {
      return {
        space: createDefaultSpace(null, legacyQuestions, legacyContent.transferTask, legacyContent.chapters),
        warning: false,
        fatalError: "Der bestehende ABWL-Lernstand konnte nicht sicher geprüft werden. Er wurde nicht überschrieben.",
        migratedLegacy: false,
      };
    }
    const hasLegacyData = window.localStorage.getItem(STORAGE_KEY) !== null;
    return {
      space: createDefaultSpace(legacy.progress, legacyQuestions, legacyContent.transferTask, legacyContent.chapters),
      warning: legacy.warning,
      fatalError: "",
      migratedLegacy: hasLegacyData && !legacy.warning,
    };
  } catch (error) {
    return {
      space: createDefaultSpace(null, legacyQuestions, legacyContent.transferTask),
      warning: false,
      fatalError: error instanceof Error ? error.message : "Der Study Space konnte nicht geladen werden.",
      migratedLegacy: false,
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
  setProgress: Dispatch<SetStateAction<Progress>>;
  onCourseChange: (update: (course: Course) => Course) => void;
  onBack: () => void;
  saveWarning: boolean;
  setSaveWarning: (warning: boolean) => void;
};

function App() {
  const [initial] = useState(readStudySpace);
  const [space, setSpace] = useState(initial.space);
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
    if (storageError) return;
    try {
      window.localStorage.setItem(STUDY_SPACE_KEY, createStudySpaceBackup(space));
      if (initial.migratedLegacy) window.localStorage.removeItem(STORAGE_KEY);
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [space, storageError]);

  const updateCourse = (courseId: string, update: (course: Course) => Course) => {
    setSpace((previous) => ({
      ...previous,
      courses: previous.courses.map((course) => course.id === courseId ? update(course) : course),
    }));
  };
  const chooseCourse = (courseId: string) => {
    setSpace((previous) => ({ ...previous, activeCourseId: courseId }));
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
    setSpace((previous) => ({ ...previous, courses: [...previous.courses, course] }));
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
    updateCourse(course.id, (current) => ({ ...current, name }));
    setRenamingCourseId(null);
    setWorkspaceMessage(`Fach wurde in „${name}“ umbenannt.`);
    setWorkspaceError(false);
  }

  function removeCourse(course: Course) {
    if (!window.confirm(`Fach „${course.name}“ und seinen Lernstand wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden. Eventuell früher abgelegte PDFs bleiben unangetastet in IndexedDB dieses Browsers.`)) return;
    setSpace((previous) => ({
      ...previous,
      activeCourseId: previous.activeCourseId === course.id ? null : previous.activeCourseId,
      courses: previous.courses.filter((item) => item.id !== course.id),
    }));
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
      setSpace(storageError ? imported : mergeStudySpace(space, imported));
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
    const setCourseProgress: Dispatch<SetStateAction<Progress>> = (update) => {
      updateCourse(activeCourse.id, (course) => ({
        ...course,
        progress: typeof update === "function" ? update(course.progress) : update,
      }));
    };
    return (
      <CourseApp
        key={activeCourse.id}
        course={activeCourse}
        progress={activeCourse.progress}
        setProgress={setCourseProgress}
        onCourseChange={(update) => updateCourse(activeCourse.id, update)}
        onBack={() => setSpace((previous) => ({ ...previous, activeCourseId: null }))}
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
      {storageWarning && <p className="save-warning" role="alert">Der Study Space konnte nicht vollständig lokal gespeichert oder migriert werden. Prüfe den verfügbaren lokalen Speicher.</p>}
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
    questions: course.questions.map((question) => ({
      ...question,
      chapterNumber: question.chapterNumber
        ?? (course.chapters.findIndex((chapter) => chapter.title === question.chapter) + 1 || undefined),
    })),
    chapters: course.chapters.map((chapter, index) => ({ number: index + 1, title: chapter.title })),
    transferTask: course.transferTask,
  };
  const questions = content.questions;
  const chapterCatalog = content.chapters;
  const [view, setView] = useState<View>("overview");
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
  const chapters = chapterCatalog.map((chapter) => chapter.title);
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
  const chapterForQuestion = (question: Question) =>
    chapterCatalog.find((chapter) => chapter.number === question.chapterNumber)?.title
    ?? chapterCatalog.find((chapter) => new RegExp(`^Kapitel\\s+${chapter.number}\\b`, "i").test(question.chapter))?.title
    ?? (chapterCatalog.some((chapter) => chapter.title === question.chapter) ? question.chapter : "");
  const availableTopics = useMemo(
    () => [...new Set(usableQuestions.map(chapterForQuestion).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de")),
    [usableQuestions],
  );
  const sessionCandidateCount = usableQuestions.filter((question) =>
    (progress.sessionPreferences.topics.length === 0
      || progress.sessionPreferences.topics.includes(chapterForQuestion(question)))
    && (question.kind === "quiz"
      ? progress.sessionPreferences.modes.includes("quiz")
      : progress.sessionPreferences.modes.some((mode) => mode === "lernen" || mode === "karten")),
  ).length;
  const examCandidateCount = usableQuestions.filter((question) =>
    question.kind === "quiz"
    && (progress.sessionPreferences.examTopics.length === 0
      || progress.sessionPreferences.examTopics.includes(chapterForQuestion(question))),
  ).length;
  const matchesTopic = (question: Question) =>
    (chapterFilter === "Alle Themen" || chapterForQuestion(question) === chapterFilter)
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
  const masteredChapters = chapterCatalog.filter((chapter) => {
    const topicQuestions = usableQuestions.filter((question) => chapterForQuestion(question) === chapter.title);
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
  const activeSubView = (subview: View) =>
    view === subview
    || subview === "sessions" && (view === "studySession" || view === "studySummary")
    || subview === "examSetup" && view === "exam";
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
        chapter: chapterForQuestion(question),
        section: question.section,
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
        questionCount: progress.sessionPreferences.durationMinutes === null ? progress.sessionPreferences.questionCount : 100,
      },
    );
    if (!selectedItems.length) return;
    const now = new Date();
    setProgress((previous) => ({
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
    }));
    setCurrentIndex(0);
    setView("studySession");
    setAnnouncement(`Lernsitzung gestartet mit ${selectedItems.length} Fragen.`);
  }

  function startExam(questionIds?: string[], retryMissed = false) {
    if (progress.unfinishedSession && !progress.unfinishedSession.submitted) return;
    const pool = usableQuestions.filter((question) =>
      question.kind === "quiz"
      && (questionIds ? questionIds.includes(question.id) : (
        progress.sessionPreferences.examTopics.length === 0
        || progress.sessionPreferences.examTopics.includes(chapterForQuestion(question))
      )),
    );
    const selectedQuestions = makeExamSelection(
      pool,
      questionIds ? questionIds.length : progress.sessionPreferences.examCount,
    );
    if (!selectedQuestions.length) return;
    const now = new Date();
    setProgress((previous) => ({
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
    }));
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
    setProgress((previous) => ({
      ...previous,
      unfinishedSession: null,
      history: appendHistory(previous.history, entry),
    }));
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
      setProgress((previous) => ({
        ...previous,
        unfinishedSession: null,
        history: appendHistory(previous.history, entry),
      }));
      setCompletedSummary(entry);
      setView("studySummary");
      setFocusRequest((request) => request + 1);
      setAnnouncement(`${outcome} Lernsitzung abgeschlossen: ${entry.attempted} Fragen bearbeitet, ${entry.correct} sicher beantwortet.`);
      return;
    }
    const nextIndex = session.index + 1;
    const nextQuestion = usableQuestions.find((question) => question.id === session.items[nextIndex]?.questionId);
    setProgress((previous) => ({
      ...previous,
      unfinishedSession: previous.unfinishedSession
        ? { ...previous.unfinishedSession, index: nextIndex, answers }
        : null,
    }));
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
    setProgress((previous) => previous.unfinishedSession?.type === "exam"
      ? completeExamProgress(previous, previous.unfinishedSession, new Date())
      : previous);
    setSelectedOption(null);
    setFocusRequest((request) => request + 1);
    setAnnouncement(`Prüfung abgegeben. ${correct} von ${session.items.length} richtig. Die Ergebnisse verändern deinen Lernfortschritt nicht.`);
  }

  function answerExam(question: Question, optionIndex: number) {
    const session = progress.unfinishedSession;
    if (!session || session.type !== "exam" || session.submitted || session.answers[question.id]) return;
    const isCorrect = optionIndex === question.correctOption;
    setProgress((previous) => ({
      ...previous,
      unfinishedSession: previous.unfinishedSession
        ? {
            ...previous.unfinishedSession,
            answers: {
              ...previous.unfinishedSession.answers,
              [question.id]: { selectedOption: optionIndex, isCorrect },
            },
          }
        : null,
    }));
    const nextQuestion = usableQuestions.find((candidate) => candidate.id === session.items[session.index + 1]?.questionId);
    setAnnouncement(`Antwort gespeichert. ${Object.keys(session.answers).length + 1} von ${session.items.length} beantwortet. Richtig/Falsch wird erst nach Abgabe angezeigt. ${nextQuestion ? `Nächste Prüfungsfrage: ${nextQuestion.prompt}` : "Letzte Frage beantwortet; du kannst die Prüfung abgeben."}`);
    if (session.index + 1 < session.items.length) {
      const nextIndex = session.index + 1;
      setProgress((previous) => ({
        ...previous,
        unfinishedSession: previous.unfinishedSession
          ? { ...previous.unfinishedSession, index: nextIndex }
          : null,
      }));
      setCurrentIndex(nextIndex);
      setFocusRequest((request) => request + 1);
    }
  }

  function toggleBookmark(questionId: string) {
    setProgress((previous) => ({
      ...previous,
      bookmarks: previous.bookmarks.includes(questionId)
        ? previous.bookmarks.filter((id) => id !== questionId)
        : [...previous.bookmarks, questionId],
    }));
    setAnnouncement(progress.bookmarks.includes(questionId) ? "Lesezeichen entfernt." : "Frage gespeichert.");
  }

  function saveNote(questionId: string, value = noteDraft) {
    setProgress((previous) => {
      const notes = { ...previous.notes };
      if (value.trim()) notes[questionId] = value.trim();
      else delete notes[questionId];
      return { ...previous, notes };
    });
    setAnnouncement(value.trim() ? "Notiz gespeichert." : "Notiz gelöscht.");
  }

  function updateDailyGoal(update: Partial<Progress["dailyGoal"]>) {
    setProgress((previous) => ({
      ...previous,
      dailyGoal: { ...previous.dailyGoal, ...update },
    }));
  }

  function abandonSession() {
    setProgress((previous) => ({ ...previous, unfinishedSession: null }));
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
        setProgress((previous) => ({
          ...previous,
          unfinishedSession: previous.unfinishedSession
            ? { ...previous.unfinishedSession, index: nextIndex }
            : null,
        }));
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
        setProgress((previous) => ({
          ...previous,
          unfinishedSession: previous.unfinishedSession
            ? { ...previous.unfinishedSession, index: nextIndex }
            : null,
        }));
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
      setProgress((previous) => ({
        ...previous,
        unfinishedSession: previous.unfinishedSession
          ? { ...previous.unfinishedSession, index: previousIndex }
          : null,
      }));
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
    setQueueQuizFeedback(null);
    const confidenceNote = confidenceValue ? ` Sicherheit: ${confidenceValue}.` : "";
    const outcome = (rating === "sicher"
      ? `${review.streak >= 2 ? "Sichere Erinnerung erfasst." : "Erste sichere Erinnerung erfasst."} Nächste Wiederholung: ${dueLabel(review.dueDate, todayLocalDate(reviewedAt))}.`
      : `${rating === "unsicher" ? "Als unsicher markiert." : "Zur Wiederholung vorgemerkt."} Nächste Wiederholung: ${dueLabel(review.dueDate, todayLocalDate(reviewedAt))}.`) + confidenceNote;
    setProgress((previous) => {
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
    });
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
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === question.correctOption;
    const reviewedAt = new Date();
    const todayDate = todayLocalDate(reviewedAt);
    const key = reviewKey("quiz", question.id);
    const previousReview = progress.reviews[key];
    const review = scheduleReview(previousReview, isCorrect ? "sicher" : "noch einmal", reviewedAt, confidence);

    setProgress((previous) => {
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
    });
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
      const imported = parseProgressImport(
        await file.text(),
        usableQuestions.map(({ id, kind }) => ({ id, kind })),
      );
      setProgress(imported);
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
    setProgress(emptyProgress);
    setSaveWarning(false);
    setImportMessage(`Lernstand für „${course.name}“ wurde zurückgesetzt.`);
    setImportError(false);
    setAnnouncement(`Lernstand für ${course.name} zurückgesetzt.`);
  }

  async function inspectContentPackage(file: File | undefined) {
    if (!file) return;
    try {
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
      onCourseChange(() => updated);
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
    chapterForQuestion(question) === chapter.title && matchesSearch(question));

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
        <nav className="mode-nav" aria-label="Hauptnavigation">
          {PRIMARY_NAVIGATION.map((item) => (
            <button
              aria-label={item.id === "review"
                ? `${item.label}: ${dueItems.length} fällige Wiederholungen gesamt, davon ${overdueCount} überfällig`
                : undefined}
              aria-current={activeSection === item.id ? "page" : undefined}
              className={activeSection === item.id ? "mode-link active" : "mode-link"}
              key={item.id}
              onClick={() => changeView(item.view)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "review" && <span className="nav-count" aria-hidden="true">{dueItems.length}</span>}
            </button>
          ))}
        </nav>
        <nav className="section-subnav" aria-label={`${PRIMARY_NAVIGATION.find((item) => item.id === activeSection)?.label ?? "Bereich"} Unteransichten`}>
          {SECTION_VIEWS[activeSection].map(({ view: subview, label }) => (
            <button
              aria-current={view === subview ? "page" : undefined}
              className={activeSubView(subview) ? "section-subnav-link active" : "section-subnav-link"}
              key={subview}
              onClick={() => changeView(subview)}
            >{label}</button>
          ))}
        </nav>

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

        {saveWarning && <div className="save-warning" role="status">Der Lernstand konnte nicht vollständig lokal gespeichert oder migriert werden.</div>}
        <span className="visually-hidden" role="status" aria-live="polite">{announcement}</span>

        {view === "overview" && (
          <>
            <section className="overview-stats" aria-label="Lernfortschritt auf einen Blick">
              <article className="stat-card"><span>Heute fällig</span><strong>{dueTodayCount}</strong><small>Fälligkeit am heutigen Kalendertag</small></article>
              <article className="stat-card"><span>Überfällig</span><strong>{overdueCount}</strong><small>vor dem heutigen Datum fällig</small></article>
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
                const percent = items.length ? Math.round(mastered / items.length * 100) : 0;
                const sections = [...new Set(items.map((question) => question.section || question.questionType))];
                return (
                  <article className="topic-card" key={chapter.number}>
                    <div className="topic-card-top">
                      <span className="tag">Themenbereich {chapter.number}</span>
                      <span className="topic-progress-label">{mastered}/{items.length} sicher</span>
                    </div>
                    <h3>{chapter.title}</h3>
                    {items.length > 0 ? (
                      <>
                        <p>{items.length} belegte Lernziele · {percent}% gefestigt</p>
                        <div className="topic-progress" role="progressbar" aria-label={`${chapter.title}: ${mastered} von ${items.length} Lernzielen sicher`} aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={mastered}>
                          <span style={{ width: `${percent}%` }} />
                        </div>
                        <ul className="section-progress-list">
                          {sections.map((section) => {
                            const sectionQuestions = items.filter((question) => (question.section || question.questionType) === section);
                            const sectionMastered = sectionQuestions.filter((question) =>
                              scheduleModes(question).some((mode) => isKnown(question, mode)),
                            ).length;
                            return <li key={section}><span>{section}</span><span>{sectionMastered}/{sectionQuestions.length} sicher</span></li>;
                          })}
                        </ul>
                      </>
                    ) : (
                      <p className="topic-empty-note">Noch nicht mit belegten Lerninhalten aus dem Foliensatz gefüllt.</p>
                    )}
                    <div className="topic-card-footer">
                      <span>{items.length ? `${sections.length} Abschnitte` : "Noch keine Fragen für dieses Kapitel"}</span>
                      <button className="button secondary" onClick={() => openTopic(chapter.title)}>Kapitel ansehen <span aria-hidden="true">→</span></button>
                    </div>
                  </article>
                );
              })}
            </div>
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
            <section className="next-step-panel">
              <div><span className="eyebrow">Nächster Schritt</span><h2>{nextStep.title}</h2>
                {resumableSession && <p>{resumableSession.type === "study" ? "Eine Lernsitzung ist noch offen." : "Eine Prüfungssimulation ist noch offen."}</p>}
              </div>
              {nextStep.action && <button className="button reveal-button" onClick={nextStep.run}>{nextStep.action} <span aria-hidden="true">→</span></button>}
            </section>
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
                    {availableTopics.length ? availableTopics.map((topic) => <label className="check-option" key={topic}><input type="checkbox" checked={progress.sessionPreferences.topics.includes(topic)} onChange={() => updateSessionPreferences({ topics: progress.sessionPreferences.topics.includes(topic) ? progress.sessionPreferences.topics.filter((value) => value !== topic) : [...progress.sessionPreferences.topics, topic] })} /><span>{topic}</span></label>) : <p>Für die vorhandenen Fragen ist noch kein geprüftes Thema zugeordnet.</p>}
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
                    {availableTopics.map((topic) => <label className="check-option" key={topic}><input type="checkbox" checked={progress.sessionPreferences.examTopics.includes(topic)} onChange={() => updateSessionPreferences({ examTopics: progress.sessionPreferences.examTopics.includes(topic) ? progress.sessionPreferences.examTopics.filter((value) => value !== topic) : [...progress.sessionPreferences.examTopics, topic] })} /><span>{topic}</span></label>)}
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
            <span className="eyebrow">Kapitelansicht</span>
            <h2>{chapterFilter}</h2>
            <p>{usableQuestions.some((question) => chapterForQuestion(question) === chapterFilter)
              ? "Die folgenden Lernziele, Zusammenfassungen und Begriffe stammen ausschließlich aus belegten Einträgen. Die Folienangaben erscheinen direkt an der Frage."
              : `Für ${chapterFilter} liegen noch keine am Original-Foliensatz geprüften Lernziele oder Zusammenfassungen vor. Prüfe Kapitelname und Foliengliederung an der Originalquelle außerhalb der App.`}</p>
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
                <button className="button secondary" onClick={() => { setProgress((previous) => ({ ...previous, unfinishedSession: null })); setView("overview"); }}>Zum Lernpfad</button>
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
              <label><span>Thema</span><select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)}><option>Alle Themen</option>{chapters.map((chapter) => <option key={chapter}>{chapter}</option>)}</select></label>
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
                const items = usableQuestions.filter((question) => chapterForQuestion(question) === chapter.title);
                const mastered = items.filter((question) =>
                  scheduleModes(question).some((mode) => isKnown(question, mode)),
                ).length;
                const sections = [...new Set(items.map((question) => question.section || question.questionType))];
                return (
                  <article className="progress-topic" key={chapter.number}>
                    <div className="progress-topic-detail">
                      <h3>{chapter.title}</h3>
                      {items.length ? (
                        <>
                          <p>{mastered} von {items.length} Lernzielen zweimal sicher erinnert</p>
                          <ul className="section-progress-list">
                            {sections.map((section) => {
                              const sectionQuestions = items.filter((question) => (question.section || question.questionType) === section);
                              const sectionMastered = sectionQuestions.filter((question) =>
                                scheduleModes(question).some((mode) => isKnown(question, mode)),
                              ).length;
                              return <li key={section}><span>{section}</span><span>{sectionMastered}/{sectionQuestions.length} sicher</span></li>;
                            })}
                          </ul>
                        </>
                      ) : <p>Noch keine belegten Lerninhalte hinterlegt.</p>}
                    </div>
                    <div className="topic-progress" role="progressbar" aria-label={`${chapter.title}: ${mastered} von ${items.length} Lernzielen sicher`} aria-valuemin={0} aria-valuemax={items.length || 1} aria-valuenow={mastered}><span style={{ width: `${items.length ? mastered / items.length * 100 : 0}%` }} /></div>
                    <span className="topic-progress-label">{items.length ? Math.round(mastered / items.length * 100) : "—"}</span>
                  </article>
                );
              })}
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
                <h3 id="package-preview-title">{contentPreview.questions.length} Lerninhalte für {course.name}</h3>
                <div className="overview-stats">
                  <article className="stat-card"><span>Lernkarten</span><strong>{contentPreview.flashcardCount}</strong></article>
                  <article className="stat-card"><span>Quizfragen</span><strong>{contentPreview.quizCount}</strong></article>
                  <article className="stat-card"><span>Kapitel</span><strong>{contentPreview.chapters.length}</strong></article>
                </div>
                <h4>Kapitel und Abschnitte</h4>
                <ul className="package-list">{contentPreview.chapters.map((chapter) => <li key={chapter.id}><strong>{chapter.title}</strong>{chapter.sections.length > 0 && <span>{chapter.sections.map((section) => section.title).join(" · ")}</span>}</li>)}</ul>
                <h4>Im Paket angegebene Quellen und Seiten</h4>
                <ul className="package-list">{contentPreview.questions.map((question) => <li key={question.id}><span>{question.prompt}</span><small>{question.sourceFileName} · S. {question.sourcePages.join(", ")}</small></li>)}</ul>
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
````

### `src/styles.css`

````css
:root {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #202925;
  background: #f3f5f2;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --ink: #202925;
  --muted: #6c7970;
  --line: #e0e6df;
  --paper: #fff;
  --green: #25684f;
  --green-dark: #182b26;
  --green-soft: #e3f1e9;
  --coral: #a14f3f;
  --amber: #8b672c;
}

* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; }
button, select, input { font: inherit; }
button { color: inherit; }
button:focus-visible, select:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #bd8130; outline-offset: 3px; }
a { color: inherit; text-decoration: none; }
code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .92em; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }

.app-shell { min-height: 100vh; }
.sidebar { position: fixed; inset: 0 auto 0 0; z-index: 2; display: flex; flex-direction: column; width: 246px; padding: 25px 17px 18px; color: #eaf1ec; background: var(--green-dark); }
.brand { display: flex; align-items: center; gap: 11px; padding: 2px 8px 38px; font-size: 15px; font-weight: 750; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #173129; background: #9bd6b4; font-family: Georgia, serif; font-size: 21px; }
.brand-light { color: #afc0b5; font-weight: 450; }
.sidebar-label { margin: 0 10px 9px; color: #a6b8ab; font-size: 12px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; }
.mode-nav { display: grid; gap: 5px; }
.mode-link { display: flex; align-items: center; gap: 11px; width: 100%; min-height: 44px; padding: 9px 10px; border: 0; border-radius: 8px; color: #c0cec4; background: transparent; text-align: left; cursor: pointer; }
.mode-link:hover { background: rgba(255,255,255,.08); }
.mode-link.active { color: #f4fbf5; background: #28463b; box-shadow: inset 3px 0 #8dd2a8; }
.nav-icon { display: inline-grid; place-items: center; width: 20px; color: #a8d5b8; font-size: 17px; }
.nav-count { margin-left: auto; min-width: 24px; padding: 2px 6px; border-radius: 20px; color: #d2e0d6; background: rgba(255,255,255,.1); font-size: 11px; text-align: center; }
.section-subnav { display: grid; gap: 3px; margin: 11px 0 0 27px; padding-left: 10px; border-left: 1px solid rgba(202,225,208,.25); }
.section-subnav-link { min-height: 38px; padding: 7px 9px; border: 0; border-radius: 7px; color: #bdcbc1; background: transparent; font-size: 13px; text-align: left; cursor: pointer; }
.section-subnav-link:hover { color: #f4fbf5; background: rgba(255,255,255,.07); }
.section-subnav-link.active { color: #eff8f0; background: rgba(141,210,168,.13); }
.sidebar-bottom { margin-top: auto; }
.progress-card { padding: 15px 13px 12px; border: 1px solid rgba(202,225,208,.17); border-radius: 11px; background: rgba(255,255,255,.055); }
.progress-card-top { display: flex; justify-content: space-between; margin-bottom: 12px; color: #d0ddd3; font-size: 12px; }
.progress-track, .topic-progress { height: 6px; overflow: hidden; border-radius: 9px; background: rgba(255,255,255,.18); }
.progress-track > span, .topic-progress > span { display: block; height: 100%; border-radius: inherit; background: #92d4a9; transition: width .2s ease; }
.progress-card p { margin: 9px 0 0; color: #b2c3b7; font-size: 12px; line-height: 1.5; }
.local-label { margin: 16px 8px 0; color: #bdcbbf; font-size: 12px; }
.local-label span { margin-right: 5px; color: #95d7a9; font-size: 9px; }

.main-content { max-width: 1440px; min-height: 100vh; margin-left: 246px; padding: 0 clamp(24px, 5vw, 76px) 30px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 70px; border-bottom: 1px solid var(--line); }
.breadcrumb { color: #68756d; font-size: 13px; }
.breadcrumb span { padding: 0 8px; color: #8c978f; }
.breadcrumb strong { color: #37433b; font-weight: 650; }
.search-field { display: flex; align-items: center; gap: 9px; width: min(280px, 48%); min-height: 44px; padding: 0 10px; border: 1px solid #d8e0d9; border-radius: 8px; color: #526158; background: #fff; }
.search-field input { width: 100%; min-width: 0; border: 0; outline: 0; color: #28342c; background: transparent; font-size: 14px; }
.search-field input::placeholder { color: #6c7970; }
.search-field kbd { padding: 1px 5px; border: 1px solid #dce2dc; border-radius: 4px; color: #5d6a61; background: #f7f9f7; font-size: 11px; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 36px 0 25px; }
.eyebrow { color: var(--green); font-size: 12px; font-weight: 750; letter-spacing: 1.15px; text-transform: uppercase; }
h1 { margin: 5px 0 7px; color: var(--ink); font-family: Georgia, "Times New Roman", serif; font-size: clamp(30px, 4vw, 41px); font-weight: 500; line-height: 1.12; }
.subtitle { margin: 0; color: #626f66; font-size: 14px; line-height: 1.6; }
.session-count { display: flex; align-items: baseline; gap: 6px; padding-bottom: 4px; color: #68756d; font-size: 12px; }
.count-number { color: var(--green); font-family: Georgia, serif; font-size: 28px; }
.count-divider { color: #7a877e; }
.save-warning { margin: 0 0 15px; padding: 10px 12px; border-radius: 8px; color: #7e392d; background: #fff0eb; font-size: 13px; }

.overview-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 11px; margin: 1px 0 32px; }
.stat-card { display: grid; gap: 7px; min-height: 101px; padding: 15px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.8); }
.stat-card > span { color: #5e6a61; font-size: 12px; }
.stat-card > strong { color: #24362b; font-family: Georgia, serif; font-size: 27px; font-weight: 500; line-height: 1; }
.stat-card > strong small { color: #657169; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; }
.stat-card > small { color: #606d64; font-size: 12px; line-height: 1.4; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; margin: 0 0 15px; }
.section-heading h2 { margin: 5px 0 0; font-family: Georgia, serif; font-size: 23px; font-weight: 500; }
.section-count { color: #58665c; font-size: 12px; }
.topic-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.topic-card { padding: 17px; border: 1px solid var(--line); border-radius: 11px; background: #fff; }
.topic-card-top, .topic-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.topic-card h3 { margin: 15px 0 6px; color: #26332b; font-family: Georgia, serif; font-size: 21px; font-weight: 500; }
.topic-card > p { margin: 0 0 12px; color: #5d6a61; font-size: 12px; line-height: 1.55; }
.topic-card-footer { margin-top: 14px; color: #59665d; font-size: 12px; }
.topic-progress-label { color: #526158; font-size: 12px; }
.topic-empty-note { padding: 9px 0; color: #695629 !important; line-height: 1.65; }
.section-progress-list { display: grid; gap: 5px; margin: 10px 0 0; padding: 0; list-style: none; }
.section-progress-list li { display: flex; justify-content: space-between; gap: 10px; color: #515f55; font-size: 12px; }
.section-progress-list li span:last-child { color: #3e5e47; white-space: nowrap; }
.tag { display: inline-flex; align-items: center; padding: 5px 9px; border-radius: 99px; color: #546258; background: #f0f3f0; font-size: 11px; }
.tag-kind { color: #315f45; background: #e6f1e8; }
.tag-due { color: #694915; background: #f8f0df; }
.next-step-panel { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 23px; padding: 18px 20px; border: 1px solid #dce6dd; border-radius: 11px; background: #edf4ee; }
.next-step-panel h2 { margin: 5px 0; color: #2d4033; font-family: Georgia, serif; font-size: 19px; font-weight: 500; line-height: 1.4; }
.next-step-panel p { max-width: 620px; margin: 5px 0 0; color: #55645a; font-size: 13px; line-height: 1.65; }
.chapter-focus { margin-bottom: 16px; padding: 16px 18px; border: 1px solid #dce6dd; border-radius: 10px; background: #f7faf7; }
.chapter-focus h2, .transfer-note h2, .data-tools h2 { margin: 5px 0 7px; color: #2d4033; font-family: Georgia, serif; font-size: 19px; font-weight: 500; }
.chapter-focus p, .transfer-note p, .data-tools p { margin: 0; color: #4f5e54; font-size: 13px; line-height: 1.75; }
.schedule-explanation, .local-storage-notice { margin: 0 0 16px; padding: 11px 13px; border-left: 3px solid #63836a; color: #34483a; background: #edf4ee; font-size: 13px; line-height: 1.7; }
.transfer-note { margin-top: 20px; padding: 18px; border: 1px solid #e2d4b8; border-radius: 10px; background: #fffaf1; }
.transfer-note .eyebrow { color: #765320; }
.transfer-note h2 { color: #45371e; }
.transfer-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.transfer-title-row h2 { margin-right: auto; }
.transfer-assumptions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 12px 0; }
.transfer-assumptions > div { display: grid; gap: 5px; padding: 12px; border: 1px solid #eadfc9; border-radius: 8px; background: #fffdf8; }
.transfer-assumptions strong { color: #45371e; font-size: 12px; }
.transfer-assumptions span { color: #51452f; font-size: 12px; line-height: 1.65; }
.transfer-note .source-pending { margin-top: 10px; color: #725219; font-size: 12px; }
.data-tools { display: grid; gap: 14px; margin-top: 18px; padding: 18px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.data-actions { display: flex; flex-wrap: wrap; gap: 9px; }
.data-message { grid-column: 1 / -1; color: #36583e !important; }
.local-storage-notice { margin: 15px 0; }

.filters { display: flex; align-items: end; gap: 12px; min-width: 0; margin: 0 0 18px; padding: 13px 15px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.72); }
.filters label { display: grid; gap: 5px; min-width: 180px; color: #56645a; font-size: 12px; }
.filters select { min-width: 0; min-height: 44px; padding: 0 30px 0 10px; border: 1px solid #d5ded6; border-radius: 7px; color: #344139; background: #fff; font-size: 14px; }
.filter-hint { margin-left: auto; padding-bottom: 9px; color: #68756d; font-size: 12px; }
.empty-panel { padding: clamp(24px, 4vw, 42px); border: 1px solid var(--line); border-radius: 13px; background: rgba(255,255,255,.83); }
.empty-symbol { display: grid; place-items: center; width: 39px; height: 39px; margin-bottom: 14px; border-radius: 12px; color: #347355; background: #e5f2e9; font-family: Georgia, serif; font-size: 21px; }
.empty-panel h2 { margin: 0 0 7px; color: #29362e; font-family: Georgia, serif; font-size: 23px; font-weight: 500; }
.empty-panel > p { max-width: 680px; margin: 0; color: #59675e; font-size: 14px; line-height: 1.8; }

.button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 12px; border: 1px solid transparent; border-radius: 7px; font-size: 12px; font-weight: 650; cursor: pointer; transition: background .15s ease, border-color .15s ease; }
.button.secondary { border-color: #d2ddd4; color: #34523d; background: #fff; }
.button.secondary:hover { border-color: #8da992; background: #f5faf6; }
.reveal-button { min-height: 42px; padding: 0 15px; color: #fff; background: #28664d; }
.reveal-button:hover, .known-button:hover { background: #1f583f; }
.question-card { overflow: hidden; border: 1px solid #dfe6df; border-radius: 13px; background: var(--paper); box-shadow: 0 12px 32px rgba(29,48,36,.045); }
.question-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #edf0ed; }
.question-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.question-id { color: #5f6b62; font-size: 12px; font-weight: 700; letter-spacing: .8px; white-space: nowrap; }
.question-body { padding: clamp(22px, 4vw, 38px) clamp(20px, 5vw, 48px) 24px; }
.question-overline { margin-bottom: 9px; color: #66736a; font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; }
.question-body h2 { max-width: 760px; margin: 0 0 17px; color: #26332b; font-family: Georgia, "Times New Roman", serif; font-size: clamp(22px, 3vw, 31px); font-weight: 500; line-height: 1.35; }
.question-body h2:focus, .empty-panel h2:focus { outline: 2px solid #bd8130; outline-offset: 4px; }
.source-row { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; color: #59665d; font-size: 12px; }
.source-label { font-weight: 700; }
.source-value { color: #425b48; }
.source-pending { color: #75591f; }
.uncertain-tag { padding: 4px 8px; border-radius: 99px; color: #713e29; background: #fff0e8; font-size: 11px; }
.learning-prompt { margin: 14px 0 0; color: #56665b; font-size: 12px; line-height: 1.7; }
.uncertain-note { margin: 14px 0 0; padding: 10px 12px; border-left: 3px solid #bd7952; color: #69412d; background: #fff7f1; font-size: 12px; line-height: 1.7; }
.answer-area { padding: 0 clamp(20px, 5vw, 48px) 25px; }
.answer-reveal { margin-bottom: 18px; padding: 17px 18px; border: 1px solid #dcebe0; border-radius: 9px; background: #f6faf6; }
.answer-label { color: #315f45; font-size: 12px; font-weight: 750; letter-spacing: .7px; text-transform: uppercase; }
.answer-reveal > p { margin: 9px 0 13px; color: #334339; font-size: 13px; line-height: 1.8; }
.detail-list { margin: 13px 0; color: #37473b; font-size: 12px; }
.detail-list > strong { font-size: 12px; }
.detail-list ul { display: grid; gap: 5px; margin: 7px 0 0; padding-left: 20px; line-height: 1.65; }
.self-rating { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 3px; color: #56645a; font-size: 12px; }
.rating-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
.known-button { color: #fff; background: #28664d; }
.unsure-button { border-color: #ead4a9; color: #70501d; background: #fffaf0; }
.unsure-button:hover { background: #f9f0df; }
.wrong-button { border-color: #e8d1c9; color: #813e32; background: #fff8f5; }
.wrong-button:hover { background: #fff0eb; }
.quiz-options { display: grid; gap: 9px; padding: 0 clamp(20px, 5vw, 48px) 24px; }
.option-button { display: flex; align-items: center; gap: 11px; width: 100%; min-height: 48px; padding: 8px 11px; border: 1px solid #dce4dd; border-radius: 8px; color: #303e34; background: #fff; font-size: 12px; text-align: left; cursor: pointer; }
.option-button:hover:not(:disabled) { border-color: #84a38a; background: #f8fbf8; }
.option-letter { display: grid; flex: 0 0 25px; place-items: center; width: 25px; height: 25px; border-radius: 7px; color: #526158; background: #f0f3f0; font-size: 10px; font-weight: 700; }
.option-result { margin-left: auto; font-size: 18px; font-weight: 700; }
.option-button.correct { border-color: #a9d0b2; color: #24583d; background: #f2faf4; }
.option-button.incorrect { border-color: #dfb2a5; color: #873c30; background: #fff6f3; }
.option-button.disabled-option { color: #707c73; background: #fafbfa; cursor: default; }
.option-button:disabled { cursor: default; }
.feedback { padding: 13px 14px; border: 1px solid; border-radius: 8px; font-size: 12px; line-height: 1.65; }
.feedback-correct { border-color: #b6d9bf; color: #24583d; background: #f2faf4; }
.feedback-incorrect { border-color: #e3c1b6; color: #7c3d32; background: #fff7f4; }
.feedback p { margin: 6px 0 10px; color: #48564c; line-height: 1.7; }
.feedback .source-row { margin-top: 9px; }
.next-button { margin-top: 12px; }
.queue-feedback { display: grid; gap: 9px; margin: 0 0 15px; padding: 16px; border: 1px solid #cbdccf; border-radius: 10px; background: #f3f8f3; }
.queue-feedback h2 { margin: 0; color: #26332b; font-family: Georgia, "Times New Roman", serif; font-size: 19px; font-weight: 500; line-height: 1.4; }
.queue-feedback p { margin: 0; color: #445349; font-size: 14px; line-height: 1.6; }
.queue-feedback .correct-text { color: #24583d; font-weight: 650; }
.queue-feedback .incorrect-text { color: #7c3d32; font-weight: 650; }
.queue-feedback .button { justify-self: start; }
.card-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 19px; border-top: 1px solid #edf0ed; color: #59675e; font-size: 12px; }
.step-controls { display: flex; gap: 6px; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #d8e1d9; border-radius: 7px; color: #3e5946; background: #fff; cursor: pointer; }
.icon-button:hover { border-color: #87a68d; background: #f2f8f3; }

.progress-topic-list { display: grid; gap: 9px; }
.progress-topic { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(100px, .7fr) 42px; align-items: center; gap: 18px; padding: 15px; border: 1px solid var(--line); border-radius: 9px; background: #fff; }
.progress-topic h3 { margin: 0 0 4px; font-family: Georgia, serif; font-size: 17px; font-weight: 500; }
.progress-topic p { margin: 0; color: #58665d; font-size: 12px; }
.progress-topic .topic-progress { background: #e7ede8; }
.progress-topic .topic-progress > span { background: #4c8961; }
.progress-topic .topic-progress-label { text-align: right; }
.page-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; color: #59675e; font-size: 12px; }
.page-footer code { color: #526158; }
.loading-state, .error-state { max-width: 720px; margin: 14vh auto; padding: 35px; color: #3c4b40; }
.error-state h1 { margin-top: 10px; font-size: 30px; }
.error-state p { color: #56645a; }
.session-count[role="status"] { min-width: max-content; }
.review-summary { margin-bottom: 13px; }
.progress-topic-detail { min-width: 0; }
.progress-topic .section-progress-list { max-width: 440px; }
.progress-topic .topic-progress[role="progressbar"] { background: #e7ede8; }
.progress-topic .topic-progress[role="progressbar"] > span { background: #4c8961; }
.progress-topic .section-progress-list { grid-column: 1 / -1; }
.progress-topic { grid-template-columns: minmax(0, 1fr) minmax(100px, .7fr) 42px; }
.progress-topic-detail h3 { margin: 0 0 4px; }
.progress-topic-detail > p { margin: 0; }
.data-tools .button.wrong-button { background: #fff8f5; }
.setup-layout, .history-layout, .saved-list, .exam-results { display: grid; gap: 14px; }
.setup-card, .saved-card, .goal-settings, .goal-summary, .shortcut-panel { display: grid; gap: 13px; padding: 19px; border: 1px solid var(--line); border-radius: 11px; background: #fff; }
.setup-card h2, .goal-settings h2, .goal-summary h2, .shortcut-panel h2 { margin: 3px 0 0; color: #2d4033; font-family: Georgia, serif; font-size: 21px; font-weight: 500; }
.setup-card > p, .goal-settings p, .goal-summary p, .shortcut-panel p, .setup-hint { margin: 0; color: #546258; font-size: 14px; line-height: 1.65; }
.setup-card > .eyebrow { margin-bottom: -8px; }
.resume-card { display: flex; align-items: center; justify-content: space-between; }
.choice-group { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 0; padding: 13px; border: 1px solid #e1e7e1; border-radius: 8px; }
.choice-group legend { padding: 0 6px; color: #45564a; font-size: 14px; font-weight: 700; }
.check-option { display: inline-flex; align-items: center; gap: 9px; min-height: 42px; color: #3e4d42; font-size: 14px; cursor: pointer; }
.check-option input { width: 18px; height: 18px; accent-color: #28664d; }
.setup-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field-label { display: grid; gap: 6px; color: #46564b; font-size: 14px; font-weight: 650; }
.field-label input, .field-label select, .field-label textarea { width: 100%; min-width: 0; min-height: 44px; padding: 9px 11px; border: 1px solid #d5ded6; border-radius: 7px; color: #303e34; background: #fff; font: inherit; font-weight: 400; }
.field-label textarea { min-height: 84px; resize: vertical; line-height: 1.55; }
.confidence-picker { margin: 12px 0; padding: 10px 12px; border: 1px solid #dfe6df; border-radius: 9px; }
.confidence-picker legend { padding: 0 5px; color: #536157; font-size: 13px; font-weight: 650; }
.confidence-options { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 15px; }
.confidence-option { display: inline-flex; min-height: 40px; align-items: center; gap: 7px; color: #3d4c41; font-size: 14px; cursor: pointer; }
.confidence-option input { width: 18px; height: 18px; accent-color: var(--green); }
.own-explanation { max-width: 760px; margin: 10px 0 14px; }
.own-explanation small { color: #66736a; font-size: 13px; font-weight: 400; }
.self-explanation-compare { margin: 10px 0 14px; padding: 12px 14px; border-left: 3px solid #8cae96; border-radius: 0 8px 8px 0; background: #f1f6f1; }
.self-explanation-compare p { margin: 5px 0 0; white-space: pre-wrap; }
.setup-availability, .goal-progress-text { margin: 0; color: #355542; font-size: 14px; font-weight: 650; }
.setup-card .button { justify-self: start; }
.button:disabled { opacity: .55; cursor: not-allowed; }
.compact-empty { padding: 18px; }
.compact-empty h3 { margin: 0 0 7px; font-size: 17px; }
.compact-empty p { margin: 0; font-size: 14px; line-height: 1.6; }
.setup-card > .compact-empty { width: 100%; }
.reminder-notice { margin: 0 0 15px; padding: 12px 14px; border-left: 3px solid #759279; color: #3c5541; background: #eef5ee; font-size: 14px; line-height: 1.6; }
.goal-summary { grid-template-columns: minmax(0, 1fr) auto; align-items: center; margin-top: 12px; background: #fff; }
.goal-summary h2 { margin-bottom: 4px; }
.goal-track { height: 9px; overflow: hidden; border-radius: 8px; background: #e6ece7; }
.goal-track > span { display: block; height: 100%; border-radius: inherit; background: #4c8961; transition: width .2s ease; }
.goal-settings { margin-bottom: 20px; }
.goal-settings .setup-fields { max-width: 520px; }
.shortcut-panel { background: #f8faf8; }
.shortcut-panel kbd { display: inline-block; min-width: 24px; padding: 2px 6px; border: 1px solid #d4ddd5; border-radius: 4px; color: #425347; background: #fff; font-size: 12px; text-align: center; }
.saved-card h2, .saved-card h3 { margin: 5px 0; color: #29362e; font-family: Georgia, serif; font-size: 20px; font-weight: 500; line-height: 1.45; }
.saved-card > p { margin: 4px 0; color: #546258; font-size: 14px; line-height: 1.6; }
.saved-card .field-label { margin-top: 8px; }
.saved-actions, .note-save { margin-top: 12px; }
.note-editor { max-width: 620px; margin-top: 14px; }
.history-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.history-list li { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 9px; background: #fff; }
.history-list li > div { display: grid; gap: 5px; }
.history-list li strong { color: #2e4034; font-size: 14px; }
.history-list li span { color: #59675e; font-size: 13px; }
.history-result { white-space: nowrap; font-weight: 700; }
.exam-results > h2 { margin: 10px 0 0; font-family: Georgia, serif; font-size: 22px; font-weight: 500; }
.exam-results > .button { justify-self: start; }
.exam-results .setup-card { margin-bottom: 5px; }
.exam-results .source-row { margin: 10px 0; }
.card-footer .step-controls { align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.card-footer .step-controls .button { min-height: 42px; }
.option-button[aria-pressed="true"] { border-color: #72977c; background: #eef5ef; }
.saved-list .data-actions { margin-top: 0; }
.transfer-assumptions span, .section-progress-list li, .stat-card > small { font-size: 13px; }
.tag { font-size: 12px; }
.button { font-size: 13px; }

.sidebar-course-actions { margin: -25px 0 15px; }
.course-switch-link { color: #e2ece5; font-size: 13px; }
.course-topic-empty { grid-column: 1 / -1; }
.content-import-view { display: grid; gap: 14px; }
.content-import-view > .subtitle { margin-top: -7px; }
.package-list { display: grid; gap: 9px; margin: 8px 0 0; padding: 0; list-style: none; }
.import-drop-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 17px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.import-drop-row > span { color: #59675e; font-size: 13px; }
.package-preview { display: grid; gap: 11px; padding: clamp(17px, 3vw, 25px); border: 1px solid #dce6dd; border-radius: 12px; background: #fdfefd; }
.package-preview h3, .package-preview h4 { margin: 0; color: #2d4033; }
.package-preview h3 { font-family: Georgia, serif; font-size: 22px; font-weight: 500; }
.package-preview h4 { margin-top: 5px; font-size: 14px; }
.package-list li { display: grid; gap: 5px; min-width: 0; padding: 11px 12px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
.package-list li > * { overflow-wrap: anywhere; }
.package-list li span, .package-list li small { color: #59675e; font-size: 13px; line-height: 1.5; }
.study-space-home { max-width: 1180px; min-height: 100vh; margin: 0 auto; padding: 0 clamp(17px, 5vw, 64px) 36px; }
.workspace-header { display: flex; align-items: center; justify-content: space-between; gap: 15px; min-height: 72px; border-bottom: 1px solid var(--line); }
.workspace-brand { padding: 0; color: var(--ink); }
.workspace-brand .brand-light { color: #607068; }
.workspace-local { color: #526158; font-size: 13px; white-space: nowrap; }
.workspace-local span { margin-right: 6px; color: #4b8c5b; font-size: 9px; }
.workspace-welcome { max-width: 760px; padding: clamp(28px, 6vw, 64px) 0 24px; }
.workspace-welcome h1 { margin-top: 8px; font-size: clamp(32px, 5vw, 48px); }
.workspace-welcome p { max-width: 680px; margin: 0; color: #59675e; font-size: 15px; line-height: 1.7; }
.workspace-create { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.workspace-create h2, .workspace-backup h2 { margin: 5px 0 0; color: #29382f; font-family: Georgia, serif; font-size: 21px; font-weight: 500; }
.workspace-create form { display: flex; flex: 1; justify-content: flex-end; gap: 8px; }
.workspace-create input, .rename-course-form input { width: min(100%, 320px); min-width: 0; min-height: 44px; padding: 9px 11px; border: 1px solid #d5ded6; border-radius: 7px; color: #303e34; background: #fff; }
.workspace-courses { margin-top: 33px; }
.workspace-course-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.workspace-course-card { display: grid; gap: 12px; min-width: 0; padding: 17px; border: 1px solid var(--line); border-radius: 11px; background: #fff; }
.workspace-course-top { display: flex; justify-content: space-between; gap: 10px; }
.course-created { color: #627067; font-size: 12px; }
.workspace-course-card h3 { margin: 0; overflow-wrap: anywhere; color: #26332b; font-family: Georgia, serif; font-size: 23px; font-weight: 500; }
.workspace-course-card > p { margin: 0; color: #59675e; font-size: 13px; line-height: 1.5; }
.course-stats { display: flex; flex-wrap: wrap; gap: 7px 14px; padding-top: 10px; border-top: 1px solid var(--line); color: #59675e; font-size: 13px; }
.course-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 2px; }
.course-actions .button { flex: 1 1 auto; }
.rename-course-form { display: flex; flex-wrap: wrap; gap: 7px; }
.rename-course-form input { flex: 1 1 100%; }
.workspace-backup { margin-top: 24px; }
.workspace-backup .data-actions { justify-content: flex-start; }
.workspace-error { padding: clamp(24px, 5vw, 44px); border: 1px solid #edcfc5; border-radius: 14px; background: #fff; }

@media (max-width: 760px) {
  .workspace-create { align-items: stretch; flex-direction: column; }
  .workspace-create form { justify-content: stretch; }
  .workspace-create input { flex: 1; width: auto; }
  .workspace-course-grid { grid-template-columns: 1fr; }
}
@media (max-width: 460px) {
  .study-space-home { padding-right: 13px; padding-left: 13px; }
  .workspace-local { max-width: 120px; text-align: right; white-space: normal; }
  .workspace-create form { align-items: stretch; flex-direction: column; }
  .workspace-create input { width: 100%; }
  .workspace-course-top { align-items: flex-start; flex-direction: column; }
  .course-actions { display: grid; grid-template-columns: 1fr 1fr; }
}

@media (max-width: 1050px) {
  .sidebar { width: 215px; }
  .main-content { margin-left: 215px; padding-right: 25px; padding-left: 25px; }
  .overview-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mode-nav { gap: 4px; }
}
@media (max-width: 760px) {
  .sidebar { position: static; width: 100%; padding: 12px 14px 9px; }
  .brand { padding: 0 2px 12px; }
  .sidebar-label, .sidebar-bottom { display: none; }
  .mode-nav { display: flex; gap: 4px; overflow-x: auto; }
  .mode-link { flex: 0 0 auto; width: auto; min-height: 44px; padding: 7px 9px; font-size: 12px; }
  .mode-link.active { box-shadow: inset 0 -2px #8dd2a8; }
  .section-subnav { display: flex; gap: 4px; overflow-x: auto; margin: 8px 0 0; padding: 0 0 2px; border: 0; }
  .section-subnav-link { flex: 0 0 auto; min-height: 42px; padding: 8px 12px; border: 1px solid rgba(202,225,208,.14); }
  .nav-count { min-width: 20px; padding: 2px 5px; }
  .main-content { margin-left: 0; padding: 0 18px 22px; }
  .topbar { min-height: 55px; }
  .breadcrumb { font-size: 12px; white-space: nowrap; }
  .search-field { width: min(220px, 58%); }
  .page-heading { padding: 25px 0 18px; }
  .subtitle { max-width: 54ch; font-size: 14px; }
  .topic-grid { grid-template-columns: 1fr; }
  .transfer-assumptions { grid-template-columns: 1fr; }
  .filters { align-items: stretch; flex-direction: column; gap: 9px; padding: 11px; }
  .filters label { min-width: 0; }
  .filters select { width: 100%; }
  .filter-hint { display: none; }
  .question-card-top { align-items: flex-start; padding: 12px; }
  .question-body { padding-right: 18px; padding-left: 18px; }
  .answer-area, .quiz-options { padding-right: 18px; padding-left: 18px; }
  .self-rating { align-items: flex-start; flex-direction: column; }
  .rating-buttons { width: 100%; }
  .rating-buttons .button { flex: 1; }
  .progress-topic { grid-template-columns: minmax(0, 1fr) 40px; gap: 10px; }
  .progress-topic .topic-progress { grid-column: 1; grid-row: 2; }
  .progress-topic .topic-progress-label { grid-column: 2; grid-row: 1 / span 2; }
  .card-footer { padding: 10px 12px; }
  .page-footer { flex-direction: column; }
  .setup-fields { grid-template-columns: 1fr; }
  .goal-summary { grid-template-columns: 1fr; }
  .goal-summary > .button { justify-self: start; }
  .card-footer { align-items: flex-start; flex-direction: column; }
  .card-footer .step-controls { width: 100%; }
}
@media (max-width: 460px) {
  .main-content { padding-right: 13px; padding-left: 13px; }
  .overview-stats { gap: 8px; }
  .stat-card { min-height: 88px; padding: 11px; }
  .stat-card > strong { font-size: 23px; }
  .search-field { width: 55%; }
  .search-field kbd { display: none; }
  .next-step-panel { align-items: flex-start; flex-direction: column; }
  .topic-card-footer { align-items: flex-start; flex-direction: column; }
  .data-actions { align-items: stretch; flex-direction: column; }
  .question-card-top { flex-direction: column-reverse; }
  .session-count { align-self: flex-start; }
  .resume-card { align-items: flex-start; flex-direction: column; }
  .history-list li { align-items: flex-start; flex-direction: column; gap: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
````

### `schemas/study-space-content.schema.json`

````json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "study-space-content.schema.json",
  "title": "Study Space external content package",
  "description": "Versioned package for source-backed study material created outside the app. File and page references do not require a PDF to be uploaded or analyzed in the app.",
  "type": "object",
  "additionalProperties": false,
  "required": ["format", "version", "chapters", "items"],
  "properties": {
    "format": {
      "const": "study-space-content"
    },
    "version": {
      "const": 1
    },
    "courseId": {
      "type": "string",
      "minLength": 1,
      "description": "Optional target course ID. When present, it must match the selected course."
    },
    "chapters": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/chapter"
      }
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/item"
      }
    }
  },
  "$defs": {
    "section": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "title"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "chapter": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "title"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "sections": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/section"
          }
        }
      }
    },
    "sourceByMaterialId": {
      "type": "object",
      "additionalProperties": false,
      "required": ["materialId", "page"],
      "properties": {
        "materialId": {
          "type": "string",
          "minLength": 1
        },
        "fileName": {
          "type": "string",
          "minLength": 1
        },
        "page": {
          "type": "integer",
          "minimum": 1
        }
      }
    },
    "sourceByFileName": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fileName", "page"],
      "properties": {
        "fileName": {
          "type": "string",
          "minLength": 1
        },
        "page": {
          "type": "integer",
          "minimum": 1
        }
      }
    },
    "commonItem": {
      "type": "object",
      "required": ["id", "kind", "prompt", "chapterId", "source"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "enum": ["flashcard", "quiz"]
        },
        "prompt": {
          "type": "string",
          "minLength": 1
        },
        "answer": {
          "type": "string"
        },
        "options": {
          "type": "array",
          "minItems": 2,
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "correctOption": {
          "type": "integer",
          "minimum": 0
        },
        "explanation": {
          "type": "string"
        },
        "shortExplanation": {
          "type": "string"
        },
        "keyTerms": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "examples": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "chapterId": {
          "type": "string",
          "minLength": 1
        },
        "sectionId": {
          "type": "string",
          "minLength": 1
        },
        "questionType": {
          "type": "string",
          "minLength": 1
        },
        "uncertain": {
          "type": "boolean"
        },
        "source": {
          "oneOf": [
            {
              "$ref": "#/$defs/sourceByMaterialId"
            },
            {
              "$ref": "#/$defs/sourceByFileName"
            }
          ]
        }
      }
    },
    "flashcard": {
      "allOf": [
        {
          "$ref": "#/$defs/commonItem"
        },
        {
          "type": "object",
          "required": ["answer"],
          "properties": {
            "kind": {
              "const": "flashcard"
            }
          }
        }
      ],
      "unevaluatedProperties": false
    },
    "quiz": {
      "allOf": [
        {
          "$ref": "#/$defs/commonItem"
        },
        {
          "type": "object",
          "required": ["options", "correctOption"],
          "properties": {
            "kind": {
              "const": "quiz"
            }
          }
        }
      ],
      "unevaluatedProperties": false
    },
    "item": {
      "oneOf": [
        {
          "$ref": "#/$defs/flashcard"
        },
        {
          "$ref": "#/$defs/quiz"
        }
      ]
    }
  }
}
````

### `tests/navigation.test.cjs`

````javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "navigation.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const navigationModule = { exports: {} };
new Function("module", "exports", compiled)(navigationModule, navigationModule.exports);
const navigation = navigationModule.exports;

test("primary navigation stays focused on the six requested sections", () => {
  assert.deepEqual(navigation.PRIMARY_NAVIGATION.map((item) => item.label), [
    "Übersicht", "Lernen", "Wiederholen", "Prüfung", "Inhalte", "Fortschritt",
  ]);
});

test("learning modes, repeat lists, saved items, exam, and history remain reachable as subviews", () => {
  assert.deepEqual(navigation.SECTION_VIEWS.learn.map(({ view }) => view), [
    "learn", "cards", "quiz", "sessions",
  ]);
  assert.deepEqual(navigation.SECTION_VIEWS.review.map(({ view }) => view), ["review", "errors"]);
  assert.deepEqual(navigation.SECTION_VIEWS.contents.map(({ view }) => view), ["importContent", "saved"]);
  assert.deepEqual(navigation.SECTION_VIEWS.progress.map(({ view }) => view), ["progress", "history"]);
  assert.equal(navigation.sectionForView("studySession"), "learn");
  assert.equal(navigation.sectionForView("exam"), "exam");
  assert.equal(navigation.sectionForView("studySummary"), "learn");
});
````

### `tests/progress.test.cjs`

````javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "progress.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const progressModule = { exports: {} };
new Function("module", "exports", compiled)(progressModule, progressModule.exports);
const progress = progressModule.exports;

const questions = [
  { id: "flash-a", kind: "flashcard" },
  { id: "quiz-a", kind: "quiz" },
];

function envelope(state, overrides = {}) {
  return JSON.stringify({
    format: progress.EXPORT_FORMAT,
    version: progress.EXPORT_VERSION,
    exportedAt: "2026-10-22T08:00:00.000Z",
    progress: state,
    ...overrides,
  });
}

function blank(overrides = {}) {
  return {
    ...structuredClone(progress.emptyProgress),
    ...overrides,
  };
}

test("review-list index remains on the next item after the current item is removed", () => {
  assert.equal(progress.nextReviewIndex(0, 1, true), 0);
  assert.equal(progress.nextReviewIndex(1, 1, true), 0);
  assert.equal(progress.nextReviewIndex(0, 0, true), 0);
});

test("error-list index advances when an unresolved item remains", () => {
  assert.equal(progress.nextReviewIndex(0, 2, false), 1);
  assert.equal(progress.nextReviewIndex(0, 1, false), 0);
});

test("safe, early, incorrect, and overdue reviews preserve the calendar schedule", () => {
  const reviewedAt = new Date(2026, 9, 22, 12);
  const first = progress.scheduleReview(undefined, "sicher", reviewedAt);
  assert.deepEqual(
    { streak: first.streak, intervalDays: first.intervalDays, dueDate: first.dueDate },
    { streak: 1, intervalDays: 1, dueDate: "2026-10-23" },
  );

  const overdue = {
    ...first,
    streak: 2,
    intervalDays: 3,
    dueDate: "2026-10-20",
  };
  const recalledLate = progress.scheduleReview(overdue, "sicher", reviewedAt);
  assert.deepEqual(
    { streak: recalledLate.streak, intervalDays: recalledLate.intervalDays, dueDate: recalledLate.dueDate },
    { streak: 3, intervalDays: 7, dueDate: "2026-10-29" },
  );

  const early = progress.scheduleReview(
    { ...overdue, dueDate: "2026-10-25" },
    "sicher",
    reviewedAt,
  );
  assert.deepEqual(
    { streak: early.streak, intervalDays: early.intervalDays, dueDate: early.dueDate },
    { streak: 2, intervalDays: 3, dueDate: "2026-10-25" },
  );

  const incorrect = progress.scheduleReview(overdue, "noch einmal", reviewedAt);
  assert.deepEqual(
    { streak: incorrect.streak, intervalDays: incorrect.intervalDays, dueDate: incorrect.dueDate },
    { streak: 0, intervalDays: 1, dueDate: "2026-10-23" },
  );
});

test("confidence stays separate and low confidence shortens the next safe interval", () => {
  const reviewedAt = new Date(2026, 9, 22, 12);
  const lowConfidence = progress.scheduleReview(undefined, "sicher", reviewedAt, "niedrig");
  assert.equal(lowConfidence.rating, "sicher");
  assert.equal(lowConfidence.confidence, "niedrig");
  assert.equal(lowConfidence.streak, 1);
  assert.equal(lowConfidence.intervalDays, 1);
  assert.equal(lowConfidence.dueDate, "2026-10-23");

  const confidentError = progress.scheduleReview(undefined, "noch einmal", reviewedAt, "hoch");
  assert.equal(confidentError.rating, "noch einmal");
  assert.equal(confidentError.confidence, "hoch");
  assert.equal(confidentError.dueDate, "2026-10-23");
  assert.throws(
    () => progress.parseProgressImport(envelope(blank({
      reviews: { "karten:flash-a": { ...lowConfidence, confidence: "certain" } },
    })), questions),
    /Wiederholungseintrag ist ungültig/,
  );
  const state = blank({ reviews: { "karten:flash-a": lowConfidence } });
  assert.deepEqual(progress.parseProgressImport(JSON.stringify(progress.createProgressExport(state)), questions), state);
});

test("calendar-day arithmetic crosses daylight-saving changes without adding a fixed 24 hours", () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    assert.equal(progress.addLocalDays("2026-03-07", 1), "2026-03-08");
    assert.equal(progress.addLocalDays("2026-10-31", 1), "2026-11-01");
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("legacy and mode-specific IDs are normalized before conflict validation", () => {
  const legacyKnown = blank({
    knownIds: ["flash-a"],
    wrongIds: ["karten:flash-a"],
  });
  assert.throws(
    () => progress.parseProgressImport(envelope(legacyKnown), questions),
    /gleichzeitig als sicher/,
  );

  const legacyWrong = blank({
    knownIds: ["lernen:flash-a"],
    wrongIds: ["flash-a"],
  });
  assert.throws(
    () => progress.parseProgressImport(envelope(legacyWrong), questions),
    /gleichzeitig als sicher/,
  );
});

test("a review rating cannot contradict the matching known or wrong list", () => {
  const reviewedAsWrong = progress.scheduleReview(undefined, "noch einmal", new Date(2026, 9, 22, 12));
  assert.throws(
    () => progress.parseProgressImport(envelope(blank({
      knownIds: ["karten:flash-a"],
      reviews: { "karten:flash-a": reviewedAsWrong },
    })), questions),
    /gleichzeitig als sicher/,
  );
});

test("unknown IDs, invalid modes, duplicate IDs, and impossible counters are rejected", () => {
  const invalidStates = [
    blank({ knownIds: ["missing-question"] }),
    blank({ wrongIds: ["lernen:quiz-a"] }),
    blank({ knownIds: ["flash-a", "karten:flash-a"] }),
    blank({ correctAnswers: Number.MAX_SAFE_INTEGER, incorrectAnswers: 1 }),
    blank({ reviews: { "lernen:quiz-a": progress.scheduleReview(undefined, "sicher", new Date()) } }),
    blank({
      reviews: {
        "karten:flash-a": {
          ...progress.scheduleReview(undefined, "sicher", new Date()),
          dueDate: "2026-02-30",
        },
      },
    }),
  ];
  for (const state of invalidStates) {
    assert.throws(() => progress.parseProgressImport(envelope(state), questions));
  }

  assert.throws(() => progress.parseProgressImport("{", questions), /gültiges JSON/);
  assert.throws(
    () => progress.parseProgressImport(envelope(blank(), { version: 999 }), questions),
    /nicht unterstützte Version/,
  );
});

test("valid exports import as an identical progress state", () => {
  const state = blank({
    knownIds: ["karten:flash-a"],
    wrongIds: ["quiz:quiz-a"],
    correctAnswers: 4,
    incorrectAnswers: 2,
    bookmarks: ["flash-a"],
    notes: { "quiz-a": "Persönliche Notiz" },
    reviews: {
      "karten:flash-a": progress.scheduleReview(undefined, "sicher", new Date(2026, 9, 22, 12)),
      "quiz:quiz-a": progress.scheduleReview(undefined, "noch einmal", new Date(2026, 9, 22, 12)),
    },
  });
  const exported = progress.createProgressExport(state);
  assert.deepEqual(progress.parseProgressImport(JSON.stringify(exported), questions), state);
});

test("a saved study session round-trips mode-specific answers and rejects unrelated answers", () => {
  const session = {
    type: "study",
    startedAt: "2026-10-22T08:00:00.000Z",
    items: [{ questionId: "flash-a", mode: "lernen" }],
    index: 0,
    durationMinutes: 10,
    answers: { "lernen:flash-a": { selectedOption: 1, isCorrect: true } },
    submitted: false,
    retryMissed: false,
  };
  const state = blank({ unfinishedSession: session });
  assert.deepEqual(progress.parseProgressImport(JSON.stringify(progress.createProgressExport(state)), questions), state);
  const invalidState = blank({ unfinishedSession: { ...session, answers: { "quiz:quiz-a": { selectedOption: 0, isCorrect: false } } } });
  assert.throws(() => progress.parseProgressImport(JSON.stringify(progress.createProgressExport(invalidState)), questions));
});

test("invalid saved fields fail atomically during import validation", () => {
  const invalidStates = [
    blank({ bookmarks: ["missing-question"] }),
    blank({ notes: { "flash-a": "x".repeat(10_001) } }),
    blank({ dailyGoal: { enabled: true, type: "questions", target: 0, reminderEnabled: false } }),
    blank({ sessionPreferences: { ...progress.emptyProgress.sessionPreferences, modes: ["unknown"] } }),
    blank({
      history: [
        { id: "same", date: "2026-10-22", type: "study", durationSeconds: 30, attempted: 1, correct: 1, questionIds: ["flash-a"], missedIds: [] },
        { id: "same", date: "2026-10-22", type: "study", durationSeconds: 30, attempted: 1, correct: 1, questionIds: ["flash-a"], missedIds: [] },
      ],
    }),
  ];
  for (const state of invalidStates) {
    assert.throws(() => progress.parseProgressImport(JSON.stringify(progress.createProgressExport(state)), questions));
  }
});

test("version 2 backups migrate to the new optional fields without losing review progress", () => {
  const legacy = {
    knownIds: ["karten:flash-a"],
    wrongIds: [],
    correctAnswers: 3,
    incorrectAnswers: 1,
    reviews: {
      "karten:flash-a": progress.scheduleReview(undefined, "sicher", new Date(2026, 9, 22, 12)),
    },
  };
  const imported = progress.parseProgressImport(envelope(legacy, { version: 2 }), questions);
  assert.equal(imported.knownIds[0], "karten:flash-a");
  assert.deepEqual(imported.bookmarks, []);
  assert.deepEqual(imported.notes, {});
  assert.deepEqual(imported.history, []);
});

test("version 3 backups without the optional mixed-session setting migrate with mixing disabled", () => {
  const sessionPreferences = { ...progress.emptyProgress.sessionPreferences };
  delete sessionPreferences.mixedReview;
  const imported = progress.parseProgressImport(
    envelope(blank({ sessionPreferences })),
    questions,
  );
  assert.equal(imported.sessionPreferences.mixedReview, false);
  assert.deepEqual(imported.sessionPreferences.topics, []);
});

test("empty libraries produce no quick-session or exam selections", () => {
  assert.deepEqual(progress.makeStudySession([], progress.emptyProgress.sessionPreferences), []);
  assert.deepEqual(progress.makeExamSelection([], 10, () => 0.5), []);
});

test("mixed sessions put due items first, mix learned questions by topic, and avoid same-question duplicates", () => {
  const preferences = {
    ...progress.emptyProgress.sessionPreferences,
    questionCount: 4,
    modes: ["karten"],
    includeWeak: true,
    mixedReview: true,
  };
  const selection = progress.makeStudySession([
    { id: "due", kind: "flashcard", chapter: "A", section: "1", modes: ["karten"], due: true, weak: false },
    { id: "learned-a", kind: "flashcard", chapter: "A", section: "2", modes: ["karten"], due: false, weak: false, learned: true },
    { id: "learned-b", kind: "flashcard", chapter: "B", section: "1", modes: ["karten"], due: false, weak: false, learned: true },
    { id: "weak", kind: "flashcard", chapter: "B", section: "2", modes: ["karten"], due: false, weak: true },
    { id: "same", kind: "flashcard", chapter: "A", section: "2", modes: ["lernen", "karten"], due: false, weak: false, learned: true },
  ], preferences, () => 0);
  assert.equal(selection[0].questionId, "due");
  assert.ok(["learned-a", "learned-b", "same"].includes(selection[1].questionId));
  assert.ok(["learned-a", "learned-b", "same"].includes(selection[2].questionId));
  assert.notEqual(selection[1].questionId, "weak");
  assert.notEqual(selection[2].questionId, "weak");
  const chapterById = { due: "A", "learned-a": "A", "learned-b": "B", weak: "B", same: "A" };
  assert.equal(new Set(selection.slice(0, 3).map((item) => chapterById[item.questionId])).size, 2);
  assert.equal(new Set(selection.map((item) => item.questionId)).size, selection.length);
});

test("a due review is assigned only to its own mode and learned items remain available when mixing is off", () => {
  const question = {
    id: "same",
    kind: "flashcard",
    chapter: "A",
    modes: ["lernen", "karten"],
    due: false,
    weak: false,
    dueModes: ["karten"],
    learnedModes: ["lernen"],
  };
  const due = progress.makeStudySession([question], {
    ...progress.emptyProgress.sessionPreferences,
    modes: ["lernen", "karten"],
    mixedReview: true,
  });
  assert.equal(due[0].mode, "karten");
  const regular = progress.makeStudySession([{ ...question, dueModes: [], learnedModes: ["karten"] }], {
    ...progress.emptyProgress.sessionPreferences,
    modes: ["karten"],
    mixedReview: false,
  });
  assert.equal(regular[0].questionId, "same");
});

test("completed exams add history without changing spaced repetition or mastery", () => {
  const review = progress.scheduleReview(undefined, "sicher", new Date(2026, 9, 22, 12));
  const initial = blank({
    knownIds: ["karten:flash-a"],
    wrongIds: ["quiz:quiz-a"],
    correctAnswers: 7,
    incorrectAnswers: 4,
    reviews: { "karten:flash-a": review },
  });
  const session = {
    type: "exam",
    startedAt: "2026-10-22T08:00:00.000Z",
    items: [{ questionId: "quiz-a", mode: "quiz" }],
    index: 0,
    durationMinutes: null,
    answers: { "quiz-a": { selectedOption: 1, isCorrect: false } },
    submitted: false,
    retryMissed: false,
  };
  const result = progress.completeExamProgress(initial, session, new Date("2026-10-22T08:05:00.000Z"));
  assert.deepEqual(result.knownIds, initial.knownIds);
  assert.deepEqual(result.wrongIds, initial.wrongIds);
  assert.deepEqual(result.reviews, initial.reviews);
  assert.equal(result.correctAnswers, initial.correctAnswers);
  assert.equal(result.incorrectAnswers, initial.incorrectAnswers);
  assert.equal(result.history.length, 1);
  assert.deepEqual(result.history[0].missedIds, ["quiz-a"]);
  assert.equal(result.unfinishedSession.submitted, true);
});

test("daily goal reflects completed study activity and excludes exam results", () => {
  const goal = { enabled: true, type: "questions", target: 5, reminderEnabled: false };
  const noActivity = progress.dailyGoalProgress([], goal, "2026-10-22");
  assert.deepEqual(noActivity, { value: 0, target: 5, hasActivity: false, complete: false });
  const history = [
    { id: "exam", date: "2026-10-22", type: "exam", attempted: 20, durationSeconds: 3600, correct: 15, questionIds: [], missedIds: [] },
    { id: "study", date: "2026-10-22", type: "study", attempted: 3, durationSeconds: 120, correct: 2, questionIds: [], missedIds: [] },
  ];
  assert.deepEqual(progress.dailyGoalProgress(history, goal, "2026-10-22"), {
    value: 3, target: 5, hasActivity: true, complete: false,
  });
  assert.equal(progress.dailyGoalProgress(history, { ...goal, type: "minutes", target: 2 }, "2026-10-22").complete, true);
  assert.equal(progress.dailyGoalProgress(history, { ...goal, enabled: false }, "2026-10-22").hasActivity, false);
});

test("history is bounded and saved notes/bookmarks survive import and export", () => {
  const longHistory = Array.from({ length: progress.MAX_HISTORY_ENTRIES + 4 }, (_, index) => ({
    id: `entry-${index}`, date: "2026-10-22", type: "study", durationSeconds: 60,
    attempted: 1, correct: 1, questionIds: ["flash-a"], missedIds: [],
  }));
  assert.deepEqual(progress.appendHistory([], longHistory[0]), [longHistory[0]]);
  const capped = longHistory.reduce((items, entry) => progress.appendHistory(items, entry), []);
  assert.equal(capped.length, progress.MAX_HISTORY_ENTRIES);
  assert.equal(capped[0].id, "entry-4");
  const state = blank({ bookmarks: ["flash-a"], notes: { "flash-a": "Eigene Notiz" } });
  assert.deepEqual(progress.parseProgressImport(JSON.stringify(progress.createProgressExport(state)), questions), state);
});

test("a rejected import leaves the caller's existing progress unchanged", () => {
  const existing = blank({ knownIds: ["karten:flash-a"], correctAnswers: 8 });
  const original = structuredClone(existing);
  let stored = structuredClone(existing);

  try {
    stored = progress.parseProgressImport(envelope(blank({ wrongIds: ["unknown"] })), questions);
  } catch {
    // The application commits only after parsing and validation succeed.
  }

  assert.deepEqual(stored, original);
});
````

### `tests/studySpace.test.cjs`

````javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function loadTypeScript(sourceFile, resolveImport = require) {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", sourceFile), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", compiled)(module, module.exports, resolveImport);
  return module.exports;
}

const progress = loadTypeScript("progress.ts");
const studySpace = loadTypeScript("studySpace.ts", (specifier) =>
  specifier === "./progress" ? progress : require(specifier));
const packageSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schemas", "study-space-content.schema.json"), "utf8"));

function course(overrides = {}) {
  return {
    id: "course-test",
    name: "Test course",
    archived: false,
    createdAt: "2026-10-22T08:00:00.000Z",
    materials: [{ id: "material-1", fileName: "source.pdf", size: 100, addedAt: "2026-10-22T08:00:00.000Z", status: "stored" }],
    chapters: [],
    questions: [],
    progress: structuredClone(progress.emptyProgress),
    ...overrides,
  };
}

function packageText(items = [flashcard()]) {
  return JSON.stringify({
    format: studySpace.CONTENT_PACKAGE_FORMAT,
    version: studySpace.CONTENT_PACKAGE_VERSION,
    courseId: "course-test",
    chapters: [{ id: "chapter-one", title: "Chapter", sections: [{ id: "section-one", title: "Section" }] }],
    items,
  });
}

function flashcard(overrides = {}) {
  return {
    id: "card-one",
    kind: "flashcard",
    prompt: "Test prompt",
    answer: "Test answer",
    chapterId: "chapter-one",
    sectionId: "section-one",
    source: { materialId: "material-1", page: 4 },
    ...overrides,
  };
}

test("new courses can remain empty without fake questions", () => {
  const space = studySpace.createDefaultSpace(null, []);
  assert.equal(space.courses[0].questions.length, 0);
  assert.deepEqual(space.courses[0].chapters, []);
  assert.equal(space.courses[0].progress.correctAnswers, 0);
});

test("documented package schema is JSON and matches the runtime format version", () => {
  assert.equal(packageSchema.properties.format.const, studySpace.CONTENT_PACKAGE_FORMAT);
  assert.equal(packageSchema.properties.version.const, studySpace.CONTENT_PACKAGE_VERSION);
  assert.deepEqual(packageSchema.required, ["format", "version", "chapters", "items"]);
});

test("legacy ABWL progress migrates into its course and survives a Study Space round-trip", () => {
  const oldProgress = {
    knownIds: ["karte-platzhalter-1"],
    wrongIds: [],
    correctAnswers: 2,
    incorrectAnswers: 1,
    reviews: {},
  };
  const legacyQuestion = {
    id: "karte-platzhalter-1",
    kind: "flashcard",
    prompt: "Placeholder",
    answer: "Placeholder",
    chapter: "Unassigned",
    questionType: "Placeholder",
    sourcePages: [],
    placeholder: true,
    uncertain: false,
  };
  const migrated = studySpace.createDefaultSpace(oldProgress, [legacyQuestion], undefined, [{ number: 1, title: "Chapter 1" }]);
  assert.equal(migrated.courses[0].id, "course-abwl");
  assert.equal(migrated.courses[0].progress.knownIds[0], "karte-platzhalter-1");
  assert.equal(migrated.courses[0].progress.correctAnswers, 2);
  assert.equal(migrated.courses[0].chapters[0].title, "Chapter 1");
  const restored = studySpace.parseStudySpace(studySpace.createStudySpaceBackup(migrated));
  assert.deepEqual(
    JSON.parse(JSON.stringify(restored.courses[0].progress)),
    JSON.parse(JSON.stringify(migrated.courses[0].progress)),
  );
});

test("external package validates course, chapter, material, page, and item types", () => {
  const preview = studySpace.parseContentPackage(packageText(), course());
  assert.equal(preview.courseId, "course-test");
  assert.equal(preview.flashcardCount, 1);
  assert.equal(preview.questions[0].sourceMaterialId, "material-1");
  assert.deepEqual(preview.questions[0].sourcePages, [4]);
});

test("package import rejects unknown assignments, sources, pages, and invalid answers", () => {
  const target = course();
  assert.throws(() => studySpace.parseContentPackage(
    JSON.stringify({ ...JSON.parse(packageText()), courseId: "other-course" }),
    target,
  ), /anderen Fach/);
  assert.throws(() => studySpace.parseContentPackage(
    packageText([flashcard({ source: { materialId: "unknown-material", page: 1 } })]),
    target,
  ), /Datei und Seite angeben/);
  assert.throws(() => studySpace.parseContentPackage(
    packageText([flashcard({ source: { materialId: "material-1", page: 0 } })]),
    target,
  ), /Quellseite/);
  assert.throws(() => studySpace.parseContentPackage(
    packageText([{ ...flashcard(), kind: "quiz", options: ["only one"], correctOption: 2 }]),
    target,
  ), /Antwortoptionen/);
  assert.throws(() => studySpace.parseContentPackage(
    packageText([flashcard({ chapterId: "unknown-chapter" })]),
    target,
  ), /unbekanntes Kapitel/);
  const unknownFieldPackage = JSON.parse(packageText());
  unknownFieldPackage.unexpectedField = true;
  assert.throws(() => studySpace.parseContentPackage(JSON.stringify(unknownFieldPackage), target), /Unbekanntes Paketformat/);
});

test("source file and page references import without uploading or storing a PDF", () => {
  const emptyCourse = course({ materials: [] });
  const preview = studySpace.parseContentPackage(
    packageText([flashcard({ source: { fileName: "external-slides.pdf", page: 9 } })]),
    emptyCourse,
  );
  assert.equal(preview.questions[0].sourceFileName, "external-slides.pdf");
  assert.equal(preview.questions[0].sourceMaterialId, undefined);
  assert.deepEqual(preview.questions[0].sourcePages, [9]);
  const imported = studySpace.applyContentImport(emptyCourse, preview);
  assert.equal(imported.questions[0].sourceFileName, "external-slides.pdf");
  assert.deepEqual(emptyCourse.questions, []);
  assert.throws(
    () => studySpace.parseContentPackage(
      packageText([flashcard({ source: { page: 9 } })]),
      emptyCourse,
    ),
    /Datei und Seite angeben/,
  );
});

test("duplicate chapter and item IDs fail without changing the course", () => {
  const target = course({
    chapters: [{ id: "chapter-one", title: "Existing", sections: [] }],
    questions: [{ ...flashcard(), chapter: "Existing", sourcePages: [1], sourceFileName: "source.pdf", placeholder: false, uncertain: false }],
  });
  const snapshot = structuredClone(target);
  assert.throws(() => studySpace.parseContentPackage(packageText(), target), /Kapitel-ID/);
  assert.deepEqual(target, snapshot);

  const fresh = course();
  const repeated = [flashcard({ id: "duplicate" }), flashcard({ id: "duplicate", prompt: "Second" })];
  assert.throws(() => studySpace.parseContentPackage(packageText(repeated), fresh), /ungültig, doppelt/);
  assert.deepEqual(fresh, course());
});

test("content is applied only after a validated preview and duplicate IDs cannot overwrite", () => {
  const target = course();
  const preview = studySpace.parseContentPackage(packageText(), target);
  const updated = studySpace.applyContentImport(target, preview);
  assert.equal(updated.questions.length, 1);
  assert.equal(updated.chapters.length, 1);
  assert.equal(target.questions.length, 0);
  assert.throws(() => studySpace.applyContentImport(updated, preview), /bereits vorhanden/);
  assert.equal(updated.questions.length, 1);
});

test("a preview keeps legacy source metadata references when the old PDF blob is missing", () => {
  const target = course();
  const preview = studySpace.parseContentPackage(packageText(), target);
  const withoutPdf = {
    ...target,
    materials: target.materials.map((material) => ({ ...material, status: "missing" })),
  };
  assert.equal(studySpace.applyContentImport(withoutPdf, preview).questions.length, 1);
  assert.throws(
    () => studySpace.applyContentImport({ ...withoutPdf, materials: [] }, preview),
    /Quellenangabe ist ungültig/,
  );
  assert.equal(target.questions.length, 0);
});

test("Study Space backup import rejects invalid state and merges without overwriting existing courses", () => {
  const current = studySpace.createDefaultSpace(null, []);
  const imported = {
    ...studySpace.createDefaultSpace(null, []),
    courses: [course({ id: "course-other", name: "Other course" })],
  };
  const merged = studySpace.mergeStudySpace(current, imported);
  assert.equal(merged.courses.length, 2);
  assert.equal(merged.courses[1].materials[0].status, "missing");
  assert.equal(merged.courses[0].id, "course-abwl");
  assert.throws(() => studySpace.mergeStudySpace(merged, imported), /bereits vorhanden/);

  const invalid = { ...imported, courses: [{ ...imported.courses[0], progress: { correctAnswers: -1 } }] };
  assert.throws(() => studySpace.parseStudySpace(JSON.stringify(invalid)), /ungültiges Format/);
  assert.equal(current.courses.length, 1);
});

test("same question IDs remain isolated when stored in separate courses", () => {
  const sharedQuestion = {
    ...flashcard(),
    chapter: "Chapter",
    sourcePages: [4],
    sourceFileName: "source.pdf",
    placeholder: false,
    uncertain: false,
  };
  const first = course({ id: "course-first", questions: [sharedQuestion] });
  const second = course({ id: "course-second", questions: [sharedQuestion] });
  const merged = studySpace.mergeStudySpace(
    { format: studySpace.STUDY_SPACE_FORMAT, version: studySpace.STUDY_SPACE_VERSION, activeCourseId: null, courses: [first] },
    { format: studySpace.STUDY_SPACE_FORMAT, version: studySpace.STUDY_SPACE_VERSION, activeCourseId: null, courses: [second] },
  );
  assert.equal(merged.courses.length, 2);
  assert.equal(merged.courses[0].questions[0].id, merged.courses[1].questions[0].id);
});
````
