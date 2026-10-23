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

test("navigation keeps the learning path and progress direct, with related views grouped", () => {
  assert.deepEqual(navigation.NAVIGATION.map(({ label }) => label), [
    "Lernpfad", "Lernen", "Wiederholen", "Prüfung", "Inhalte", "Fortschritt",
  ]);
  assert.deepEqual(navigation.NAVIGATION.filter(({ kind }) => kind === "link").map(({ view }) => view), [
    "overview", "examSetup", "progress",
  ]);
});

test("learning modes, repeat lists, saved items, exam, and history remain reachable", () => {
  const groups = Object.fromEntries(navigation.NAVIGATION
    .filter(({ kind }) => kind === "group")
    .map(({ id, items }) => [id, items.map(({ view }) => view)]));
  assert.deepEqual(groups.learn, ["learn", "quiz", "cards", "sessions"]);
  assert.deepEqual(groups.review, ["review", "errors"]);
  assert.deepEqual(groups.contents, ["importContent", "saved"]);
  assert.equal(navigation.sectionForView("history"), "progress");
  assert.equal(navigation.sectionForView("studySession"), "learn");
  assert.equal(navigation.sectionForView("exam"), "exam");
  assert.equal(navigation.sectionForView("studySummary"), "learn");
  assert.equal(navigation.groupForView("history"), undefined);
  assert.equal(navigation.groupForView("review"), "review");
});
