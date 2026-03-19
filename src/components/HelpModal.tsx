import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Book } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { withViewTransition } from '../utils/transition'
import { useHotkey } from '@tanstack/react-hotkeys'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

const HELP_CONTENT = `
# Noter Power Guide ✨

Welcome to Noter! This is a lightning-fast, local-first markdown editor. Here are the latest features to boost your productivity:

## ⚡ Quick Shortcuts
- **Cmd/Ctrl + K**: Open Command Palette (Search & Actions)
- **Cmd/Ctrl + N**: Create a new note instantly
- **Cmd/Ctrl + S**: Forced save (Auto-save is also active)
- **Esc**: Close modals or exit full-screen views

## 🤖 AI Assistant (Writing & Editing)
Transform your notes with integrated AI. Click the **Sparkles** icon in the toolbar or use the Command Palette to:
- **Rephrase**: Make your writing more professional.
- **Summarize**: Turn long notes into concise bullet points.
- **Fix Grammar**: Polish your spelling and syntax instantly.
- **Continue Writing**: Let the AI expand on your existing ideas.
- **Custom Prompts**: Ask the AI anything directly!

## 🔗 Intelligent Note Linking
Connect your thoughts with Wiki-Style links using \`[[Note Title]]\`. 
- Clicking a link opens a **Smart Router** modal.
- Choose to open in the **Current Window** or a **New Dedicated Window** for side-by-side reference.
- If the note doesn't exist, Noter will create it for you!

## 🎨 Theme & Personalization
Make Noter your own. Navigate to **AI Settings** (via Gear icon or Cmd+K) to:
- Toggle between **Light** and **Dark** modes.
- Choose your **Accent Color** (Indigo, Cyan, or Pink) which affects the entire UI.

## � Professional PDF Export
Need a hard copy? Click the **PDF** icon in the preview toolbar. Noter generates a clean, paginated PDF with:
- Dedicated print-ready typography.
- Automatic light-mode conversion for legibility.
- Hidden UI elements for a pure document finish.

## 📊 Advanced Markdown support
- **Mermaid Diagrams**: Render charts and flows using \`\`\`mermaid\`\`\` blocks.
- **LaTeX Math**: Render formulas using \`$\` for inline and \`$$\` for blocks.
- **Copy Code**: Hover over any code block to see the fast Copy button.
- **Smart Tables**: Enhanced, beautiful table rendering with hover highlights.

## ⏪ Revisions & Time Machine
Never lose your work! Every time you edit, Noter creates a silent checkpoint. Click the **Clock** icon to view history and restore past versions.
`

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useHotkey('Escape', () => {
        withViewTransition(onClose)
    }, { enabled: isOpen && mounted })

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => withViewTransition(onClose)}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Book className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Help & Shortcuts</h2>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Noter Commands and Features</p>
                        </div>
                    </div>
                    <button
                        onClick={() => withViewTransition(onClose)}
                        className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                        title="Close (Esc)"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-2xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-zinc-200 dark:prose-h1:border-zinc-700/50 prose-h1:pb-4 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-p:text-sm prose-li:text-sm prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                        >
                            {HELP_CONTENT}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-end">
                    <button
                        onClick={() => withViewTransition(onClose)}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
