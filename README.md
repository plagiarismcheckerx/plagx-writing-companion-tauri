# PlagX Writing Companion

Free academic writing tools for Android by Plagiarism Checker X: citations, writing checks and source
notes. Everything runs on the device and works offline.

- **Cite**: references and in-text citations in APA, MLA, Chicago and Harvard, with optional DOI
  lookup through the public Crossref API.
- **Preflight**: rule-based grammar, punctuation and style suggestions, plus checks that in-text
  citations match the reference list.
- **Notes**: sources, quotes, page numbers and tags, with search and export.

This app does not check for plagiarism or AI-generated content. No account, ads or tracking. See
[PRIVACY.md](PRIVACY.md).

## Build

Requirements: Node.js 20+, Rust (with the Android targets), Android SDK + NDK, JDK 17.

```sh
npm install
npm run dev                     # browser preview at http://localhost:1440
npx tauri android build --apk   # signed if src-tauri/gen/android/keystore.properties exists
```

Release signing reads `src-tauri/gen/android/keystore.properties` (git-ignored):

```
password=...
keyAlias=...
storeFile=/path/to/key.jks
```

## Licence

Code: [MIT](LICENSE). Fonts: Inter and Poppins (SIL Open Font License).

The "Plagiarism Checker X" and "PlagX" names and logos are trademarks of Plagiarism Checker X and are
not covered by the MIT licence. If you publish a fork, use your own name and icon.
