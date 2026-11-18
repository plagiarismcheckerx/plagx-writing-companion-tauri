/** Citation formatting for APA 7, MLA 9, Chicago (author-date) and Harvard. Runs fully offline. */

export type SourceType = "journal" | "book" | "website";
export type CiteStyle = "apa" | "mla" | "chicago" | "harvard";

export const STYLES: { id: CiteStyle; label: string }[] = [
  { id: "apa", label: "APA" },
  { id: "mla", label: "MLA" },
  { id: "chicago", label: "Chicago" },
  { id: "harvard", label: "Harvard" },
];

export interface Source {
  type: SourceType;
  /** One per line, "Last, First Middle" (or an organisation name). */
  authors: string;
  year: string;
  title: string;
  /** Journal name, website name, or book publisher. */
  container: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  accessed: string;
}

export const emptySource = (type: SourceType = "journal"): Source => ({
  type,
  authors: "",
  year: "",
  title: "",
  container: "",
  volume: "",
  issue: "",
  pages: "",
  doi: "",
  url: "",
  accessed: "",
});

interface Name {
  last: string;
  first: string; // may be empty for organisations
}

function parseAuthors(raw: string): Name[] {
  return raw
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s.includes(",")) {
        const [last, ...rest] = s.split(",");
        return { last: last.trim(), first: rest.join(",").trim() };
      }
      const parts = s.split(/\s+/);
      if (parts.length === 1) return { last: s, first: "" };
      return { last: parts[parts.length - 1], first: parts.slice(0, -1).join(" ") };
    });
}

const initials = (first: string) =>
  first
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + ".")
    .join(" ");

const full = (n: Name) => (n.first ? `${n.first} ${n.last}` : n.last);
const inverted = (n: Name) => (n.first ? `${n.last}, ${n.first}` : n.last);
const apaName = (n: Name) => (n.first ? `${n.last}, ${initials(n.first)}` : n.last);
const harvardName = (n: Name) => (n.first ? `${n.last}, ${initials(n.first).replace(/ /g, "")}` : n.last);

/** Joins names as "A, B, & C" style lists. */
function joinList(names: string[], amp: string, serial = true) {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]}${serial && amp === "&" ? "," : ""} ${amp} ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, ${amp} ${names[names.length - 1]}`;
}

const end = (s: string) => (/[.?!]$/.test(s) ? s : s + ".");
const doiLink = (doi: string) => {
  const d = cleanDoi(doi);
  return d ? `https://doi.org/${d}` : "";
};

export function cleanDoi(doi: string) {
  return doi.trim().replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:\s*)/i, "");
}

/** Returns the reference with *asterisks* around italic parts. */
export function formatReference(src: Source, style: CiteStyle): string {
  const names = parseAuthors(src.authors);
  const year = src.year.trim() || "n.d.";
  const title = src.title.trim();
  const cont = src.container.trim();
  const link = doiLink(src.doi) || src.url.trim();
  const vol = src.volume.trim();
  const iss = src.issue.trim();
  const pages = src.pages.trim().replace(/\s*-\s*/, "–");
  const out: string[] = [];

  if (style === "apa") {
    const shown = names.length > 20 ? [...names.slice(0, 19), names[names.length - 1]] : names;
    const who = shown.length ? joinList(shown.map(apaName), "&") : "";
    const t = src.type === "journal" ? end(title) : `*${end(title)}*`;
    // With no author, APA moves the title into the author position.
    if (who) out.push(`${end(who)} (${year}).`, t);
    else out.push(t, `(${year}).`);
    if (src.type === "journal") {
      let j = cont ? `*${cont}*` : "";
      if (vol) j += `, *${vol}*`;
      if (iss) j += `(${iss})`;
      if (pages) j += `, ${pages}`;
      if (j) out.push(j + ".");
    } else if (cont) out.push(end(cont));
    if (link) out.push(link);
  }

  if (style === "mla") {
    let who = "";
    if (names.length === 1) who = inverted(names[0]);
    else if (names.length === 2) who = `${inverted(names[0])}, and ${full(names[1])}`;
    else if (names.length > 2) who = `${inverted(names[0])}, et al`;
    if (who) out.push(end(who));
    if (src.type === "book") {
      out.push(`*${end(title)}*`);
      out.push([cont, year !== "n.d." ? year : ""].filter(Boolean).join(", ") + ".");
    } else {
      out.push(`“${end(title)}”`);
      const parts = [cont ? `*${cont}*` : "", vol ? `vol. ${vol}` : "", iss ? `no. ${iss}` : "", year !== "n.d." ? year : "", pages ? `pp. ${pages}` : ""].filter(Boolean);
      if (parts.length) out.push(parts.join(", ") + ".");
    }
    if (link) out.push(end(link.replace(/^https?:\/\//, "")));
    if (src.type === "website" && src.accessed) out.push(`Accessed ${end(src.accessed)}`);
  }

  if (style === "chicago") {
    let who = "";
    if (names.length === 1) who = inverted(names[0]);
    else if (names.length === 2) who = `${inverted(names[0])}, and ${full(names[1])}`;
    else if (names.length > 2) who = joinList([inverted(names[0]), ...names.slice(1).map(full)], "and");
    if (who) out.push(end(who));
    out.push(`${year}.`);
    if (src.type === "journal") {
      out.push(`“${end(title)}”`);
      let j = cont ? `*${cont}*` : "";
      if (vol) j += ` ${vol}`;
      if (iss) j += ` (${iss})`;
      if (pages) j += `: ${pages}`;
      if (j) out.push(j + ".");
    } else {
      out.push(`*${end(title)}*`);
      if (cont) out.push(end(cont));
    }
    if (link) out.push(end(link));
  }

  if (style === "harvard") {
    const who = names.length > 3 ? `${harvardName(names[0])} et al.` : joinList(names.map(harvardName), "and", false);
    out.push(`${who ? who + " " : ""}(${year})`);
    if (src.type === "journal") {
      let line = `‘${title}’`;
      if (cont) line += `, *${cont}*`;
      if (vol) line += `, ${vol}`;
      if (iss) line += `(${iss})`;
      if (pages) line += `, pp. ${pages}`;
      out.push(line + ".");
    } else {
      out.push(`*${end(title)}*`);
      if (cont) out.push(end(cont));
    }
    if (link) out.push(doiLink(src.doi) ? `doi:${cleanDoi(src.doi)}.` : `Available at: ${link}${src.accessed ? ` (Accessed: ${src.accessed})` : ""}.`);
  }

  return out.filter(Boolean).join(" ").replace(/\s+/g, " ").replace(/\.\./g, ".").trim();
}

/** The matching in-text citation, e.g. "(Smith & Lee, 2021)". */
export function formatInText(src: Source, style: CiteStyle): string {
  const names = parseAuthors(src.authors);
  const year = src.year.trim() || "n.d.";
  const short = src.title.trim().split(/\s+/).slice(0, 3).join(" ");
  const who =
    names.length === 0
      ? `“${short}”`
      : names.length === 1
        ? names[0].last
        : names.length === 2
          ? `${names[0].last} ${style === "apa" ? "&" : "and"} ${names[1].last}`
          : `${names[0].last} et al.`;
  if (style === "mla") return `(${who}${src.pages ? " " + src.pages.split(/[-–]/)[0].trim() : ""})`;
  if (style === "chicago") return `(${who} ${year})`;
  return `(${who}, ${year})`;
}

export const stripMarks = (s: string) => s.replace(/\*/g, "");

/** Looks up a DOI on Crossref's public API (no key needed). */
export async function lookupDoi(doi: string): Promise<Source> {
  const d = cleanDoi(doi);
  if (!/^10\.\d{4,9}\/\S+$/.test(d)) throw new Error("That doesn't look like a DOI (it should start with 10.).");
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(d)}`);
  if (res.status === 404) throw new Error("No record found for this DOI.");
  if (!res.ok) throw new Error("Lookup failed. Check your connection and try again.");
  const m = (await res.json()).message;
  const type: SourceType = /book/.test(m.type ?? "") ? "book" : "journal";
  const yr = m.issued?.["date-parts"]?.[0]?.[0] ?? m.published?.["date-parts"]?.[0]?.[0] ?? "";
  return {
    ...emptySource(type),
    authors: (m.author ?? [])
      .map((a: { family?: string; given?: string; name?: string }) => (a.family ? `${a.family}${a.given ? ", " + a.given : ""}` : a.name ?? ""))
      .filter(Boolean)
      .join("\n"),
    year: String(yr),
    title: (m.title?.[0] ?? "").replace(/<[^>]+>/g, ""),
    container: type === "book" ? m.publisher ?? "" : m["container-title"]?.[0] ?? "",
    volume: m.volume ?? "",
    issue: m.issue ?? "",
    pages: m.page ?? "",
    doi: d,
  };
}
