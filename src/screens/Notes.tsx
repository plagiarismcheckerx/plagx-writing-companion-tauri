import { useState } from "react";
import { Icon } from "../icons";
import type { Source } from "../lib/citation";
import { copyText, uid } from "../lib/storage";
import { useToast } from "../components/Toast";

export interface Note {
  id: string;
  title: string;
  citation: string;
  quote: string;
  page: string;
  tags: string;
  note: string;
  source?: Source;
  created: number;
}

const blank = (): Note => ({ id: uid(), title: "", citation: "", quote: "", page: "", tags: "", note: "", created: Date.now() });

export function NotesScreen({ notes, onSave, onDelete }: { notes: Note[]; onSave: (n: Note) => void; onDelete: (id: string) => Promise<boolean> }) {
  const toast = useToast();
  const [editing, setEditing] = useState<Note | null>(null);
  const [q, setQ] = useState("");

  if (editing) {
    return <NoteEditor note={editing} onCancel={() => setEditing(null)} onSave={(n) => (onSave(n), setEditing(null), toast.success("Note saved."))} onDelete={async (id) => (await onDelete(id)) && setEditing(null)} />;
  }

  const term = q.trim().toLowerCase();
  const list = term ? notes.filter((n) => [n.title, n.citation, n.quote, n.tags, n.note].join(" ").toLowerCase().includes(term)) : notes;

  async function exportAll() {
    const txt = notes
      .map((n) => [n.title, n.citation, n.quote && `“${n.quote}”${n.page ? ` (p. ${n.page})` : ""}`, n.note, n.tags && `Tags: ${n.tags}`].filter(Boolean).join("\n"))
      .join("\n\n---\n\n");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Source notes", text: txt });
        return;
      } catch {
        /* cancelled or unsupported: fall back to copy */
      }
    }
    if (await copyText(txt)) toast.success("All notes copied to clipboard.");
    else toast.error("Couldn't copy your notes.");
  }

  return (
    <div className="stack">
      <div className="row">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn" onClick={() => setEditing(blank())}><Icon name="plus" size={18} />New</button>
      </div>

      {notes.length === 0 ? (
        <div className="card empty">
          <p>Keep sources, quotes and page numbers in one place.</p>
          <p className="hint">Notes stay on this device.</p>
        </div>
      ) : list.length === 0 ? (
        <p className="empty card">No notes match “{q}”.</p>
      ) : (
        <ul className="notes">
          {list.map((n) => (
            <li key={n.id}>
              <button className="note" onClick={() => setEditing(n)}>
                <b>{n.title || "Untitled"}</b>
                {n.quote && <span className="quote">“{n.quote}”{n.page && ` (p. ${n.page})`}</span>}
                {n.citation && <span className="cit">{n.citation}</span>}
                {n.tags && (
                  <span className="tags">
                    {n.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => <em key={t}>{t}</em>)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <button className="btn ghost full" onClick={exportAll}><Icon name="share" size={18} />Export all notes</button>
      )}
    </div>
  );
}

function NoteEditor({ note, onSave, onCancel, onDelete }: { note: Note; onSave: (n: Note) => void; onCancel: () => void; onDelete: (id: string) => void }) {
  const [n, setN] = useState(note);
  const set = (k: keyof Note) => (e: { target: { value: string } }) => setN((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="stack">
      <button className="btn ghost sm back" onClick={onCancel}><Icon name="back" size={18} />Notes</button>
      <section className="card">
        <label className="label">Title</label>
        <input className="input" value={n.title} onChange={set("title")} placeholder="Source or topic" />
        <label className="label">Citation</label>
        <textarea className="input" rows={3} value={n.citation} onChange={set("citation")} placeholder="Paste or create one in Cite" />
        <label className="label">Quote</label>
        <textarea className="input" rows={3} value={n.quote} onChange={set("quote")} />
        <div className="grid2">
          <div><label className="label">Page</label><input className="input" value={n.page} onChange={set("page")} /></div>
          <div><label className="label">Tags <em>comma separated</em></label><input className="input" value={n.tags} onChange={set("tags")} /></div>
        </div>
        <label className="label">Your notes</label>
        <textarea className="input" rows={4} value={n.note} onChange={set("note")} />
      </section>
      <div className="row">
        <button className="btn" onClick={() => onSave(n)}>Save</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn ghost danger push" onClick={() => onDelete(n.id)}><Icon name="trash" size={18} />Delete</button>
      </div>
    </div>
  );
}
