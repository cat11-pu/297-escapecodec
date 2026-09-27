// escaperun.js：按处理预算处理并留账
import { escapeText, unescapeText } from "./escapes.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function keyOf(kind, text) {
  return kind + "|" + text;
}

function cloneState(state) {
  const source = state || {};
  return {
    encoded: (source.encoded || []).slice(),
    decoded: (source.decoded || []).slice(),
    ledger: (source.ledger || []).map(function (row) { return row.slice(); }),
    applied: (source.applied || []).slice()
  };
}

function applyEvent(state, kind, text) {
  if (kind === "escape") {
    state.encoded.push(escapeText(text));
  } else {
    state.decoded.push(unescapeText(text));
  }
  state.applied.push(keyOf(kind, text));
}

function checkEvent(event, spec) {
  const code = spec.event_error_code || "E_BAD_EVENT";
  if (!event || (event.kind !== "escape" && event.kind !== "unescape")) {
    throw fail(code, "unknown event kind");
  }
  if (typeof event.text !== "string" || event.text.length === 0) {
    throw fail(code, "event text must be a non-empty string");
  }
}

export function step(spec) {
  const state = cloneState(spec.state);
  const events = spec.events || [];
  let budget = Number.isFinite(spec.budget) ? spec.budget : 0;
  let served = 0;
  let judged = 0;
  for (const event of events) {
    checkEvent(event, spec);
    const key = keyOf(event.kind, event.text);
    const done = state.applied.indexOf(key) !== -1;
    const queued = state.ledger.some(function (row) { return keyOf(row[0], row[1]) === key; });
    if (done || queued) { continue; }
    judged += 1;
    if (budget > 0) {
      budget -= 1;
      applyEvent(state, event.kind, event.text);
      served += 1;
    } else {
      state.ledger.push([event.kind, event.text]);
    }
  }
  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return row.slice(); }),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  while (state.ledger.length > 0) {
    const row = state.ledger.shift();
    applyEvent(state, row[0], row[1]);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
