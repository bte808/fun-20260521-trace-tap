# Trace Tap

Trace Tap is a tiny browser game about debugging by following clues through a call graph. Each round gives you an incident log, a clickable graph, and a short objective: tap the nodes in the order that explains the bug, from visible symptom to root cause.

## Why this exists

Modern developer tools keep making code relationships more visible. Recent public inspiration included a JavaScript Showoff thread with a graph visualizer and cycle finder, a small "who called this function" code analysis tool, and Product Hunt's current developer-tool feed where monitoring and debugging products were visible. Trace Tap turns that work-shaped idea into a quick game instead of a serious analyzer.

Inspiration links:

- Reddit r/javascript Showoff Saturday, May 16 2026: https://www.reddit.com/r/javascript/comments/1tem5bg/showoff_saturday_may_16_2026/
- GitHub daily JavaScript trending page: https://github.com/trending/javascript?since=daily
- Product Hunt front page developer-tool listings: https://www.producthunt.com/

No source code, design, text, or assets were copied from those links. This is an original static toy.

## What it does

- Shows three short incident cases.
- Presents each case as logs plus a clickable call graph.
- Lets you build a trace by clicking nodes in order.
- Scores each case, with small penalties for hints and wrong submissions.
- Marks a failed trace so the correct prefix and first break are visible.
- Can keep the confirmed-good prefix after a failed trace, so you can continue from the break.
- Reveals the root cause and a compact fix after each solved case.
- Works as a no-build static site.

## Who it is for

Trace Tap is for people who like debugging puzzles, students learning how cause-and-effect flows through software, or engineers who want a two-minute warmup before real code review.

## Why it is useful

It rewards the habit of reading symptoms, ignoring plausible side paths, and forming a precise chain of causality before jumping to a fix. That is the same shape as practical debugging, but in a small safe loop.

## Why it is fun

The graph looks like a real incident map, but each round is short enough to solve by deduction. Hints lower your score, so there is a light push to trust the logs and commit to a trace.

## Run locally

Open `index.html` directly in a browser, or serve the folder locally:

```bash
npm run start
```

Then open:

```text
http://localhost:5174/
```

## Play steps

1. Read the incident log.
2. Tap the graph node where the symptom appears.
3. Keep tapping upstream nodes until you reach the root cause.
4. Press `Submit`.
5. If the trace is wrong, keep the green steps and revise from the red break.
6. Use `Keep good prefix` to trim away the wrong tail after a reviewed failed trace.
7. Use `Next case` after a correct trace.

## Validation

```bash
npm test
node --check src/app.js
node --check src/puzzles.js
```

The browser UI was also checked on desktop and mobile-sized viewports during the 2026-05-21, 2026-05-25, and 2026-05-28 automation runs.

## Possible extensions

- Add a daily seeded case.
- Add a mode that hides node clues until clicked.
- Add an editor for making custom incident maps.
- Export a solved trace as a shareable text card.
