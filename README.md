# Noter

A modern, local-first note-taking application built with Electron, React, Vite, and Tailwind CSS. **Noter** provides a seamless writing experience with GitHub Flavored Markdown support and a beautifully crafted dark/light mode UI.

![Noter Screenshot](https://via.placeholder.com/800x450.png?text=Noter+Application) <!-- Replace with an actual screenshot -->

## Features

- 📝 **Markdown Editor**: Real-time writing with CodeMirror 6 and immediate preview.
- 🌓 **Themes**: Beautifully crafted Light and Dark modes.
- 📁 **Filesystem Based**: All notes are stored locally as standard `.md` files in your `~/Notes/noter` directory.
- 🪟 **Custom UI**: Frameless macOS-style window with drag regions and a custom title bar.
- ✨ **Rich Interactions**: Star important notes, full text search, and smart filtering.
- 📥 **Import/Export**: Easily import existing `.md` files or export notes to anywhere on your system.
- 🎨 **Code Highlighting**: Syntax highlighting for code blocks in the markdown preview.

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Editor**: [UIW React CodeMirror](https://uiwjs.github.io/react-codemirror/)
- **Markdown Parsing**: [React Markdown](https://github.com/remarkjs/react-markdown) with `remark-gfm` and `rehype-highlight`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tooling**: [electron-vite](https://electron-vite.org/) & electron-builder

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
This project uses `bun` as the preferred package manager (though `npm` works as well), so having [Bun](https://bun.sh/) installed is recommended.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SudhansuuRanjan/noter.git
   cd noter
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```
   *(or `npm install`)*

3. **Start the development server**
   ```bash
   bun run dev
   ```
   This will start both the Vite development server for the renderer and the Electron process.

### Building for Production

To create a distributable application for your OS, run:

```bash
bun run build
```

The resulting binaries (e.g., `.app`, `.dmg` for macOS) will be located in the `release/` directory.

## File Structure

- `electron/` - Main process code (window management, IPC handlers, File System ops)
- `src/` - Renderer process (React Frontend)
  - `components/` - UI components (Sidebar, Editor, Preview, Toolbar, etc.)
  - `context/` - Global React state (Notes logic, file syncing)
  - `styles/` - Tailwind configuration and global CSS
  - `types/` - TypeScript interface definitions

## License

This project is licensed under the MIT License.
