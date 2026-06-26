const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const opportunitiesPath = path.join(root, "data", "opportunities.json");
const categoriesPath = path.join(root, "data", "categories.json");
const signalsPath = path.join(root, "data", "signals.json");
const siteDataPath = path.join(root, "site", "data.js");

const requiredFields = [
  "id",
  "title",
  "status",
  "category",
  "target_user",
  "signal_sources",
  "trigger_phrases",
  "user_scene",
  "input",
  "output",
  "current_workaround",
  "ai_product",
  "mvp_scope",
  "charge_model",
  "why_now",
  "scores",
  "tags",
  "collected_at"
];

const scoreFields = ["pain", "frequency", "ai_fit", "mvp_speed", "payment", "distribution"];
const statuses = new Set(["seed-hypothesis", "signal-found", "manual-tested", "paid-tested", "archived"]);
const signalFields = [
  "id",
  "platform",
  "observed_pattern",
  "user_type",
  "pain_signal",
  "input",
  "desired_output",
  "linked_opportunity",
  "confidence",
  "collected_at",
  "privacy_note"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exitCode = 1;
}

function scoreOpportunity(item) {
  const total = scoreFields.reduce((sum, field) => sum + item.scores[field], 0);
  return Math.round((total / (scoreFields.length * 5)) * 100);
}

const categories = readJson(categoriesPath);
const opportunities = readJson(opportunitiesPath);
const signals = readJson(signalsPath);
const categoryIds = new Set(categories.map((category) => category.id));
const ids = new Set();
const opportunityIds = new Set();

if (!Array.isArray(opportunities)) {
  fail("data/opportunities.json must be an array.");
} else {
  for (const item of opportunities) {
    for (const field of requiredFields) {
      if (!(field in item)) {
        fail(`${item.id || "unknown"} is missing required field: ${field}`);
      }
    }

    if (ids.has(item.id)) {
      fail(`Duplicate opportunity id: ${item.id}`);
    }
    ids.add(item.id);
    opportunityIds.add(item.id);

    if (!categoryIds.has(item.category)) {
      fail(`${item.id} uses unknown category: ${item.category}`);
    }

    if (!statuses.has(item.status)) {
      fail(`${item.id} uses unknown status: ${item.status}`);
    }

    for (const field of scoreFields) {
      const value = item.scores[field];
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        fail(`${item.id} score ${field} must be an integer from 1 to 5.`);
      }
    }

    for (const listField of ["signal_sources", "trigger_phrases", "tags"]) {
      if (!Array.isArray(item[listField]) || item[listField].length === 0) {
        fail(`${item.id} field ${listField} must be a non-empty array.`);
      }
    }
  }
}

const signalIds = new Set();
if (!Array.isArray(signals)) {
  fail("data/signals.json must be an array.");
} else {
  for (const signal of signals) {
    for (const field of signalFields) {
      if (!(field in signal)) {
        fail(`${signal.id || "unknown"} is missing required signal field: ${field}`);
      }
    }

    if (signalIds.has(signal.id)) {
      fail(`Duplicate signal id: ${signal.id}`);
    }
    signalIds.add(signal.id);

    if (!opportunityIds.has(signal.linked_opportunity)) {
      fail(`${signal.id} links to unknown opportunity: ${signal.linked_opportunity}`);
    }

    if (!Number.isInteger(signal.confidence) || signal.confidence < 1 || signal.confidence > 5) {
      fail(`${signal.id} confidence must be an integer from 1 to 5.`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

const enriched = opportunities
  .map((item) => ({
    ...item,
    landing_score: scoreOpportunity(item)
  }))
  .sort((a, b) => b.landing_score - a.landing_score);

const sitePayload = [
  `window.RADAR_CATEGORIES = ${JSON.stringify(categories, null, 2)};`,
  `window.OPPORTUNITIES = ${JSON.stringify(enriched, null, 2)};`,
  `window.RADAR_SIGNALS = ${JSON.stringify(signals, null, 2)};`
].join("\n\n");
fs.writeFileSync(siteDataPath, sitePayload);

console.log(`Validated ${opportunities.length} opportunities.`);
console.log(`Validated ${signals.length} signals.`);
console.log(`Generated ${path.relative(root, siteDataPath)}.`);
