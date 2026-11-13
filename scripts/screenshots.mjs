#!/usr/bin/env node
// Screenshots every UI state at desktop (1280px) and phone (375px) width.
//
//   pnpm dev            # in another terminal (don't run `pnpm build` at the same time)
//   pnpm screenshots    # → screenshots/<page>/<state>-<width>.png
//
// Drives headless Chrome over the DevTools protocol (no extra dependencies, Node 22+).
// Server responses are stubbed inside the page, so nothing is written to the database;
// dashboard and "My villages" states come from the dev-only fixture pages under /dev.
// Exits non-zero if any page scrolls sideways or throws.
//
// Options: --base <url> (default http://localhost:3000), --only <substring>.
// Chrome: set CHROME_PATH if it isn't found automatically.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3000").replace(/\/+$/, "");
const ONLY = arg("only", "");
const OUT = join(process.cwd(), "screenshots");
const WIDTHS = [1280, 375];

// ── States ────────────────────────────────────────────────────────────────

/** Page script that answers matching fetches with canned JSON ("hang" never resolves). */
const stub = (routes) => `
  const routes = ${JSON.stringify(routes)};
  const real = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    const hit = routes.find(([p]) => url.includes(p));
    if (!hit) return real(input, init);
    if (hit[2] === "hang") return new Promise(() => {});
    return Promise.resolve(new Response(JSON.stringify(hit[2]), { status: hit[1], headers: { "Content-Type": "application/json" } }));
  };`;

const helpers = `
  const btn = (t) => {
    const b = [...document.querySelectorAll("button")].find((b) => b.textContent.trim().includes(t));
    if (!b) throw new Error("no button: " + t);
    return b;
  };
  const setVal = (el, v) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));`;
const step = (js) => helpers + js;

// The sample export with its tag swapped, so it's treated as a real (savable) village
const ownExport = step(`btn("Load Sample").click(); await pause(300);
  const ta = document.querySelector("textarea");
  setVal(ta, ta.value.replace(/"tag"\\s*:\\s*"#[^"]+"/, '"tag": "#2PP0JQ9V"'));`);
const lookup = (tag) => [
  step(`btn("Player Tag").click();`),
  step(`setVal(document.querySelector("input[type=text]"), ${JSON.stringify(tag)});`),
  step(`btn("Lookup Tag").click();`),
];

const exportedAt = Math.floor(Date.now() / 1000) - 3 * 3600;
const upgrades = [
  { id: "a", name: "Archer Tower", category: "BUILDER", currentLevel: 20, targetLevel: 21, formattedRemaining: "1h 12m", formattedFinishTime: "Today 3:40 PM", isGoblinOrHelper: false },
  { id: "b", name: "Electro Dragon", category: "LABORATORY", currentLevel: 5, targetLevel: 6, formattedRemaining: "1d 4h 18m", formattedFinishTime: "Sat 9:12 AM", isGoblinOrHelper: false },
  { id: "c", name: "Unicorn", category: "PET_HOUSE", currentLevel: 7, targetLevel: 8, formattedRemaining: "2d 11h", formattedFinishTime: "Sun 1:05 PM", isGoblinOrHelper: false },
  { id: "d", name: "Cannon", category: "BUILDER", currentLevel: 19, targetLevel: 20, formattedRemaining: "6h 01m", formattedFinishTime: "Today 8:29 PM", isGoblinOrHelper: true },
  { id: "e", name: "Mega Tesla", category: "BUILDER_BASE", currentLevel: 8, targetLevel: 9, formattedRemaining: "3h 07m", formattedFinishTime: "Today 5:35 PM", isGoblinOrHelper: false },
];
const profile = { name: "Chief Ada", tag: "#2PP0JQ9V", townHallLevel: 15, trophies: 4821, clan: { name: "Night Owls", badgeUrls: {} } };

const STATES = [
  // Home
  { page: "home", name: "empty", path: "/" },
  { page: "home", name: "clipboard-denied", path: "/", steps: [step(`btn("Paste").click();`)] },
  { page: "home", name: "sample-preview", path: "/", steps: [step(`btn("Load Sample").click();`), step(`btn("Sync Village").click();`)] },
  { page: "home", name: "syncing", path: "/", init: stub([["/api/village/sync", 0, "hang"]]), steps: [ownExport, step(`btn("Sync Village").click();`)] },
  {
    page: "home", name: "synced", path: "/",
    init: stub([["/api/village/sync", 200, { success: true, totalActiveUpgrades: 9, playerTag: "#2PP0JQ9V", claimed: true, dashboardPath: "/v/2PP0JQ9V" }]]),
    steps: [ownExport, step(`btn("Sync Village").click();`)],
  },
  {
    page: "home", name: "sync-error", path: "/",
    init: stub([["/api/village/sync", 403, { success: false, error: "This village is linked to another account. Log in as its owner to sync it." }]]),
    steps: [ownExport, step(`btn("Sync Village").click();`)],
  },
  {
    page: "home", name: "tag-found", path: "/",
    init: stub([
      ["/api/player/", 200, { success: true, player: profile }],
      ["/api/village/upgrades", 200, { success: true, playerTag: "#2PP0JQ9V", lastExportTimestamp: exportedAt, totalActiveUpgrades: upgrades.length, upgrades }],
    ]),
    steps: lookup("2PP0JQ9V"),
  },
  {
    page: "home", name: "tag-not-tracked", path: "/",
    init: stub([
      ["/api/player/", 404, { success: false, error: "We couldn't find a player with that tag. Check it and try again." }],
      ["/api/village/upgrades", 404, { success: false, error: "Not found" }],
    ]),
    steps: lookup("9QQ2LL8Y"),
  },
  { page: "home", name: "tag-searching", path: "/", init: stub([["/api/player/", 0, "hang"]]), steps: lookup("2PP0JQ9V") },

  // Dashboard (fixtures) + interactions on the owner section
  { page: "dashboard", name: "states", path: "/dev/dashboard" },
  {
    page: "dashboard", name: "owner-interactions", path: "/dev/dashboard",
    init: stub([
      ["/api/village/notifications", 200, { success: true }],
      ["/api/village/boosts", 409, { success: false, error: "Those timers changed since the potion was logged, so it can't be undone." }],
    ]),
    steps: [step(`btn("Send test").click();`), step(`btn("Change webhook").click();`), step(`btn("I used a Builder Potion").click();`)],
  },

  // My villages (fixtures) + the real logged-out page
  { page: "villages", name: "states", path: "/dev/villages" },
  { page: "villages", name: "logged-out", path: "/villages" },

  // Design system
  { page: "styleguide", name: "components", path: "/dev/styleguide" },
];

// ── Chrome / DevTools protocol ────────────────────────────────────────────

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH to your Chrome/Chromium/Edge executable.");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const profileDir = mkdtempSync(join(tmpdir(), "clashsync-shots-"));
  const chrome = spawn(findChrome(), [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`, "about:blank",
  ], { stdio: "ignore" });

  let wsUrl;
  for (let i = 0; i < 75 && !wsUrl; i++) {
    await sleep(200);
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    } catch {}
  }
  if (!wsUrl) throw new Error("Chrome didn't start");

  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) listeners.forEach((l) => l(msg));
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const close = () => {
    ws.close();
    chrome.kill();
    setTimeout(() => rmSync(profileDir, { recursive: true, force: true }), 500);
  };
  return { send, listeners, close };
}

// ── Run ───────────────────────────────────────────────────────────────────

const res = await fetch(BASE).catch(() => null);
if (!res) {
  console.error(`Can't reach ${BASE}. Start the app with \`pnpm dev\` first.`);
  process.exit(1);
}

const { send, listeners, close } = await connect();
await send("Page.enable");
await send("Runtime.enable");
let pageErrors = [];
listeners.add((m) => {
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    pageErrors.push(d.exception?.description?.split("\n")[0] ?? d.text);
  }
});

const problems = [];
let initId = null;
const states = STATES.filter((s) => `${s.page}/${s.name}`.includes(ONLY));

for (const state of states) {
  for (const width of WIDTHS) {
    const label = `${state.page}/${state.name}-${width}`;
    pageErrors = [];
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    if (initId) await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: initId });
    initId = state.init ? (await send("Page.addScriptToEvaluateOnNewDocument", { source: state.init })).identifier : null;

    const loaded = new Promise((r) => {
      const l = (m) => { if (m.method === "Page.loadEventFired") { listeners.delete(l); r(); } };
      listeners.add(l);
    });
    await send("Page.navigate", { url: BASE + state.path });
    await loaded;
    await sleep(2500); // hydration + first client tick

    for (const js of state.steps ?? []) {
      const r = await send("Runtime.evaluate", { expression: `(async () => { ${js} })()`, awaitPromise: true });
      if (r.exceptionDetails) problems.push(`${label}: step failed: ${r.exceptionDetails.exception?.description?.split("\n")[0]}`);
      await sleep(700);
    }

    const overflow = (await send("Runtime.evaluate", {
      expression: "document.documentElement.scrollWidth - window.innerWidth", returnByValue: true,
    })).result.value;
    const { cssContentSize } = await send("Page.getLayoutMetrics");
    await send("Emulation.setDeviceMetricsOverride", {
      width, height: Math.ceil(cssContentSize.height), deviceScaleFactor: 1, mobile: width < 600,
    });
    await sleep(250);
    const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });

    const file = join(OUT, state.page, `${state.name}-${width}.png`);
    mkdirSync(join(OUT, state.page), { recursive: true });
    writeFileSync(file, Buffer.from(data, "base64"));

    if (overflow > 0) problems.push(`${label}: scrolls sideways by ${overflow}px`);
    for (const e of pageErrors) problems.push(`${label}: page error: ${e}`);
    console.log(`${overflow > 0 || pageErrors.length ? "✗" : "✓"} ${label}`);
  }
}
close();

console.log(`\n${states.length * WIDTHS.length} screenshots in ${OUT}`);
if (problems.length) {
  console.error("\nProblems:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
