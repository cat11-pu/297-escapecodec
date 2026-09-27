// escapes.js：转义与还原
const ESCAPE_MAP = { "\\": "\\\\", "\n": "\\n", "\t": "\\t", "\r": "\\r" };
const UNESCAPE_MAP = { "\\": "\\", "n": "\n", "t": "\t", "r": "\r" };

function badEscape(message) {
  const error = new Error(message);
  error.code = "E_BAD_ESCAPE";
  return error;
}

export function escapeText(text) {
  return String(text).replace(/[\\\n\t\r]/g, function (ch) { return ESCAPE_MAP[ch]; });
}

export function unescapeText(text) {
  const source = String(text);
  let out = "";
  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index];
    if (ch !== "\\") { out += ch; continue; }
    const next = source[index + 1];
    if (next === undefined || !Object.prototype.hasOwnProperty.call(UNESCAPE_MAP, next)) {
      throw badEscape(next === undefined ? "lone trailing backslash" : "bad escape sequence");
    }
    out += UNESCAPE_MAP[next];
    index += 1;
  }
  return out;
}
