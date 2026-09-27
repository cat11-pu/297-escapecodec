// escaperun.js：按处理预算处理并留账，收尾不限预算清账
import { escapeText, unescapeText } from "./escapes.js";

function cloneState(state) {
  const source = state || {};
  return {
    encoded: Array.isArray(source.encoded) ? source.encoded.slice() : [],
    decoded: Array.isArray(source.decoded) ? source.decoded.slice() : [],
    ledger: Array.isArray(source.ledger) ? source.ledger.map(function (row) { return [row[0], row[1]]; }) : [],
    applied: Array.isArray(source.applied) ? source.applied.slice() : []
  };
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function eventKey(kind, text) {
  return kind + "\u0000" + text;
}

function validateEvent(event, spec) {
  const eventCode = spec.event_error_code || "E_BAD_EVENT";
  if (!event || typeof event !== "object"
      || (event.kind !== "escape" && event.kind !== "unescape")
      || typeof event.text !== "string" || event.text.length === 0) {
    fail(eventCode, "illegal event");
  }
}

function applyOne(state, kind, text, spec) {
  if (kind === "escape") {
    state.encoded.push(escapeText(text));
  } else {
    try {
      state.decoded.push(unescapeText(text));
    } catch (error) {
      fail(spec.escape_error_code || (error && error.code) || "E_BAD_ESCAPE", "illegal escape sequence");
    }
  }
  state.applied.push(eventKey(kind, text));
}

export function step(spec) {
  const state = cloneState(spec.state);
  const events = Array.isArray(spec.events) ? spec.events : [];
  const budget = Number.isFinite(spec.budget) ? spec.budget : 0;

  events.forEach(function (event) { validateEvent(event, spec); });

  const judgedBound = state.ledger.length + events.length;
  const queue = state.ledger.map(function (row) { return { kind: row[0], text: row[1] }; });
  state.ledger = [];
  events.forEach(function (event) { queue.push({ kind: event.kind, text: event.text }); });

  let served = 0;
  queue.forEach(function (item) {
    if (state.applied.indexOf(eventKey(item.kind, item.text)) !== -1) {
      return;
    }
    if (served < budget) {
      applyOne(state, item.kind, item.text, spec);
      served += 1;
    } else {
      state.ledger.push([item.kind, item.text]);
    }
  });

  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return [row[0], row[1]]; }),
    judged: served + state.ledger.length,
    judged_bound: judgedBound
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  const pending = state.ledger;
  state.ledger = [];
  let catchup = 0;
  pending.forEach(function (row) {
    applyOne(state, row[0], row[1], spec);
    catchup += 1;
  });
  return { state: state, catchup: catchup };
}
