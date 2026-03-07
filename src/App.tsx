import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
import { DeleteModal } from './components/DeleteModal'
import { CommandPalette } from './components/CommandPalette'
import { NotesProvider, useNotes } from './context/NotesContext'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

function SecondaryLayout() {
    const { state, activeNote } = useNotes()

    if (!activeNote) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 h-screen w-screen">
                <p className="text-zinc-400">Loading note...</p>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
            <header
                className="h-10 flex-shrink-0 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm px-4"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">Noter</span>
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[300px]">{activeNote.title}</span>
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <Preview />
            </div>
        </div>
    )
}

function AppLayout() {
    const { state, activeNote } = useNotes()

    // Robust detection for Electron/Vite
    const mode = window.electronAPI.windowArgs.mode

    if (mode === 'secondary') {
        return <SecondaryLayout />
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
            <PanelGroup direction="horizontal">
                {state.isSidebarOpen && (
                    <Panel
                        defaultSize={25}
                        minSize={15}
                        maxSize={40}
                        order={1}
                        id="sidebar-panel"
                        key="sidebar"
                        className="border-r border-zinc-200 dark:border-zinc-800/60 z-10"
                    >
                        <Sidebar />
                    </Panel>
                )}
                {state.isSidebarOpen && (
                    <PanelResizeHandle
                        key="sidebar-resizer"
                        className="w-px bg-zinc-200 dark:bg-zinc-800 hover:bg-indigo-400 dark:hover:bg-indigo-500 hover:w-1 transition-all z-20 cursor-col-resize"
                    />
                )}

                {/* Main content */}
                <Panel
                    order={2}
                    id="main-panel"
                    key="main"
                    className="flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-zinc-950"
                >
                    {activeNote ? (
                        <div className="flex flex-col h-full relative">
                            <Toolbar />
                            <div className="flex-1 min-h-0 relative">
                                {state.viewMode === 'split' ? (
                                    <PanelGroup direction="horizontal">
                                        <Panel defaultSize={50} minSize={20} order={1} className="h-full">
                                            <Editor />
                                        </Panel>
                                        <PanelResizeHandle className="w-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-colors z-20 cursor-col-resize" />
                                        <Panel defaultSize={50} minSize={20} order={2} className="h-full">
                                            <Preview />
                                        </Panel>
                                    </PanelGroup>
                                ) : state.viewMode === 'edit' ? (
                                    <Editor />
                                ) : (
                                    <Preview />
                                )}
                            </div>
                        </div>
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
                </Panel>
            </PanelGroup>

            <CommandPalette />
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
