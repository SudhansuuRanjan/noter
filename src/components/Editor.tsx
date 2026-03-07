import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { EditorView } from '@codemirror/view'
import { search } from '@codemirror/search'
import { useNotes } from '../context/NotesContext'
import { useCallback, useRef } from 'react'

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

export function Editor() {
    const { activeNote, updateNote, state } = useNotes()
    const viewRef = useRef<EditorView | null>(null)

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
        </div>
    )
}
