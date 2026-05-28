import { cases, evaluateTrace, keepMatchedPrefix, scoreCase } from "./puzzles.js";

const state = {
  caseIndex: 0,
  selected: [],
  completed: new Set(),
  hintsUsed: 0,
  failedSubmits: 0,
  score: 0,
  finished: false,
  lastSubmission: null
};

const els = {
  score: document.querySelector("#score"),
  caseStep: document.querySelector("#case-step"),
  caseTag: document.querySelector("#case-tag"),
  caseTitle: document.querySelector("#case-title"),
  caseBrief: document.querySelector("#case-brief"),
  progressFill: document.querySelector("#progress-fill"),
  logList: document.querySelector("#log-list"),
  hintBox: document.querySelector("#hint-box"),
  edgeLayer: document.querySelector("#edge-layer"),
  nodeLayer: document.querySelector("#node-layer"),
  traceList: document.querySelector("#trace-list"),
  statusLine: document.querySelector("#status-line"),
  casePoints: document.querySelector("#case-points"),
  hintButton: document.querySelector("#hint-button"),
  undoButton: document.querySelector("#undo-button"),
  resetButton: document.querySelector("#reset-button"),
  submitButton: document.querySelector("#submit-button"),
  repairButton: document.querySelector("#repair-button"),
  nextButton: document.querySelector("#next-button")
};

function currentCase() {
  return cases[state.caseIndex];
}

function nodeById(caseItem, id) {
  return caseItem.nodes.find((node) => node.id === id);
}

function render() {
  const caseItem = currentCase();
  const solved = state.completed.has(caseItem.id);
  const caseScore = scoreCase(state);

  els.score.textContent = String(state.score);
  els.caseStep.textContent = `Case ${state.caseIndex + 1} of ${cases.length}`;
  els.caseTag.textContent = caseItem.tag;
  els.caseTitle.textContent = caseItem.title;
  els.caseBrief.textContent = caseItem.brief;
  els.casePoints.textContent = `${caseScore} pts`;
  els.progressFill.style.width = `${(state.completed.size / cases.length) * 100}%`;

  els.logList.replaceChildren(
    ...caseItem.logs.map((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      return li;
    })
  );

  renderEdges(caseItem);
  renderNodes(caseItem);
  renderTrace(caseItem);

  const locked = solved || state.finished;
  els.hintButton.disabled = locked;
  els.undoButton.disabled = locked || state.selected.length === 0;
  els.resetButton.disabled = locked || state.selected.length === 0;
  els.submitButton.disabled = locked || state.selected.length === 0;
  els.repairButton.hidden =
    locked ||
    !state.lastSubmission ||
    state.lastSubmission.matchedPrefix === 0 ||
    state.lastSubmission.matchedPrefix >= state.selected.length;
  els.nextButton.hidden = !solved && !state.finished;
  els.nextButton.textContent = state.finished ? "Restart set" : "Next case";
}

function renderEdges(caseItem) {
  els.edgeLayer.replaceChildren(
    ...caseItem.edges.map(([fromId, toId]) => {
      const from = nodeById(caseItem, fromId);
      const to = nodeById(caseItem, toId);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("class", "edge-line");
      return line;
    })
  );
}

function renderNodes(caseItem) {
  els.nodeLayer.replaceChildren(
    ...caseItem.nodes.map((node) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `graph-node node-${node.type}`;
      button.dataset.id = node.id;
      button.dataset.testid = `node-${node.id}`;
      button.style.left = `${node.x}%`;
      button.style.top = `${node.y}%`;
      button.setAttribute("aria-pressed", state.selected.includes(node.id) ? "true" : "false");
      button.innerHTML = `<strong>${node.label}</strong><span>${node.clue}</span>`;
      if (state.selected.includes(node.id)) {
        button.classList.add("selected");
      }
      if (state.completed.has(caseItem.id) && caseItem.trace.includes(node.id)) {
        button.classList.add("solved");
      }
      button.addEventListener("click", () => selectNode(node.id));
      return button;
    })
  );
}

function renderTrace(caseItem) {
  if (state.selected.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-trace";
    empty.textContent = "No nodes selected yet.";
    els.traceList.replaceChildren(empty);
    return;
  }

  els.traceList.replaceChildren(
    ...state.selected.map((id, index) => {
      const node = nodeById(caseItem, id);
      const li = document.createElement("li");
      const wasReviewed = state.lastSubmission?.selected.join("|") === state.selected.join("|");
      if (wasReviewed) {
        li.classList.add(index < state.lastSubmission.matchedPrefix ? "trace-step-ok" : "trace-step-break");
      }
      li.innerHTML = `<span>${index + 1}</span><strong>${node.label}</strong>`;
      return li;
    })
  );
}

function selectNode(id) {
  const caseItem = currentCase();
  if (state.completed.has(caseItem.id) || state.finished) {
    return;
  }
  if (state.selected.at(-1) === id) {
    els.statusLine.textContent = "That node is already the current step.";
    return;
  }
  state.selected.push(id);
  state.lastSubmission = null;
  const node = nodeById(caseItem, id);
  els.statusLine.textContent = `${node.label} added to the trace.`;
  render();
}

function undoStep() {
  const caseItem = currentCase();
  if (state.completed.has(caseItem.id) || state.finished) {
    return;
  }
  const removed = state.selected.pop();
  state.lastSubmission = null;
  if (removed) {
    els.statusLine.textContent = "Removed the last step.";
  }
  render();
}

function resetCase() {
  const caseItem = currentCase();
  if (state.completed.has(caseItem.id) || state.finished) {
    return;
  }
  state.selected = [];
  state.hintsUsed = 0;
  state.failedSubmits = 0;
  state.lastSubmission = null;
  els.hintBox.textContent = "Click the symptom first, then follow the strongest clue upstream.";
  els.statusLine.textContent = "Trace reset. Start from the visible symptom.";
  render();
}

function keepGoodPrefix() {
  const caseItem = currentCase();
  if (state.completed.has(caseItem.id) || state.finished || !state.lastSubmission) {
    return;
  }

  const keptCount = state.lastSubmission.matchedPrefix;
  state.selected = keepMatchedPrefix(state.selected, keptCount);
  state.lastSubmission = null;
  els.statusLine.textContent =
    keptCount === 1
      ? "Kept the first correct step. Continue from there."
      : `Kept ${keptCount} correct steps. Continue from there.`;
  render();
}

function showHint() {
  const caseItem = currentCase();
  if (state.completed.has(caseItem.id) || state.finished) {
    return;
  }

  const evaluation = evaluateTrace(caseItem, state.selected);
  const nextId = evaluation.missing[0] ?? caseItem.trace[0];
  const nextNode = nodeById(caseItem, nextId);
  state.hintsUsed += 1;
  els.hintBox.textContent = `Next useful clue: ${nextNode.label}. ${nextNode.clue}`;
  els.statusLine.textContent = "Hint used. Points for this case dropped.";
  render();
}

function submitTrace() {
  const caseItem = currentCase();
  const result = evaluateTrace(caseItem, state.selected);

  if (!result.exact) {
    state.failedSubmits += 1;
    state.lastSubmission = {
      matchedPrefix: result.matchedPrefix,
      selected: [...state.selected]
    };
    const next = result.missing[0] ? nodeById(caseItem, result.missing[0]).label : "the root cause";
    const extraText = result.extra.length > 0 ? " One selected node is only a side path." : "";
    els.statusLine.textContent = `Not yet. The trace breaks before ${next}.${extraText}`;
    render();
    return;
  }

  const earned = scoreCase(state);
  state.score += earned;
  state.completed.add(caseItem.id);
  state.lastSubmission = null;
  els.hintBox.textContent = `Root cause: ${nodeById(caseItem, result.root).label}. Fix: ${caseItem.fix}`;
  els.statusLine.textContent = `Correct trace. +${earned} points.`;

  if (state.completed.size === cases.length) {
    state.finished = true;
    els.statusLine.textContent = `Set complete. Final score: ${state.score}.`;
  }

  render();
}

function nextCase() {
  if (state.finished) {
    state.caseIndex = 0;
    state.selected = [];
    state.completed = new Set();
    state.hintsUsed = 0;
    state.failedSubmits = 0;
    state.score = 0;
    state.finished = false;
    state.lastSubmission = null;
    els.hintBox.textContent = "Click the symptom first, then follow the strongest clue upstream.";
    els.statusLine.textContent = "New set ready. Start from the visible symptom.";
    render();
    return;
  }

  state.caseIndex += 1;
  state.selected = [];
  state.hintsUsed = 0;
  state.failedSubmits = 0;
  state.lastSubmission = null;
  els.hintBox.textContent = "Read the log, then build the shortest trace to the root cause.";
  els.statusLine.textContent = "Next case loaded.";
  render();
}

els.hintButton.addEventListener("click", showHint);
els.undoButton.addEventListener("click", undoStep);
els.resetButton.addEventListener("click", resetCase);
els.submitButton.addEventListener("click", submitTrace);
els.repairButton.addEventListener("click", keepGoodPrefix);
els.nextButton.addEventListener("click", nextCase);

render();
