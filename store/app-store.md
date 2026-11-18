# Apple App Store: listing and submission sheet

Copy each field into App Store Connect. Character limits are Apple's.

## App information

| Field | Value |
|---|---|
| Name (30) | PlagX Writing Companion |
| Subtitle (30) | Citations & writing checks |
| Bundle ID | com.plagiarismcheckerx.writingcompanion |
| SKU | plagx-writing-companion-ios |
| Primary category | Education |
| Secondary category | Productivity |
| Price | Free, no in-app purchases |
| Age rating | 4+ (answer "None" to every questionnaire item; no web browser, no user-generated content shared) |
| Privacy policy URL | https://github.com/plagiarismcheckerx/plagx-writing-companion-tauri/blob/main/PRIVACY.md |
| Support URL | https://plagiarismcheckerx.com |
| Copyright | 2026 Plagiarism Checker X |
| Devices | iPhone only (avoids iPad screenshots) |

## Keywords (100, comma separated, no spaces)

```
citation,reference,APA,MLA,Chicago,Harvard,bibliography,grammar,punctuation,essay,student,DOI,notes
```

## Promotional text (170)

Create APA, MLA, Chicago and Harvard citations, check your references and grammar, and keep source notes. Free, private and offline.

## Description (4000)

Free academic writing tools by Plagiarism Checker X.

CITE
• Create references and in-text citations in APA, MLA, Chicago and Harvard
• Journal articles, books and websites
• Optional DOI lookup fills in the details for you (via the public Crossref service)

PREFLIGHT
• Grammar and punctuation suggestions: repeated words, capitalisation, spacing, unmatched brackets and quotes, common confusions
• Style hints: long sentences, possible passive voice, filler words, contractions
• Reference checks: citations missing from the reference list, references never cited, missing years, mixed formats, broken DOIs and URLs, duplicates and ordering
• Tap a suggestion to find it in your text, and apply fixes in one tap

NOTES
• Keep sources, quotes, page numbers and tags together
• Search and export all your notes

PRIVATE BY DESIGN
No account, no ads, no tracking. Everything runs and is stored on your device and works offline. The only network request is the optional DOI lookup.

Preflight uses writing rules, not AI. This app does not check for plagiarism or AI-generated content.

## What's new (version 1.0.0)

First release: Cite, Preflight writing and reference checks, and source notes.

## App Privacy (nutrition label)

Data collection: **No, we do not collect data from this app.**
(The DOI lookup sends only the DOI to Crossref; nothing is collected by us.)

## Export compliance

Uses encryption: **Yes, only standard HTTPS** → exempt. Choose "None of the algorithms mentioned above"
/ exempt standard encryption. `src-tauri/Info.ios.plist` already sets
`ITSAppUsesNonExemptEncryption = NO`, so App Store Connect won't ask on each upload.

## App Review notes

PlagX Writing Companion is a fully offline writing utility; it does not load a website. All three
tools (Cite, Preflight, Notes) run on the device using built-in rules. No sign-in is required, so no
demo account is needed. The only network request is the optional DOI lookup in Cite, which calls the
public Crossref API (api.crossref.org). The app has no purchases and no links to purchase anything.
Test: Cite → enter DOI 10.1038/nature14539 → Look up.

## Assets the designer must deliver

| Asset | Size | Notes |
|---|---|---|
| App icon | 1024×1024 PNG | No transparency, no rounded corners (Apple rounds them) |
| iPhone 6.9" screenshots | 1320×2868 (portrait) | 3–10 images; required |
| iPhone 6.5" screenshots | 1284×2778 | Optional; Apple scales 6.9" if missing |
| App preview video | — | Optional |

Use the desktop app's colours and components (no gradients, no oversized radii). Suggested
screens: Cite with a finished APA reference; Preflight with suggestions; reference check results;
Notes list; About/privacy ("No account, no tracking, works offline").
