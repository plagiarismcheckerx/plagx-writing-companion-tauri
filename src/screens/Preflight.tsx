import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import { applyFix, KIND_LABEL, runPreflight, type Issue, type IssueKind, type PreflightResult } from "../lib/preflight";
import { getItem, KEYS, setItem } from "../lib/storage";
import { useToast } from "../components/Toast";

const SAMPLE = `Recent studies has shown that sleep effects memory  consolidation (Walker, 2017).however , the the evidence for students is mixed (Okano et al., 2019).i think more work is needed.

References
Walker, M. (2017). Why we sleep. Scribner.
Brown, A. (2020). Sleep and grades. Journal of Sleep, 4(2), 10–18.`;

export function PreflightScreen() {
  const toast = useToast();
  const [text, setText] = useState(() => getItem<string>(KEYS.draft) ?? "");
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [filter, setFilter] = useState<IssueKind | "all">("all");
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setItem(KEYS.draft, text), 400);
    return () => window.clearTimeout(t);
  }, [text]);

  const run = (t = text) => setResult(runPreflight(t));
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of result?.issues ?? []) c[i.kind] = (c[i.kind] ?? 0) + 1;
    return c;
  }, [result]);
  const shown = (result?.issues ?? []).filter((i) => filter === "all" || i.kind === filter);

  function show(i: Issue) {
    if (i.start == null || !area.current) return;
    const el = area.current;
    el.focus();
    el.setSelectionRange(i.start, i.end ?? i.start);
    // Scroll the selection into view: approximate by line position.
    const line = text.slice(0, i.start).split("\n").length;
    el.scrollTop = Math.max(0, (line - 3) * 22);
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function fix(i: Issue) {
    const next = applyFix(text, i);
    setText(next);
    run(next); // offsets shift after an edit, so re-check
    toast.success("Fix applied.");
  }

  return (
    <div className="stack">
      <section className="card">
        <label className="label" htmlFor="pf">Paste your draft, including the reference list</label>
        <textarea id="pf" ref={area} className="input editor" rows={10} value={text} onChange={(e) => (setText(e.target.value), setResult(null))} placeholder="Paste text here…" spellCheck />
        <div className="row">
          <button className="btn" disabled={!text.trim()} onClick={() => run()}><Icon name="check" size={18} />Run Preflight</button>
          {!text && <button className="btn ghost" onClick={() => setText(SAMPLE)}>Try a sample</button>}
          {text && <button className="btn ghost" onClick={() => (setText(""), setResult(null))}>Clear</button>}
        </div>
        <p className="hint">Checks run on your device using writing rules. They're suggestions, not a guarantee.</p>
      </section>

      {result && (
        <>
          <section className="stats">
            <div><b>{result.stats.words}</b><span>words</span></div>
            <div><b>{result.stats.avgSentence}</b><span>avg sentence</span></div>
            <div><b>{result.stats.citations}</b><span>citations</span></div>
            <div><b>{result.stats.references}</b><span>references</span></div>
          </section>

          <div className="chips">
            <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All <em>{result.issues.length}</em></button>
            {(Object.keys(KIND_LABEL) as IssueKind[]).map((k) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)} disabled={!counts[k]}>
                {KIND_LABEL[k]} <em>{counts[k] ?? 0}</em>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="empty card">{result.issues.length ? "Nothing in this category." : "No issues found by these checks."}</p>
          ) : (
            <ul className="issues">
              {shown.map((i) => (
                <li key={i.id} className={`issue k-${i.kind}`}>
                  <button className="issue-main" onClick={() => show(i)} disabled={i.start == null}>
                    <span className="kind">{KIND_LABEL[i.kind]}</span>
                    <span className="msg">{i.message}</span>
                    {i.start != null && (
                      <span className="excerpt">
                        {i.fix != null ? (
                          <>
                            <s>{visible(text.slice(i.start, i.end))}</s> → <b>{visible(i.fix) || "(remove)"}</b>
                          </>
                        ) : (
                          excerpt(text, i.start, i.end!)
                        )}
                      </span>
                    )}
                  </button>
                  {i.fix != null && (
                    <button className="btn sm" onClick={() => fix(i)}><Icon name="wand" size={16} />Fix</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

const visible = (s: string) => s.replace(/ /g, "·").replace(/\n/g, "↵");

function excerpt(text: string, start: number, end: number) {
  const s = text.slice(start, end);
  return s.length > 90 ? s.slice(0, 87).trimEnd() + "…" : s;
}
