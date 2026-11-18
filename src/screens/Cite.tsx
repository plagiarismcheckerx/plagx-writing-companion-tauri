import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { emptySource, formatInText, formatReference, lookupDoi, STYLES, stripMarks, type CiteStyle, type Source, type SourceType } from "../lib/citation";
import { copyText, getItem, KEYS, setItem, uid } from "../lib/storage";
import type { Note } from "./Notes";
import { useToast } from "../components/Toast";

/** Renders *italic* markers from the formatter. */
export function Formatted({ text }: { text: string }) {
  return (
    <>
      {text.split("*").map((part, i) => (i % 2 ? <i key={i}>{part}</i> : <span key={i}>{part}</span>))}
    </>
  );
}

const TYPES: { id: SourceType; label: string }[] = [
  { id: "journal", label: "Journal" },
  { id: "book", label: "Book" },
  { id: "website", label: "Website" },
];

export function CiteScreen({ onSaveNote }: { onSaveNote: (n: Note) => void }) {
  const toast = useToast();
  const [style, setStyle] = useState<CiteStyle>(() => getItem<CiteStyle>(KEYS.citeStyle) ?? "apa");
  const [src, setSrc] = useState<Source>(emptySource());
  const [doi, setDoi] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => setItem(KEYS.citeStyle, style), [style]);

  const set = (k: keyof Source) => (e: { target: { value: string } }) => setSrc((s) => ({ ...s, [k]: e.target.value }));
  const ready = src.title.trim().length > 0;
  const ref = ready ? formatReference(src, style) : "";
  const inText = ready ? formatInText(src, style) : "";

  async function lookup() {
    setBusy(true);
    setErr("");
    try {
      setSrc(await lookupDoi(doi));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    if (await copyText(stripMarks(text))) toast.success("Copied to clipboard.");
    else toast.error("Couldn't copy. Select the text and copy it manually.");
  }

  const container = src.type === "journal" ? "Journal" : src.type === "book" ? "Publisher" : "Website name";

  return (
    <div className="stack">
      <section className="card">
        <label className="label" htmlFor="doi">Fill from DOI (optional)</label>
        <div className="row">
          <input id="doi" className="input" placeholder="10.1000/xyz123" value={doi} onChange={(e) => setDoi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doi && lookup()} inputMode="url" autoCapitalize="off" />
          <button className="btn" disabled={!doi.trim() || busy} onClick={lookup}>{busy ? "…" : "Look up"}</button>
        </div>
        {err && <p className="err">{err}</p>}
        <p className="hint">Uses the public Crossref directory. Nothing else leaves your device.</p>
      </section>

      <section className="card">
        <div className="seg">
          {TYPES.map((t) => (
            <button key={t.id} className={src.type === t.id ? "on" : ""} onClick={() => setSrc((s) => ({ ...s, type: t.id }))}>{t.label}</button>
          ))}
        </div>
        <label className="label">Authors <em>one per line, “Last, First”</em></label>
        <textarea className="input" rows={2} value={src.authors} onChange={set("authors")} placeholder={"Smith, Jane\nLee, Min-ho"} />
        <label className="label">Title</label>
        <input className="input" value={src.title} onChange={set("title")} />
        <div className="grid2">
          <div>
            <label className="label">Year</label>
            <input className="input" value={src.year} onChange={set("year")} inputMode="numeric" placeholder="2024" />
          </div>
          <div>
            <label className="label">{container}</label>
            <input className="input" value={src.container} onChange={set("container")} />
          </div>
        </div>
        {src.type === "journal" && (
          <div className="grid3">
            <div><label className="label">Volume</label><input className="input" value={src.volume} onChange={set("volume")} /></div>
            <div><label className="label">Issue</label><input className="input" value={src.issue} onChange={set("issue")} /></div>
            <div><label className="label">Pages</label><input className="input" value={src.pages} onChange={set("pages")} placeholder="12–19" /></div>
          </div>
        )}
        {src.type !== "website" ? (
          <>
            <label className="label">DOI</label>
            <input className="input" value={src.doi} onChange={set("doi")} autoCapitalize="off" />
          </>
        ) : (
          <div className="grid2">
            <div><label className="label">URL</label><input className="input" value={src.url} onChange={set("url")} inputMode="url" autoCapitalize="off" /></div>
            <div><label className="label">Accessed</label><input className="input" value={src.accessed} onChange={set("accessed")} placeholder="3 May 2025" /></div>
          </div>
        )}
        <button className="btn ghost sm" onClick={() => (setSrc(emptySource(src.type)), setDoi(""))}>Clear</button>
      </section>

      <section className="card">
        <div className="seg">
          {STYLES.map((s) => (
            <button key={s.id} className={style === s.id ? "on" : ""} onClick={() => setStyle(s.id)}>{s.label}</button>
          ))}
        </div>
        {ready ? (
          <>
            <label className="label">Reference</label>
            <p className="ref"><Formatted text={ref} /></p>
            <label className="label">In-text</label>
            <p className="ref">{inText}</p>
            <div className="row">
              <button className="btn" onClick={() => copy(ref)}><Icon name="copy" size={18} />Copy reference</button>
              <button className="btn ghost" onClick={() => copy(inText)}>Copy in-text</button>
            </div>
            <button
              className="btn ghost full"
              onClick={() =>
                onSaveNote({ id: uid(), title: src.title, citation: stripMarks(ref), quote: "", page: "", tags: "", note: "", source: src, created: Date.now() })
              }
            >
              <Icon name="plus" size={18} />Save to Notes
            </button>
          </>
        ) : (
          <p className="empty">Enter at least a title to see the citation.</p>
        )}
      </section>
      <p className="hint center">Always check citations against your institution's style guide.</p>
    </div>
  );
}
