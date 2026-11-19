import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { CiteScreen } from "./screens/Cite";
import { PreflightScreen } from "./screens/Preflight";
import { NotesScreen, type Note } from "./screens/Notes";
import { AboutScreen } from "./screens/About";
import { getItem, KEYS, setItem } from "./lib/storage";
import { useToast } from "./components/Toast";
import logo from "./assets/plagx-logo.png";
import logoDark from "./assets/plagx-logo-dark.png";

type Tab = "cite" | "preflight" | "notes" | "about";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "cite", label: "Cite", icon: "cite" },
  { id: "preflight", label: "Preflight", icon: "check" },
  { id: "notes", label: "Notes", icon: "notes" },
  { id: "about", label: "About", icon: "info" },
];

export default function App() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("cite");
  const [notes, setNotes] = useState<Note[]>(() => getItem<Note[]>(KEYS.notes) ?? []);

  useEffect(() => setItem(KEYS.notes, notes), [notes]);

  const saveNote = (n: Note) => setNotes((list) => (list.some((x) => x.id === n.id) ? list.map((x) => (x.id === n.id ? n : x)) : [n, ...list]));
  // Same flow as the PCX app: red confirm toast first, delete only if confirmed.
  const deleteNote = async (id: string): Promise<boolean> => {
    if (!(await toast.confirm("Delete this note? This can't be undone."))) return false;
    setNotes((list) => list.filter((x) => x.id !== id));
    toast.success("Note deleted.");
    return true;
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo light-only" src={logo} alt="PlagX Writing Companion" />
          <img className="brand-logo dark-only" src={logoDark} alt="PlagX Writing Companion" />
        </div>
        <h1>{TABS.find((t) => t.id === tab)!.label}</h1>
      </header>

      <main className="content">
        {tab === "cite" && <CiteScreen onSaveNote={(n) => (saveNote(n), toast.success("Saved to Notes."))} />}
        {tab === "preflight" && <PreflightScreen />}
        {tab === "notes" && <NotesScreen notes={notes} onSave={saveNote} onDelete={deleteNote} />}
        {tab === "about" && <AboutScreen />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
