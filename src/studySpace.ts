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
