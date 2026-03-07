import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { EditorView } from '@codemirror/view'
import { useNotes } from '../context/NotesContext'
import { useCallback } from 'react'

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

    const handleChange = useCallback((value: string) => {
        if (activeNote) {
            updateNote(activeNote.id, value)
        }
    }, [activeNote, updateNote])

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
                extensions={[
                    markdown({ base: markdownLanguage, codeLanguages: languages }),
                    customTheme,
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
