import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { getItem, KEYS, openExternal, setItem } from "../lib/storage";

// TODO: replace with the Galaxy Store listing of "Plagiarism Checker X - Text Similarity Detector"
// once its live URL is known (only if Galaxy Store rules allow linking to it).
const PCX_URL = "https://plagiarismcheckerx.com";
// PRIVACY.md in the public repo; update if the repo lives elsewhere.
// App Store Guideline 3.1: no button to an outside site that sells subscriptions on iOS; keep the text only.
const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const PRIVACY_URL = "https://github.com/plagiarismcheckerx/plagx-writing-companion-tauri/blob/main/PRIVACY.md";

export function AboutScreen() {
  const [theme, setTheme] = useState(() => getItem<string>(KEYS.theme) ?? "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    setItem(KEYS.theme, theme);
  }, [theme]);

  return (
    <div className="stack">
      <section className="card">
        <h2>Plagx Writing Companion</h2>
        <p>Free academic writing tools by Plagiarism Checker X.</p>
        <ul className="plain">
          <li><b>Cite</b>: references and in-text citations in APA, MLA, Chicago and Harvard.</li>
          <li><b>Preflight</b>: grammar, punctuation and style suggestions, and checks that citations match the reference list.</li>
          <li><b>Notes</b>: keep sources, quotes and page numbers together.</li>
        </ul>
        <p className="hint">
          Everything runs on your device and works offline. The only network request is the optional DOI lookup to Crossref.
          This app does not check for plagiarism or AI-generated content.
        </p>
      </section>

      <section className="card">
        <label className="label">Appearance</label>
        <div className="seg">
          <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}><Icon name="sun" size={16} />Light</button>
          <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}><Icon name="moon" size={16} />Dark</button>
        </div>
      </section>

      <section className="card">
        <label className="label">More from Plagiarism Checker X</label>
        <p>For complete plagiarism detection and AI-content checks, see Plagiarism Checker X.</p>
        {!IS_IOS && <button className="btn ghost full" onClick={() => openExternal(PCX_URL)}><Icon name="external" size={18} />Learn more</button>}
      </section>

      <p className="hint center">
        Version 1.0.0 ·{" "}
        <button className="link" onClick={() => openExternal(PRIVACY_URL)}>Privacy policy</button>
      </p>
    </div>
  );
}
