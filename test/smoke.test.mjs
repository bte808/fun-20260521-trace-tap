import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { cases, evaluateTrace, scoreCase } from "../src/puzzles.js";

await Promise.all([
  access("index.html"),
  access("styles.css"),
  access("src/app.js"),
  access("src/puzzles.js"),
  access("README.md")
]);

assert.equal(cases.length, 3, "Trace Tap should ship three playable cases");

for (const caseItem of cases) {
  assert.ok(caseItem.title.length > 0, "case title exists");
  assert.ok(caseItem.logs.length >= 4, "case has enough log clues");
  assert.ok(caseItem.nodes.length >= 6, "case has clue nodes and decoys");

  const nodeIds = new Set(caseItem.nodes.map((node) => node.id));
  assert.equal(nodeIds.size, caseItem.nodes.length, "node ids are unique");

  for (const id of caseItem.trace) {
    assert.ok(nodeIds.has(id), `${caseItem.id} trace references existing node ${id}`);
  }

  const solved = evaluateTrace(caseItem, caseItem.trace);
  assert.equal(solved.exact, true, `${caseItem.id} correct trace solves`);
  assert.equal(solved.root, caseItem.trace.at(-1), "root is final trace step");

  const wrong = evaluateTrace(caseItem, [caseItem.trace[0], "not-a-node"]);
  assert.equal(wrong.exact, false, `${caseItem.id} wrong trace fails`);
  assert.ok(wrong.missing.length > 0, `${caseItem.id} reports missing steps`);

  const brokenPrefix = evaluateTrace(caseItem, [caseItem.trace[0], caseItem.trace[2]]);
  assert.equal(brokenPrefix.matchedPrefix, 1, `${caseItem.id} reports the first broken step`);
  assert.equal(brokenPrefix.missing[0], caseItem.trace[1], `${caseItem.id} points to the next needed node`);
}

assert.equal(scoreCase({ hintsUsed: 0, failedSubmits: 0 }), 300);
assert.equal(scoreCase({ hintsUsed: 2, failedSubmits: 1 }), 185);
assert.equal(scoreCase({ hintsUsed: 8, failedSubmits: 8 }), 90);

console.log("Trace Tap smoke test passed: files exist, cases solve, scoring is bounded.");
