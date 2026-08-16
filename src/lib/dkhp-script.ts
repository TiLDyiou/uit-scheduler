import { Section } from "@/types/scheduler";

/**
 * Extracts a deduplicated list of section codes from a list of sections.
 */
export function extractListMaLop(
  sections: Array<{ section_code?: string } | Section>
): string[] {
  if (!sections || !Array.isArray(sections)) return [];
  const list: string[] = [];
  sections.forEach((s) => {
    if (s && s.section_code && !list.includes(s.section_code)) {
      list.push(s.section_code);
    }
  });
  return list;
}

/**
 * Generates the JavaScript registration script for dkhp.uit.edu.vn without comments or icons.
 */
export function getScriptDkhp(listMaLop: string[]): string {
  if (!listMaLop || listMaLop.length === 0) {
    return "";
  }

  const jsonList = JSON.stringify(listMaLop, null, 2);

  return `(() => {
  const listMaLop = ${jsonList};
  const selected = new Set();
  const allRows = Array.from(document.querySelectorAll("form table tr, table tr"));

  listMaLop.forEach((maLop) => {
    const targetRow = allRows.find((row) => {
      const cellText = row.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
      if (cellText === maLop) return true;
      return Array.from(row.querySelectorAll("td")).some(
        (td) => td.textContent?.trim() === maLop
      );
    });

    if (targetRow) {
      const checkbox = targetRow.querySelector('td:first-child input[type="checkbox"], input[type="checkbox"]');
      if (checkbox) {
        if (!checkbox.checked) {
          checkbox.click();
        }
        selected.add(maLop);
        console.log(\`%cĐã chọn: \${maLop}\`, "color: #10b981; font-weight: bold;");
      }
    }
  });

  const notFound = listMaLop.filter((m) => !selected.has(m));
  if (selected.size > 0) {
    console.log(\`%cĐã chọn: \${selected.size}/\${listMaLop.length} môn\`, "color: #10b981; font-weight: bold;");
  }
  if (notFound.length > 0) {
    console.warn("Chưa chọn được: " + notFound.join(", "));
  } else if (selected.size === 0) {
    console.warn("Chưa chọn được môn nào!");
  }
})();`;
}

export interface CodeToken {
  type:
    | "comment"
    | "string"
    | "keyword"
    | "builtin"
    | "boolean-number"
    | "function"
    | "punctuation"
    | "operator"
    | "text";
  text: string;
}

/**
 * Tokenizes a line of JavaScript code for syntax highlighting.
 */
export function tokenizeJsLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let remaining = line;

  const patterns: { type: CodeToken["type"]; regex: RegExp }[] = [
    { type: "comment", regex: /^(\/\/.*)$/ },
    { type: "string", regex: /^(`(?:\\`|[^`])*`|"(?:\\"|[^"])*"|'(?:\\'|[^'])*')/ },
    {
      type: "keyword",
      regex: /^(const|let|var|function|return|if|else|new|for|while|do|switch|case|break|continue|try|catch|finally|throw|typeof|instanceof|void|delete|in|of|class|extends|import|export|default|async|await|yield)\b/,
    },
    {
      type: "builtin",
      regex: /^(console|document|window|Array|Object|String|Number|Boolean|Event|CustomEvent|Math|JSON|Promise|Set|Map|alert)\b/,
    },
    {
      type: "boolean-number",
      regex: /^(true|false|null|undefined|NaN|Infinity|\d+(?:\.\d+)?)\b/,
    },
    {
      type: "function",
      regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/,
    },
    {
      type: "operator",
      regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%&|^~!=<>?:]+)/,
    },
    {
      type: "punctuation",
      regex: /^([{}()[\].,;])/,
    },
    {
      type: "text",
      regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*|\s+|[^\s\w`"'{}()[\].,;=><!+\-*/%&|^~?:]+)/,
    },
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const { type, regex } of patterns) {
      const match = remaining.match(regex);
      if (match && match[0].length > 0) {
        tokens.push({ type, text: match[0] });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push({ type: "text", text: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}
