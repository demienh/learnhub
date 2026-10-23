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
