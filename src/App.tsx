import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
import { DeleteModal } from './components/DeleteModal'
import { NotesProvider, useNotes } from './context/NotesContext'

function AppLayout() {
    const { state, activeNote } = useNotes()

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {activeNote ? (
                    <>
                        <Toolbar />
                        <div className="flex-1 flex overflow-hidden">
                            {(state.viewMode === 'edit' || state.viewMode === 'split') && (
                                <div className={`flex flex-col overflow-hidden ${state.viewMode === 'split'
                                        ? 'flex-1 border-r border-zinc-200 dark:border-zinc-800/60'
                                        : 'flex-1'
                                    }`}>
                                    <Editor />
                                </div>
                            )}
                            {(state.viewMode === 'preview' || state.viewMode === 'split') && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <Preview />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                        <div className="text-center animate-fade-in">
                            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center mx-auto mb-6 border border-zinc-200 dark:border-zinc-700/20">
                                <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-zinc-400 dark:text-zinc-500 text-base font-medium mb-2">No note selected</h2>
                            <p className="text-zinc-300 dark:text-zinc-600 text-sm">Pick a note from the sidebar or create a new one</p>
                        </div>
                    </div>
                )}
            </div>

            <DeleteModal />
        </div>
    )
}

export default function App() {
    return (
        <NotesProvider>
            <AppLayout />
        </NotesProvider>
    )
}
