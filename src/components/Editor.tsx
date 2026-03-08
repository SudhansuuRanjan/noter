import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { EditorView, ViewPlugin, Decoration, MatchDecorator, ViewUpdate } from '@codemirror/view'
import { search } from '@codemirror/search'
import { useNotes } from '../context/NotesContext'
import { useCallback, useRef, useState, useEffect } from 'react'
import { Sparkles, Languages, Wand2 } from 'lucide-react'
import { AICommand } from './AICommand'

const customTheme = EditorView.theme({
    '&': { height: '100%' },
    '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px', lineHeight: '1.7' },
    '.cm-content': { padding: '20px 24px', minHeight: '100%' },
    '.cm-line': { padding: '0' },
    '.cm-focused': { outline: 'none' },
    '&.cm-focused': { outline: 'none !important' },
    '.cm-gutters': { display: 'none' },
    '.cm-cursor': { borderLeftColor: '#6366f1' }
})

const mathDecorator = new MatchDecorator({
    regexp: /\$\$[\s\S]*?\$\$|\$[^\n$]*?\$/g,
    decoration: Decoration.mark({ class: 'cm-math' })
})

const mathPlugin = ViewPlugin.fromClass(class {
    decorations;
    constructor(view: EditorView) {
        this.decorations = mathDecorator.createDeco(view)
    }
    update(update: ViewUpdate) {
        this.decorations = mathDecorator.updateDeco(update, this.decorations)
    }
}, {
    decorations: v => v.decorations
})

export function Editor() {
    const { activeNote, updateNote, state } = useNotes()
    const viewRef = useRef<EditorView | null>(null)
    const [selection, setSelection] = useState<{ text: string, from: number, to: number } | null>(null)
    const [toolbarPos, setToolbarPos] = useState<{ x: number, y: number } | null>(null)
    const [isAICommandOpen, setIsAICommandOpen] = useState(false)

    const handleChange = useCallback((value: string) => {
        if (activeNote) {
            updateNote(activeNote.id, value)
        }
    }, [activeNote, updateNote])

    const handleFileUpload = async (file: File, view: EditorView, insertAt?: number) => {
        if (!file.type.startsWith('image/')) return false

        try {
            const buffer = await file.arrayBuffer()
            const resultUrl = await window.electronAPI.saveAttachment(buffer, file.name)

            const position = insertAt !== undefined ? insertAt : view.state.selection.main.head
            const markdownToInsert = `![${file.name}](${resultUrl})`

            view.dispatch({
                changes: { from: position, to: position, insert: markdownToInsert },
                selection: { anchor: position + markdownToInsert.length }
            })
            return true
        } catch (err) {
            console.error('Failed to upload attachment', err)
            return false
        }
    }

    const attachmentHandler = EditorView.domEventHandlers({
        paste: (event, view) => {
            const items = event.clipboardData?.items
            if (!items) return false

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile()
                    if (file) {
                        handleFileUpload(file, view)
                        event.preventDefault()
                        return true
                    }
                }
            }
            return false
        },
        drop: (event, view) => {
            const items = event.dataTransfer?.files
            if (!items || items.length === 0) return false

            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    handleFileUpload(items[i], view, pos || undefined)
                    event.preventDefault()
                    return true
                }
            }
            return false
        }
    })

    useEffect(() => {
        const handleSelectionChange = () => {
            if (!viewRef.current) return
            const { from, to } = viewRef.current.state.selection.main
            if (from !== to) {
                const text = viewRef.current.state.sliceDoc(from, to)
                setSelection({ text, from, to })

                const coords = viewRef.current.coordsAtPos(from)
                if (coords) {
                    setToolbarPos({ x: coords.left, y: coords.top - 40 })
                }
            } else {
                setSelection(null)
                setToolbarPos(null)
            }
        }

        const view = viewRef.current
        if (view) {
            view.dom.addEventListener('mouseup', handleSelectionChange)
            view.dom.addEventListener('keyup', handleSelectionChange)
        }
        return () => {
            if (view) {
                view.dom.removeEventListener('mouseup', handleSelectionChange)
                view.dom.removeEventListener('keyup', handleSelectionChange)
            }
        }
    }, [activeNote?.id])

    useEffect(() => {
        const handleOpenAI = () => setIsAICommandOpen(true)
        window.addEventListener('open-ai-command', handleOpenAI)
        return () => window.removeEventListener('open-ai-command', handleOpenAI)
    }, [])

    const applyAIResult = (result: string) => {
        console.log('Applying AI result:', { result, hasView: !!viewRef.current, selection })
        if (!viewRef.current) return

        // Focus the editor first to ensure dispatch works correctly
        viewRef.current.focus()

        const mainSelection = viewRef.current.state.selection.main
        const from = selection ? selection.from : mainSelection.head
        const to = selection ? selection.to : mainSelection.head

        console.log('Dispatching changes:', { from, to })

        viewRef.current.dispatch({
            changes: { from, to, insert: result },
            selection: { anchor: from + result.length },
            scrollIntoView: true
        })

        // Also explicitly update the note content to be safe
        if (activeNote) {
            const newContent = activeNote.content.slice(0, from) + result + activeNote.content.slice(to)
            updateNote(activeNote.id, newContent)
        }

        setSelection(null)
        setToolbarPos(null)
    }

    const quickAction = async (type: 'grammar' | 'rephrase') => {
        if (!selection) return
        const systemPrompt = 'You are a helpful AI writing assistant. Return ONLY the transformed text in Markdown.'
        const actionPrompt = type === 'grammar'
            ? `Fix grammar/spelling in this text:\n\n${selection.text}`
            : `Rephrase this text to be more professional:\n\n${selection.text}`

        const response = await window.electronAPI.aiChat({
            messages: [{ role: 'user', content: actionPrompt }],
            systemPrompt
        })

        if (response.content) {
            applyAIResult(response.content)
        }
    }

    if (!activeNote) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-white dark:bg-zinc-950">
                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-700/30">
                        <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm">Select a note or create a new one</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
            <CodeMirror
                value={activeNote.content}
                onChange={handleChange}
                theme={state.theme === 'dark' ? dracula : githubLight}
                onCreateEditor={(view) => viewRef.current = view}
                extensions={[
                    markdown({ base: markdownLanguage, codeLanguages: languages }),
                    customTheme,
                    mathPlugin,
                    attachmentHandler,
                    search({ top: true }),
                    EditorView.lineWrapping
                ]}
                className="flex-1 overflow-hidden h-full"
                style={{ height: '100%' }}
                basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: false,
                    bracketMatching: true,
                    closeBrackets: true
                }}
            />

            {toolbarPos && selection && (
                <div
                    className="fixed z-[80] flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{ left: toolbarPos.x, top: toolbarPos.y }}
                >
                    <button
                        onClick={() => quickAction('grammar')}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                        <Languages className="w-3 h-3 text-indigo-500" /> Fix Grammar
                    </button>
                    <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
                    <button
                        onClick={() => quickAction('rephrase')}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                        <Wand2 className="w-3 h-3 text-indigo-500" /> Rephrase
                    </button>
                    <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
                    <button
                        onClick={() => setIsAICommandOpen(true)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                        <Sparkles className="w-3 h-3 text-indigo-500" /> Ask AI
                    </button>
                </div>
            )}

            <AICommand
                isOpen={isAICommandOpen}
                onClose={() => setIsAICommandOpen(false)}
                selectionText={selection?.text}
                onApply={applyAIResult}
            />
        </div>
    )
}
