export type View =
  | "overview" | "learn" | "quiz" | "cards" | "review" | "errors" | "progress"
  | "sessions" | "studySession" | "studySummary" | "examSetup" | "exam"
  | "saved" | "history" | "importContent";

export type NavigationGroupId = "learn" | "review" | "contents";
export type NavigationSection = "overview" | NavigationGroupId | "exam" | "progress";

export type NavigationItem = { view: View; label: string };
export type NavigationEntry =
  | { kind: "link"; id: "overview" | "exam" | "progress"; label: string; icon: string; view: View }
  | { kind: "group"; id: NavigationGroupId; label: string; icon: string; items: NavigationItem[] };

export const NAVIGATION: NavigationEntry[] = [
  { kind: "link", id: "overview", label: "Lernpfad", icon: "⌂", view: "overview" },
  {
    kind: "group",
    id: "learn",
    label: "Lernen",
    icon: "▤",
    items: [
      { view: "learn", label: "Erklär es selbst" },
      { view: "quiz", label: "Quiz" },
      { view: "cards", label: "Lernkarten" },
      { view: "sessions", label: "Lernsitzung" },
    ],
  },
  {
    kind: "group",
    id: "review",
    label: "Wiederholen",
    icon: "↻",
    items: [
      { view: "review", label: "Heute wiederholen" },
      { view: "errors", label: "Fehlerliste" },
    ],
  },
  { kind: "link", id: "exam", label: "Prüfung", icon: "▣", view: "examSetup" },
  {
    kind: "group",
    id: "contents",
    label: "Inhalte",
    icon: "⇧",
    items: [
      { view: "importContent", label: "Lernpaket importieren" },
      { view: "saved", label: "Gespeicherte Inhalte" },
    ],
  },
  { kind: "link", id: "progress", label: "Fortschritt", icon: "◷", view: "progress" },
];

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

export function groupForView(view: View): NavigationGroupId | undefined {
  const section = sectionForView(view);
  return section === "learn" || section === "review" || section === "contents"
    ? section
    : undefined;
}
