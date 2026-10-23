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
export type TopicAttentionQuestion = {
  questionId: string;
  topicId: string;
  markedForReview: boolean;
  confidentError: boolean;
};
export type TopicAttentionSummary = {
  topicId: string;
  markedForReview: number;
  repeatedMistakes: number;
  confidentErrors: number;
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

export function abandonUnfinishedSession(progress: Progress): Progress {
  return progress.unfinishedSession
    ? { ...progress, unfinishedSession: null }
    : progress;
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

export function summarizeTopicAttention(
  history: readonly StudyHistoryEntry[],
  questions: readonly TopicAttentionQuestion[],
): TopicAttentionSummary[] {
  const missesByQuestion = new Map<string, number>();
  for (const entry of history) {
    if (entry.type !== "study") continue;
    for (const questionId of new Set(entry.missedIds)) {
      missesByQuestion.set(questionId, (missesByQuestion.get(questionId) ?? 0) + 1);
    }
  }

  const byTopic = new Map<string, TopicAttentionSummary>();
  const seenQuestions = new Set<string>();
  for (const question of questions) {
    if (seenQuestions.has(question.questionId)) continue;
    seenQuestions.add(question.questionId);
    const repeatedMistake = (missesByQuestion.get(question.questionId) ?? 0) >= 2;
    if (!question.markedForReview && !question.confidentError && !repeatedMistake) continue;
    const summary = byTopic.get(question.topicId) ?? {
      topicId: question.topicId,
      markedForReview: 0,
      repeatedMistakes: 0,
      confidentErrors: 0,
    };
    summary.markedForReview += Number(question.markedForReview);
    summary.repeatedMistakes += Number(repeatedMistake);
    summary.confidentErrors += Number(question.confidentError);
    byTopic.set(question.topicId, summary);
  }

  return [...byTopic.values()].sort((left, right) =>
    right.repeatedMistakes - left.repeatedMistakes
    || right.confidentErrors - left.confidentErrors
    || right.markedForReview - left.markedForReview
    || left.topicId.localeCompare(right.topicId, "de"));
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
