const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const Ajv2020 = require("ajv/dist/2020").default;

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
const validatePackageSchema = new Ajv2020({ allErrors: true }).compile(packageSchema);
const validPackageFixture = fs.readFileSync(path.join(__dirname, "fixtures", "content-valid.json"), "utf8");
const invalidPackageFixture = fs.readFileSync(path.join(__dirname, "fixtures", "content-invalid-chapter.json"), "utf8");
const invalidSchemaFixture = fs.readFileSync(path.join(__dirname, "fixtures", "content-invalid-schema.json"), "utf8");

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

test("content fixtures are checked against the JSON Schema and the context-aware runtime validator", () => {
  assert.equal(packageSchema.properties.format.const, studySpace.CONTENT_PACKAGE_FORMAT);
  assert.equal(packageSchema.properties.version.const, studySpace.CONTENT_PACKAGE_VERSION);
  assert.deepEqual(packageSchema.required, ["format", "version", "chapters", "items"]);
  assert.equal(validatePackageSchema(JSON.parse(validPackageFixture)), true);
  assert.equal(validatePackageSchema(JSON.parse(invalidSchemaFixture)), false);
  assert.equal(validatePackageSchema(JSON.parse(invalidPackageFixture)), true);

  const target = course();
  assert.doesNotThrow(() => studySpace.parseContentPackage(validPackageFixture, target));
  assert.throws(() => studySpace.parseContentPackage(invalidSchemaFixture, target));
  assert.throws(() => studySpace.parseContentPackage(invalidPackageFixture, target), /unbekanntes Kapitel/);
});

test("schema and runtime reject invalid IDs, answer shapes, sources, and unknown fields", () => {
  const target = course();
  const valid = JSON.parse(validPackageFixture);
  const invalidCases = [
    { ...valid, items: [{ ...valid.items[0], id: " " }] },
    { ...valid, items: [{ ...valid.items[0], source: { materialId: "material-1", page: 0 } }] },
    { ...valid, items: [{ ...valid.items[0], unexpected: true }] },
    { ...valid, items: [{ ...valid.items[0], kind: "quiz", answer: undefined, options: ["A"], correctOption: 0 }] },
  ];
  for (const invalid of invalidCases) {
    assert.equal(validatePackageSchema(invalid), false);
    assert.throws(() => studySpace.parseContentPackage(JSON.stringify(invalid), target));
  }

  const outOfRangeAnswer = {
    ...valid,
    items: [{
      ...valid.items[0],
      kind: "quiz",
      answer: undefined,
      options: ["A", "B"],
      correctOption: 2,
    }],
  };
  assert.equal(validatePackageSchema(outOfRangeAnswer), true);
  assert.throws(() => studySpace.parseContentPackage(JSON.stringify(outOfRangeAnswer), target));

  const unknownVersion = { ...valid, version: 999 };
  assert.equal(validatePackageSchema(unknownVersion), false);
  assert.throws(() => studySpace.parseContentPackage(JSON.stringify(unknownVersion), target));
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

test("valid and invalid JSON fixtures are checked before any course data changes", () => {
  const target = course();
  const preview = studySpace.parseContentPackage(validPackageFixture, target);
  assert.equal(preview.questions.length, 1);
  const before = structuredClone(target);
  assert.throws(() => studySpace.parseContentPackage(invalidPackageFixture, target), /unbekanntes Kapitel/);
  assert.deepEqual(target, before);
  assert.throws(() => studySpace.parseContentPackage(
    JSON.stringify({ ...JSON.parse(validPackageFixture), version: 99 }),
    target,
  ), /Unbekanntes Paketformat/);
});

test("sequential packages with repeated chapter IDs and names retain distinct chapter references", () => {
  const target = course();
  const firstPreview = studySpace.parseContentPackage(packageText([flashcard({ id: "first-card" })]), target);
  const afterFirst = studySpace.applyContentImport(target, firstPreview);
  const secondPackage = JSON.parse(packageText([flashcard({ id: "second-card" })]));
  const secondPreview = studySpace.parseContentPackage(JSON.stringify(secondPackage), afterFirst);
  const afterSecond = studySpace.applyContentImport(afterFirst, secondPreview);

  assert.deepEqual(afterSecond.chapters.map(({ id, title }) => ({ id, title })), [
    { id: "chapter-one", title: "Chapter" },
    { id: "chapter-one~2", title: "Chapter" },
  ]);
  assert.deepEqual(afterSecond.questions.map(({ chapterId, chapterNumber }) => ({ chapterId, chapterNumber })), [
    { chapterId: "chapter-one", chapterNumber: 1 },
    { chapterId: "chapter-one~2", chapterNumber: 2 },
  ]);
  assert.equal(studySpace.resolveQuestionChapterId(afterSecond.questions[0], afterSecond.chapters), "chapter-one");
  assert.equal(studySpace.resolveQuestionChapterId(afterSecond.questions[1], afterSecond.chapters), "chapter-one~2");
  assert.equal(afterSecond.questions[1].sectionId, "section-one");
  assert.equal(afterSecond.questions[1].chapter, "Chapter");
});

test("legacy unique chapter names migrate to IDs, while ambiguous duplicate titles remain unassigned", () => {
  const legacyQuestion = {
    id: "legacy-card",
    kind: "flashcard",
    prompt: "Legacy prompt",
    answer: "Legacy answer",
    chapter: "Legacy chapter",
    chapterNumber: 1,
    questionType: "Lernkarte",
    sourcePages: [4],
    sourceFileName: "source.pdf",
    placeholder: false,
    uncertain: false,
  };
  const legacy = {
    format: studySpace.STUDY_SPACE_FORMAT,
    version: studySpace.STUDY_SPACE_VERSION,
    activeCourseId: "course-test",
    courses: [course({
      chapters: [
        { id: "legacy-id", title: "Legacy chapter", sections: [] },
        { id: "duplicate-a", title: "Same title", sections: [] },
        { id: "duplicate-b", title: "Same title", sections: [] },
      ],
      questions: [legacyQuestion, { ...legacyQuestion, id: "ambiguous", chapter: "Same title", chapterNumber: 2 }],
      progress: {
        ...structuredClone(progress.emptyProgress),
        knownIds: ["legacy-card"],
        correctAnswers: 3,
      },
    })],
  };
  const migrated = studySpace.parseStudySpace(JSON.stringify(legacy)).courses[0];
  assert.equal(migrated.questions[0].chapterId, "legacy-id");
  assert.equal(migrated.questions[0].chapterNumber, 1);
  assert.equal(migrated.questions[1].chapterId, undefined);
  assert.equal(studySpace.resolveQuestionChapterId(migrated.questions[1], migrated.chapters), undefined);
  assert.equal(studySpace.isQuestionChapterUnresolved(migrated.questions[0], migrated.chapters), false);
  assert.equal(studySpace.isQuestionChapterUnresolved(migrated.questions[1], migrated.chapters), true);
  assert.deepEqual(migrated.progress.knownIds, ["legacy-card"]);
  assert.equal(migrated.progress.correctAnswers, 3);
});

test("local persistence accepts editable legacy spaces larger than 1.5 million characters", () => {
  const space = studySpace.createDefaultSpace(null, []);
  const oldSpace = {
    ...space,
    courses: [{ ...space.courses[0], name: `ABWL${"x".repeat(1_500_001)}` }],
  };
  let storedValue = studySpace.createStudySpaceBackup(oldSpace);
  assert.ok(storedValue.length > 1_500_000);
  const loaded = studySpace.parseStudySpace(storedValue);
  const edited = {
    ...loaded,
    courses: [{ ...loaded.courses[0], name: `${loaded.courses[0].name} bearbeitet` }],
  };
  const storage = { setItem: (_key, value) => { storedValue = value; } };
  const committed = studySpace.commitStudySpace(storage, edited);
  assert.equal(committed.courses[0].name, edited.courses[0].name);
  assert.equal(studySpace.parseStudySpace(storedValue).courses[0].name, edited.courses[0].name);
  assert.ok(storedValue.length > 1_500_000);
});

test("a rejected write leaves the stored and visible study space unchanged", () => {
  const baseSpace = studySpace.createDefaultSpace(null, []);
  const oldSpace = {
    ...baseSpace,
    courses: [{ ...baseSpace.courses[0], name: `ABWL${"x".repeat(1_500_001)}` }],
  };
  const oldValue = studySpace.createStudySpaceBackup(oldSpace);
  assert.ok(oldValue.length > 1_500_000);
  let visibleSpace = oldSpace;
  const rejectingStorage = {
    value: oldValue,
    setItem() { throw new Error("quota"); },
  };
  assert.throws(
    () => { visibleSpace = studySpace.commitStudySpace(rejectingStorage, {
      ...oldSpace,
      courses: [{ ...oldSpace.courses[0], name: "Uncommitted" }],
    }); },
    /lokal nicht gespeichert/,
  );
  assert.equal(rejectingStorage.value, oldValue);
  assert.equal(visibleSpace, oldSpace);
  assert.equal(studySpace.parseStudySpace(rejectingStorage.value).courses[0].name, oldSpace.courses[0].name);
});

test("oversized content packages and backups are rejected without touching stored data", () => {
  const target = course();
  const space = studySpace.createDefaultSpace(null, []);
  const oldValue = studySpace.createStudySpaceBackup(space);
  const storage = { value: oldValue, setItem(_key, value) { this.value = value; } };
  const oversizedPackage = `${packageText([flashcard({ prompt: "x".repeat(1_000_001) })])}`;
  assert.throws(() => studySpace.parseContentPackage(oversizedPackage, target), /zu groß/);
  const oversizedBackup = `${oldValue}${" ".repeat(20_000_001)}`;
  assert.throws(() => studySpace.parseStudySpace(oversizedBackup), /zu groß/);
  assert.equal(storage.value, oldValue);
  assert.equal(studySpace.parseStudySpace(storage.value).courses[0].id, "course-abwl");
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
    packageText([flashcard({ prompt: undefined })]),
    target,
  ), /ungültige Felder/);
  assert.throws(() => studySpace.parseContentPackage(
    packageText([flashcard({ uncertain: "yes" })]),
    target,
  ), /ungültige Felder/);
  assert.throws(() => studySpace.parseContentPackage(
    packageText([flashcard({ keyTerms: [3] })]),
    target,
  ), /Begriffe oder Beispiele/);
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
  assert.throws(() => studySpace.parseContentPackage(packageText(), target), /Lerninhalt-ID/);
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
