import assert from "node:assert";
import { escapeText, unescapeText } from "../escapes.js";
import { step, close } from "../escaperun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { encoded: [], decoded: [], ledger: [], applied: [] },
  events: [],
  escape_error_code: "E_BAD_ESCAPE", event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("escapeText returns text", () => {
  assert.strictEqual(typeof escapeText("x"), "string");
});

check("unescapeText returns text", () => {
  assert.strictEqual(typeof unescapeText("x"), "string");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
