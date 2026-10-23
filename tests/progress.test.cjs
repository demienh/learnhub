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

test("abandoning a study session clears only the unfinished session and keeps prior progress", () => {
  const session = {
    type: "study",
    startedAt: "2026-10-22T08:00:00.000Z",
    items: [{ questionId: "flash-a", mode: "lernen" }],
    index: 0,
    durationMinutes: null,
    answers: {},
    submitted: false,
    retryMissed: false,
  };
  const state = blank({
    unfinishedSession: session,
    knownIds: ["flash-a"],
    correctAnswers: 4,
    history: [{ id: "earlier", date: "2026-10-21", type: "study", durationSeconds: 20, attempted: 1, correct: 1, questionIds: ["flash-a"], missedIds: [] }],
  });
  const abandoned = progress.abandonUnfinishedSession(state);
  assert.equal(abandoned.unfinishedSession, null);
  assert.deepEqual(abandoned.knownIds, state.knownIds);
  assert.equal(abandoned.correctAnswers, state.correctAnswers);
  assert.deepEqual(abandoned.history, state.history);
  const noSession = blank();
  assert.equal(progress.abandonUnfinishedSession(noSession), noSession);
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
