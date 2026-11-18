/**
 * Preflight: rule-based writing checks that run on the device. These are simple pattern rules
 * (not AI and not plagiarism detection); each result is a suggestion the writer decides on.
 */

export type IssueKind = "grammar" | "punctuation" | "style" | "reference";

export interface Issue {
  id: string;
  kind: IssueKind;
  message: string;
  /** Offsets into the checked text; absent for whole-document notes. */
  start?: number;
  end?: number;
  /** Replacement for text[start..end], when there's a clear fix. */
  fix?: string;
}

export interface PreflightResult {
  issues: Issue[];
  stats: { words: number; sentences: number; avgSentence: number; references: number; citations: number };
}

export const KIND_LABEL: Record<IssueKind, string> = {
  grammar: "Grammar",
  punctuation: "Punctuation",
  style: "Style",
  reference: "References",
};

interface Rule {
  kind: IssueKind;
  re: RegExp;
  message: (m: RegExpExecArray) => string;
  fix?: (m: RegExpExecArray) => string;
  /** Skip a match (e.g. abbreviations). */
  skip?: (m: RegExpExecArray, text: string) => boolean;
}

const ABBREV = /\b(e\.g|i\.e|etc|et al|vs|cf|Dr|Mr|Mrs|Ms|Prof|St|No|Fig|pp|vol|ed|eds|approx)\.$/i;

const CONFUSIONS: [RegExp, string, string][] = [
  [/\b(could|should|would|must|might) of\b/gi, "$1 have", "Use “have” after could/should/would."],
  [/\balot\b/gi, "a lot", "“A lot” is two words."],
  [/\birregardless\b/gi, "regardless", "Use “regardless”."],
  [/\bit's own\b/gi, "its own", "Possessive “its” has no apostrophe."],
  [/\btheir (is|are|was|were)\b/gi, "there $1", "Did you mean “there”?"],
  [/\byour (welcome|right|wrong)\b/gi, "you're $1", "Did you mean “you're”?"],
  [/\bless (people|students|participants|studies|items|words)\b/gi, "fewer $1", "Use “fewer” with countable nouns."],
  [/\bcomprised of\b/gi, "composed of", "“Comprise” takes no “of”: use “composed of” or “comprises”."],
  [/\bin regards to\b/gi, "with regard to", "Use “with regard to” or “regarding”."],
  [/\bthe reason is because\b/gi, "the reason is that", "Use “the reason is that”."],
  [/\bdata is\b/g, "data are", "In academic writing “data” is usually plural."],
];

const RULES: Rule[] = [
  {
    kind: "grammar",
    re: /\b(\w+)(\s+)\1\b/gi,
    message: (m) => `Repeated word “${m[1]}”.`,
    fix: (m) => m[1],
    // "had had" and "that that" can be correct; numbers repeat in data.
    skip: (m) => /^(had|that|\d+)$/i.test(m[1]),
  },
  {
    kind: "grammar",
    re: /(?<![\w'’-])i(?![\w.'’-])/g,
    message: () => "The pronoun “I” is always capitalised.",
    fix: () => "I",
  },
  {
    kind: "grammar",
    re: /([.!?])(\s+)([a-z])/g,
    message: () => "Sentences start with a capital letter.",
    fix: (m) => m[1] + m[2] + m[3].toUpperCase(),
    skip: (m, text) => m[1] === "." && ABBREV.test(text.slice(Math.max(0, m.index - 8), m.index + 1)),
  },
  { kind: "punctuation", re: /[^\S\n]{2,}/g, message: () => "Extra spaces.", fix: () => " " },
  {
    kind: "punctuation",
    re: /[^\S\n]+([,.;:!?)])/g,
    message: (m) => `No space before “${m[1]}”.`,
    fix: (m) => m[1],
    skip: (m, text) => m[1] === "." && /\.\.\./.test(text.slice(m.index, m.index + m[0].length + 2)),
  },
  {
    kind: "punctuation",
    re: /([,;:])(?=[A-Za-z])/g,
    message: (m) => `Add a space after “${m[1]}”.`,
    fix: (m) => m[1] + " ",
    skip: (m, text) => m[1] === ":" && /https?$/i.test(text.slice(Math.max(0, m.index - 5), m.index)),
  },
  {
    kind: "punctuation",
    re: /([a-z]{2,})\.([A-Z][a-z]+)/g,
    message: () => "Add a space after the full stop.",
    fix: (m) => `${m[1]}. ${m[2]}`,
    skip: (m, text) => /\S*\.(com|org|net|edu|gov|uk|io)\b/i.test(text.slice(m.index, m.index + m[0].length + 4)) || /https?:\/\/\S*$/.test(text.slice(Math.max(0, m.index - 60), m.index)),
  },
  {
    kind: "punctuation",
    re: /([a-z)\]][.!?])([a-z]+)\b/g,
    message: () => "Start the new sentence with a space and a capital letter.",
    fix: (m) => `${m[1]} ${m[2][0].toUpperCase()}${m[2].slice(1)}`,
    // Skip e.g./i.e., file names, URLs and domains.
    skip: (m, text) =>
      /^(e|g|i|com|org|net|edu|gov|uk|io|html|pdf|docx?|txt|js|ts|png|jpg)$/.test(m[2]) ||
      /\b[a-z]\.$/i.test(text.slice(Math.max(0, m.index - 1), m.index + 2)) ||
      /(https?:\/\/|www\.)\S*$/.test(text.slice(Math.max(0, m.index - 80), m.index + 1)),
  },
  { kind: "punctuation", re: /([,;:])\1+|(?<!\.)\.\.(?!\.)/g, message: () => "Repeated punctuation.", fix: (m) => (m[1] ?? ".") },
  { kind: "punctuation", re: /!{2,}|\?{2,}/g, message: () => "Avoid repeated ! or ? in academic writing.", fix: (m) => m[0][0] },
  {
    kind: "style",
    re: /\b(am|is|are|was|were|be|been|being)\s+(\w+ed|written|done|made|given|taken|shown|seen|known|found|held)\b(\s+by\b)?/gi,
    message: () => "Possible passive voice. Consider whether an active sentence is clearer.",
    skip: (m) => /^(interested|based|mixed|concerned|used|supposed|needed|tired|related|limited|required|located|involved|married|excited|qualified|advanced|detailed|experienced|varied|united|naked|wicked)$/i.test(m[2]),
  },
  {
    kind: "style",
    re: /\b(very|really|basically|actually|totally|literally|quite|just)\s+/gi,
    message: (m) => `“${m[1]}” is often unnecessary in academic writing.`,
  },
  {
    kind: "style",
    re: /\b(can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|shouldn't|couldn't|wouldn't|it's|that's|there's|they're|we're|I'm|you're|haven't|hasn't)\b/g,
    message: (m) => `Contraction “${m[1]}”: formal writing usually spells this out.`,
    fix: (m) => expandContraction(m[1]),
  },
];

function expandContraction(c: string): string {
  const map: Record<string, string> = {
    "can't": "cannot", "won't": "will not", "it's": "it is", "that's": "that is", "there's": "there is",
    "they're": "they are", "we're": "we are", "I'm": "I am", "you're": "you are",
  };
  const k = c.toLowerCase();
  const out = map[c] ?? map[k] ?? (k.endsWith("n't") ? c.slice(0, -3) + " not" : c);
  return c[0] === c[0].toUpperCase() && c[0] !== "I" ? out[0].toUpperCase() + out.slice(1) : out;
}

let seq = 0;
const nid = () => "i" + (++seq).toString(36);

function runRules(text: string, issues: Issue[]) {
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text))) {
      if (m[0].length === 0) {
        rule.re.lastIndex++;
        continue;
      }
      if (rule.skip?.(m, text)) continue;
      issues.push({ id: nid(), kind: rule.kind, message: rule.message(m), start: m.index, end: m.index + m[0].length, fix: rule.fix?.(m) });
    }
  }
  for (const [re, fix, message] of CONFUSIONS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const replaced = m[0].replace(new RegExp(re.source, re.flags.replace("g", "")), fix);
      const cased = m[0][0] === m[0][0].toUpperCase() ? replaced[0].toUpperCase() + replaced.slice(1) : replaced;
      issues.push({ id: nid(), kind: "grammar", message, start: m.index, end: m.index + m[0].length, fix: cased });
    }
  }
}

/** Long sentences and unbalanced brackets/quotes, sentence by sentence. */
function runStructure(text: string, issues: Issue[]) {
  const sentRe = /[^.!?\n]+(?:[.!?]+|\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = sentRe.exec(text))) {
    const s = m[0];
    const words = s.trim().split(/\s+/).filter(Boolean).length;
    if (words > 40) {
      issues.push({ id: nid(), kind: "style", message: `Long sentence (${words} words). Consider splitting it.`, start: m.index, end: m.index + s.trimEnd().length });
    }
  }
  // Brackets and quotes per paragraph.
  let offset = 0;
  for (const para of text.split("\n")) {
    const pairs: [string, string, string][] = [["(", ")", "parenthesis"], ["[", "]", "square bracket"], ["“", "”", "quotation mark"]];
    for (const [o, c, name] of pairs) {
      const open = para.split(o).length - 1;
      const close = para.split(c).length - 1;
      if (open !== close) {
        const at = para.lastIndexOf(open > close ? o : c);
        issues.push({ id: nid(), kind: "punctuation", message: `Unmatched ${name} in this paragraph.`, start: offset + at, end: offset + at + 1 });
      }
    }
    const straight = (para.match(/(?<![A-Za-z])"|"(?![A-Za-z])/g) ?? []).length;
    if (straight % 2 === 1) {
      const at = para.lastIndexOf('"');
      issues.push({ id: nid(), kind: "punctuation", message: "Unmatched quotation mark in this paragraph.", start: offset + at, end: offset + at + 1 });
    }
    offset += para.length + 1;
  }
}

// ---------------------------------------------------------------- reference checks

interface Ref {
  text: string;
  start: number;
  key: string; // lower-case first surname
  year: string; // "" when missing
  yearStyle: "paren" | "plain" | "none";
}

const REF_HEADING = /^[ \t]*(references|reference list|bibliography|works cited|sources)[ \t]*:?[ \t]*$/im;
const SURNAME = "[A-Z][A-Za-z'’-]+(?:\\s(?:van|von|de|der|da|di|le|la)\\s[A-Z][A-Za-z'’-]+)?";

function parseRefs(section: string, base: number): Ref[] {
  const refs: Ref[] = [];
  let pos = 0;
  for (const line of section.split("\n")) {
    const t = line.trim();
    if (t) {
      const body = t.replace(/^(\[\d+\]|\d+\.)\s*/, "");
      const key = (body.match(/^[^,.(]+/)?.[0] ?? "").trim().split(/\s+/).pop()?.toLowerCase() ?? "";
      const paren = body.match(/\((\d{4}[a-z]?|n\.d\.)[^)]*\)/);
      const plain = body.match(/\b(1[89]\d{2}|20\d{2})[a-z]?\b/);
      refs.push({
        text: t,
        start: base + pos + line.indexOf(t),
        key,
        year: paren?.[1] ?? plain?.[0] ?? "",
        yearStyle: paren ? "paren" : plain ? "plain" : "none",
      });
    }
    pos += line.length + 1;
  }
  return refs;
}

interface Cite {
  key: string;
  year: string;
  start: number;
  end: number;
  label: string;
}

function parseCitations(body: string): { cites: Cite[]; numeric: number[] } {
  const cites: Cite[] = [];
  const author = new RegExp(`(${SURNAME})(?:\\s+(?:et al\\.?|(?:&|and)\\s+${SURNAME}))?,?\\s+(\\d{4}[a-z]?|n\\.d\\.)`, "g");
  // Parenthetical: (Smith, 2020; Lee & Park, 2019)
  const paren = /\(([^()]*?(?:\d{4}[a-z]?|n\.d\.)[^()]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = paren.exec(body))) {
    author.lastIndex = 0;
    let a: RegExpExecArray | null;
    while ((a = author.exec(m[1]))) {
      const s = m.index + 1 + a.index;
      cites.push({ key: a[1].split(/\s+/).pop()!.toLowerCase(), year: a[2], start: s, end: s + a[0].length, label: a[0] });
    }
  }
  // Narrative: Smith (2020), Smith and Lee (2019), Smith et al. (2018)
  const narr = new RegExp(`(${SURNAME})(?:\\s+(?:et al\\.?|(?:&|and)\\s+${SURNAME}))?\\s+\\((\\d{4}[a-z]?|n\\.d\\.)\\)`, "g");
  while ((m = narr.exec(body))) {
    cites.push({ key: m[1].split(/\s+/).pop()!.toLowerCase(), year: m[2], start: m.index, end: m.index + m[0].length, label: m[0] });
  }
  // Numeric: [1], [2, 5], [3–6]
  const numeric: number[] = [];
  const num = /\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g;
  while ((m = num.exec(body))) {
    for (const part of m[1].split(",")) {
      const [a, b] = part.split(/[–-]/).map((x) => parseInt(x, 10));
      if (b && b >= a && b - a < 100) for (let i = a; i <= b; i++) numeric.push(i);
      else numeric.push(a);
    }
  }
  return { cites, numeric };
}

function runReferences(text: string, issues: Issue[]) {
  const h = REF_HEADING.exec(text);
  const body = h ? text.slice(0, h.index) : text;
  const refs = h ? parseRefs(text.slice(h.index + h[0].length), h.index + h[0].length) : [];
  const { cites, numeric } = parseCitations(body);

  if (!h) {
    if (cites.length || numeric.length) {
      issues.push({ id: nid(), kind: "reference", message: "Citations found but no reference list. Add a heading such as “References” followed by one entry per line." });
    }
    return { refs: 0, cites: cites.length + numeric.length };
  }
  if (refs.length === 0) {
    issues.push({ id: nid(), kind: "reference", message: "The reference list is empty.", start: h.index, end: h.index + h[0].length });
    return { refs: 0, cites: cites.length + numeric.length };
  }

  const at = (r: Ref) => ({ start: r.start, end: r.start + r.text.length });
  const isNumeric = numeric.length > 0 && cites.length === 0;

  if (isNumeric) {
    const max = Math.max(...numeric);
    if (max > refs.length) issues.push({ id: nid(), kind: "reference", message: `Citation [${max}] is cited, but the list has only ${refs.length} entries.` });
    const used = new Set(numeric);
    refs.forEach((r, i) => {
      if (!used.has(i + 1)) issues.push({ id: nid(), kind: "reference", message: `Reference ${i + 1} is never cited in the text.`, ...at(r) });
    });
  } else {
    for (const c of cites) {
      const hit = refs.some((r) => r.key === c.key && (r.year === c.year || r.year.startsWith(c.year)));
      if (!hit) {
        const sameAuthor = refs.find((r) => r.key === c.key);
        issues.push({
          id: nid(),
          kind: "reference",
          message: sameAuthor ? `“${c.label}” — the reference list has ${capital(c.key)} with year ${sameAuthor.year || "missing"}.` : `“${c.label}” has no matching entry in the reference list.`,
          start: c.start,
          end: c.end,
        });
      }
    }
    for (const r of refs) {
      if (!cites.some((c) => c.key === r.key)) {
        issues.push({ id: nid(), kind: "reference", message: "This reference is never cited in the text.", ...at(r) });
      }
    }
    // Alphabetical order (APA, MLA, Harvard and Chicago author-date all sort by surname).
    for (let i = 1; i < refs.length; i++) {
      if (refs[i].key && refs[i - 1].key && refs[i].key.localeCompare(refs[i - 1].key) < 0) {
        issues.push({ id: nid(), kind: "reference", message: "Reference list is not in alphabetical order by author.", ...at(refs[i]) });
        break;
      }
    }
  }

  // Per-entry checks.
  const styles = refs.map((r) => r.yearStyle).filter((s) => s !== "none");
  const common = styles.filter((s) => s === "paren").length >= styles.length / 2 ? "paren" : "plain";
  for (const r of refs) {
    if (!r.year) issues.push({ id: nid(), kind: "reference", message: "No year found in this reference.", ...at(r) });
    else if (styles.length >= 3 && r.yearStyle !== common) {
      issues.push({ id: nid(), kind: "reference", message: "Year format differs from most entries — check the list uses one citation style.", ...at(r) });
    }
    const doi = r.text.match(/(?:doi\.org\/|doi:\s*)(\S+)/i);
    if (doi && !/^10\.\d{4,9}\/\S+/.test(doi[1])) issues.push({ id: nid(), kind: "reference", message: "This DOI looks malformed (DOIs start with “10.”).", ...at(r) });
    const url = r.text.match(/\b(?:https?:\/\/|www\.)\S*/i);
    if (url && /\s|[<>"]/.test(url[0])) issues.push({ id: nid(), kind: "reference", message: "This URL looks broken.", ...at(r) });
    if (/^https?:\/\//i.test(r.text)) issues.push({ id: nid(), kind: "reference", message: "This entry is only a link. Add the author, year and title.", ...at(r) });
  }
  const seen = new Map<string, Ref>();
  for (const r of refs) {
    const k = r.text.toLowerCase().replace(/\W+/g, "");
    if (seen.has(k)) issues.push({ id: nid(), kind: "reference", message: "Duplicate reference.", ...at(r) });
    else seen.set(k, r);
  }
  return { refs: refs.length, cites: cites.length + numeric.length };
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function runPreflight(text: string): PreflightResult {
  seq = 0;
  const issues: Issue[] = [];
  const h = REF_HEADING.exec(text);
  // Writing rules only apply to the body; reference entries have their own punctuation.
  const body = h ? text.slice(0, h.index) : text;
  runRules(body, issues);
  runStructure(body, issues);
  const r = runReferences(text, issues);

  // Drop overlapping duplicates (keep the first, which is the more specific rule order).
  issues.sort((a, b) => (a.start ?? -1) - (b.start ?? -1));
  const out: Issue[] = [];
  for (const i of issues) {
    const clash = i.start != null && out.some((o) => o.start === i.start && o.end === i.end && o.kind === i.kind);
    if (!clash) out.push(i);
  }

  const words = body.split(/\s+/).filter((w) => /\w/.test(w)).length;
  const sentences = (body.match(/[^.!?\n]+[.!?]+/g) ?? []).length || (words ? 1 : 0);
  return {
    issues: out,
    stats: { words, sentences, avgSentence: sentences ? Math.round(words / sentences) : 0, references: r.refs, citations: r.cites },
  };
}

/** Applies a fix and returns the new text. */
export function applyFix(text: string, issue: Issue): string {
  if (issue.start == null || issue.end == null || issue.fix == null) return text;
  return text.slice(0, issue.start) + issue.fix + text.slice(issue.end);
}
