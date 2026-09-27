// escapes.js：转义与还原（只认反斜杠、换行、制表、回车四种记法）
const ESCAPE_TABLE = {
  "\\": "\\\\",
  "\n": "\\n",
  "\t": "\\t",
  "\r": "\\r"
};

export function escapeText(text) {
  return text.replace(/[\\\n\t\r]/g, function (ch) {
    return ESCAPE_TABLE[ch];
  });
}

export function unescapeText(text) {
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = text[i + 1];
    if (next === "\\") { out += "\\"; i += 1; }
    else if (next === "n") { out += "\n"; i += 1; }
    else if (next === "t") { out += "\t"; i += 1; }
    else if (next === "r") { out += "\r"; i += 1; }
    else {
      const error = new Error("illegal escape sequence");
      error.code = "E_BAD_ESCAPE";
      throw error;
    }
  }
  return out;
}
