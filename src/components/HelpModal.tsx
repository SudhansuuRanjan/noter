import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Book } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

const HELP_CONTENT = `
# Noter Cheat Sheet ✨

Welcome to Noter! This is a lightning-fast, local-first markdown editor tailored for developers. Here are some of the power features you can use to upgrade your daily workflow:

## ⚡ Command Palette (Cmd/Ctrl + K)
Pressing \`Cmd+K\` instantly brings up the Command Palette. Type to fuzzy-search across your entire vault. You can instantly open notes, navigate features, or toggle your view modes without touching your mouse!

## 🔗 Internal Note Linking
Tired of flat lists? Build a personal wiki. Typing \`[[Note Title]]\` anywhere in your document will create a clickable hyperlink.
- If the note exists, clicking it instantly navigates you to it.
- If the note doesn't exist, clicking it will automatically create it for you!

## #️⃣ Hashtag Collections
When you type tags like \`#ideas\` or \`#todos\` directly into the text editor, Noter actively scrapes them and builds an intelligent global index in your Sidebar. Click a tag in the sidebar to filter your entire workspace down to those active contexts.

## ⏪ Revisions & Time Machine
Never lose your work! Every time you successfully edit a document, Noter secretly forks an invisible backup checkpoint. Click the **Clock** icon in the top right to open the **History** modal, where you can view every historical edit you've made to the file and instantly restore it to an older version.

## 🖼️ Drag & Drop Attachments
Working with screenshots? Just drag and drop (or paste) an image directly onto the editor. Noter will securely extract the picture, save it to a local \`attachments\` folder, and securely generate standard Markdown image syntax \`![Alt](noter://attachments/...)\` that renders natively in Split/Watch views!

## 📌 Pins, Stars, and Labels
- **Pins**: Keep your scratchpads visible. Hit the **Pin** icon to sticky a note to the very top of your sidebar.
- **Labels**: Build your own folder-like categorization list in the Sidebar. Right-click or use the action icons to assign colors and cleanly group related files. 
- **Star**: Star your favorites for an easy toggle filter!

## 📅 Daily Standups
Hit the **Calendar** icon in the left sidebar nav. Noter will instantly synthesize today's date into a new, auto-labeled Journal entry—perfect for quick standup notes or end-of-day dumping!
`

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose()
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <Book size={18} className="text-amber-500" />
                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Help & Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
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
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-xl text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 transition-colors shadow-sm"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
