# Noter 📝

Noter is a fast, local-first note-taking app built for people who just want to think and write without distractions.

It stores everything as plain `.md` files on your machine, so your notes are always yours. No accounts, no sync issues, no weird lock-in. Just clean writing, powerful tools, and a smooth experience.

---

## Why I built this

Most note apps either feel too heavy, too online, or too cluttered.

I wanted something that:

* opens instantly
* respects privacy
* works with simple markdown files
* still feels modern and powerful

So Noter is basically that.

---

## What you get

### Writing feels smooth

* Clean markdown editor with live preview
* Support for Mermaid diagrams, LaTeX, tables
* Built-in search inside notes (Cmd/Ctrl + F)
* Copy buttons on code blocks (small thing, big win)

---

### AI, but not annoying

There’s an AI assistant built in, but it stays out of your way.

You can:

* rephrase text
* summarize notes
* fix grammar
* expand ideas
* or just type `/write something...` and let it continue

Everything works inline, with accept/reject so you stay in control.

---

### Navigation is fast

* Command palette (Cmd/Ctrl + K) for basically everything
* Quick note creation
* Wiki-style links like `[[My Note]]`
* Open notes in a new window when needed

It’s designed so you don’t think about navigation.

---

### Actually useful features

* Daily notes
* Global tasks dashboard (pulls todos from all notes)
* Revision history (like a mini time machine)
* PDF export that actually looks clean

---

### Looks good, stays simple

* Light / dark mode
* Accent colors (Indigo, Cyan, Pink)
* Subtle glass UI, nothing overdone
* Zen mode when you just want to focus

---

### Local-first (important)

* Everything is stored as `.md` files
* No cloud dependency
* No data collection
* Works offline, always

---

## Tech stack (if you care)

* Electron
* React + Vite
* Tailwind CSS
* CodeMirror 6
* Bun (for local tooling)

---

## Getting started

```bash
git clone https://github.com/SudhansuuRanjan/noter.git
cd noter
bun install
bun run dev
```

Or use npm if you prefer:

```bash
npm install
npm run dev
```

---

## Build

```bash
bun run build
```

You’ll find the app in the `release/` folder.

---

## Project structure

* `electron/` → main process, filesystem handling
* `src/` → React app

  * `components/` → UI pieces
  * `context/` → state management
  * `styles/` → Tailwind + design

---

## A quick power guide

Some shortcuts you’ll actually use:

* Cmd/Ctrl + K → command palette
* Cmd/Ctrl + N → new note
* Cmd/Ctrl + Shift + F → Zen mode
* Cmd/Ctrl + Shift + T → tasks dashboard

---

## Final note

This isn’t trying to be the next Notion or Obsidian killer.

It’s just a solid, fast, private note app that gets out of your way.

If that’s what you’re looking for, you’ll probably like it.

---

## License

MIT — do whatever you want with it.
