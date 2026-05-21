export const cases = [
  {
    id: "checkout-cache",
    tag: "frontend incident",
    title: "Checkout total will not update",
    brief:
      "A shopper removes a coupon, but the drawer still shows the old total before payment preflight.",
    logs: [
      "10:14:09 coupon:removed event emitted",
      "10:14:09 total selector served a cached value",
      "10:14:10 checkout drawer rendered the stale total",
      "10:14:11 preflight accepted the amount from the drawer"
    ],
    nodes: [
      {
        id: "drawer",
        label: "CheckoutDrawer",
        type: "symptom",
        x: 24,
        y: 47,
        clue: "The visible symptom starts in the drawer."
      },
      {
        id: "selector",
        label: "totalSelector",
        type: "logic",
        x: 43,
        y: 31,
        clue: "The drawer asks this selector for the latest amount."
      },
      {
        id: "cache",
        label: "couponCache",
        type: "store",
        x: 62,
        y: 44,
        clue: "The selector trusts this cache after coupon events."
      },
      {
        id: "key",
        label: "staleKey",
        type: "root",
        x: 76,
        y: 27,
        clue: "The key ignores coupon removal, so old totals are reused."
      },
      {
        id: "gateway",
        label: "PaymentGateway",
        type: "decoy",
        x: 75,
        y: 70,
        clue: "This only reads the value after the drawer has already rendered."
      },
      {
        id: "theme",
        label: "themeRefresh",
        type: "decoy",
        x: 43,
        y: 72,
        clue: "It repaints colors, not totals."
      }
    ],
    edges: [
      ["drawer", "selector"],
      ["selector", "cache"],
      ["cache", "key"],
      ["drawer", "theme"],
      ["drawer", "gateway"],
      ["cache", "gateway"]
    ],
    trace: ["drawer", "selector", "cache", "key"],
    fix: "Include coupon removal in the cache key or clear couponCache before CheckoutDrawer renders."
  },
  {
    id: "upload-retry",
    tag: "mobile web incident",
    title: "Receipt upload retries forever",
    brief:
      "Small images upload, but receipts above 5 MB stay in a retry loop with no useful error.",
    logs: [
      "12:01:22 upload panel reports retrying",
      "12:01:23 retry queue schedules the same blob again",
      "12:01:23 token refresh succeeds",
      "12:01:24 blob splitter returns a part larger than the signed URL limit"
    ],
    nodes: [
      {
        id: "panel",
        label: "UploadPanel",
        type: "symptom",
        x: 24,
        y: 36,
        clue: "The user sees the loop here."
      },
      {
        id: "queue",
        label: "retryQueue",
        type: "logic",
        x: 42,
        y: 56,
        clue: "It repeats failures without changing the payload."
      },
      {
        id: "splitter",
        label: "blobSplitter",
        type: "store",
        x: 60,
        y: 39,
        clue: "Large receipts depend on this split step."
      },
      {
        id: "limit",
        label: "partLimit",
        type: "root",
        x: 76,
        y: 50,
        clue: "The max part size is larger than the signed URL accepts."
      },
      {
        id: "token",
        label: "tokenRefresh",
        type: "decoy",
        x: 42,
        y: 19,
        clue: "The log says token refresh succeeds."
      },
      {
        id: "preview",
        label: "imagePreview",
        type: "decoy",
        x: 74,
        y: 17,
        clue: "Preview happens before network upload."
      }
    ],
    edges: [
      ["panel", "queue"],
      ["queue", "splitter"],
      ["splitter", "limit"],
      ["queue", "token"],
      ["splitter", "preview"],
      ["token", "limit"]
    ],
    trace: ["panel", "queue", "splitter", "limit"],
    fix: "Lower the splitter part size and surface a hard error after the first rejected signed URL."
  },
  {
    id: "dashboard-units",
    tag: "analytics incident",
    title: "Dashboard spike looks ten times too high",
    brief:
      "A revenue chart jumps at midnight even though raw orders and payments look normal.",
    logs: [
      "00:03:02 aggregate panel draws a sudden spike",
      "00:03:02 event normalizer converts nightly rows",
      "00:03:03 unit parser reads cents as dollars for one source",
      "00:03:04 anomaly banner fires after aggregation"
    ],
    nodes: [
      {
        id: "panel",
        label: "AggregatePanel",
        type: "symptom",
        x: 24,
        y: 51,
        clue: "The spike is visible in this panel."
      },
      {
        id: "normalizer",
        label: "eventNormalizer",
        type: "logic",
        x: 42,
        y: 34,
        clue: "Nightly rows are converted here before display."
      },
      {
        id: "parser",
        label: "unitParser",
        type: "store",
        x: 60,
        y: 53,
        clue: "The log calls out a unit conversion problem."
      },
      {
        id: "source",
        label: "legacySource",
        type: "root",
        x: 76,
        y: 36,
        clue: "This source still sends cents, but the parser treats them as dollars."
      },
      {
        id: "banner",
        label: "anomalyBanner",
        type: "decoy",
        x: 42,
        y: 74,
        clue: "It reports the spike after aggregation."
      },
      {
        id: "orders",
        label: "orderStore",
        type: "decoy",
        x: 72,
        y: 75,
        clue: "Raw orders are normal in the log."
      }
    ],
    edges: [
      ["panel", "normalizer"],
      ["normalizer", "parser"],
      ["parser", "source"],
      ["panel", "banner"],
      ["normalizer", "orders"],
      ["orders", "parser"]
    ],
    trace: ["panel", "normalizer", "parser", "source"],
    fix: "Tag legacySource rows with cents and normalize them before the chart aggregation step."
  }
];

export function evaluateTrace(caseItem, selectedIds) {
  const expected = caseItem.trace;
  const exact = selectedIds.length === expected.length && selectedIds.every((id, index) => id === expected[index]);
  const prefixLength = selectedIds.findIndex((id, index) => id !== expected[index]);
  const matchedPrefix = prefixLength === -1 ? Math.min(selectedIds.length, expected.length) : prefixLength;
  const missing = expected.slice(matchedPrefix);
  const extra = selectedIds.filter((id) => !expected.includes(id));

  return {
    exact,
    matchedPrefix,
    missing,
    extra,
    root: expected.at(-1)
  };
}

export function scoreCase({ hintsUsed, failedSubmits }) {
  return Math.max(90, 300 - hintsUsed * 35 - failedSubmits * 45);
}
