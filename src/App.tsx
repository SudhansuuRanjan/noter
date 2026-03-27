import { useEffect, useState } from 'react'

import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { Toolbar } from './components/Toolbar'
import { DeleteModal } from './components/DeleteModal'
import { CommandPalette } from './components/CommandPalette'
import { UpdateBanner } from './components/UpdateBanner'
import { TaskDashboard } from './components/TaskDashboard'
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
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans" role="application" aria-label="Noter secondary preview window">
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
            <div className="flex-1 overflow-hidden" role="main" aria-label="Note preview">
                <Preview />
            </div>
        </div>
    )
}

function AppLayout() {
    const { state, activeNote, createNote, ensureHistorySynced, toggleZen } = useNotes()
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    const [isTaskDashboardOpen, setIsTaskDashboardOpen] = useState(false)

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Global hotkeys
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
                e.preventDefault()
                ensureHistorySynced().then(canOpen => {
                    if (canOpen) {
                        createNote()
                    }
                })
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault()
                toggleZen()
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
                e.preventDefault()
                setIsTaskDashboardOpen(v => !v)
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        window.addEventListener('open-tasks', () => setIsTaskDashboardOpen(true))

        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown)
            window.removeEventListener('open-tasks', () => setIsTaskDashboardOpen(true))
        }
    }, [createNote, ensureHistorySynced, toggleZen])

    // Robust detection for Electron/Vite
    const mode = window.electronAPI.windowArgs.mode

    if (mode === 'secondary') {
        return <SecondaryLayout />
    }

    // We want the sidebar width to feel natural relative to the window
    // - On small screens (<768px), we want it to be a smaller percentage (e.g. 25-30%)
    // - On large screens, we want it to cap at a comfortable width (e.g. 15-20%)
    const isSmallScreen = windowWidth < 768

    // Target base width in pixels
    const targetWidth = isSmallScreen ? 240 : 320

    // Calculate what percentage of the screen the target width represents
    const calculatedPercent = (targetWidth / windowWidth) * 100

    // Clamp the percentage so it doesn't get ridiculously small or large
    // Guarantee it stays at least targetWidth on small screens
    const minSizePercent = isSmallScreen 
        ? Math.min(100, calculatedPercent) 
        : Math.max(17, Math.min(30, calculatedPercent))
        
    const maxSizePercent = isSmallScreen ? 100 : 35

    const defaultSizePercent = minSizePercent

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans" role="application" aria-label="Noter note taking app">
            <PanelGroup direction="horizontal">
                {state.isSidebarOpen && (
                    <Panel
                        defaultSize={defaultSizePercent}
                        minSize={minSizePercent}
                        maxSize={maxSizePercent}
                        order={1}
                        id="sidebar-panel"
                        key="sidebar"
                        className="border-r border-zinc-200 dark:border-zinc-800/60 z-10"
                    >
                        <aside className="h-full min-h-0" aria-label="Sidebar">
                            <Sidebar />
                        </aside>
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
                        <main className="flex flex-col h-full relative" aria-label={`Editing note ${activeNote.title}`}>
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
                        </main>
                    ) : (
                        <main className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 relative overflow-hidden" aria-label="Welcome screen">
                            {/* Decorative background grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                            
                            <div className="text-center animate-in zoom-in-95 fade-in duration-500 relative z-10 max-w-sm w-full">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-8 border border-white/50 dark:border-indigo-500/10 shadow-2xl shadow-indigo-500/10 backdrop-blur-3xl">
                                    <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-inner border border-zinc-200 dark:border-zinc-800">
                                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </div>
                                
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400 mb-3 tracking-tight">
                                    Capture Your Thoughts
                                </h2>
                                
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-10 leading-relaxed px-4">
                                    Select an existing note from the sidebar or start fresh with a new one.
                                </p>

                                <div className="flex flex-col gap-3 px-8">
                                    <button 
                                        onClick={async () => {
                                            const canOpen = await ensureHistorySynced()
                                            if (canOpen) createNote()
                                        }}
                                        aria-label="Create a new note"
                                        className="group relative flex items-center justify-start gap-2 w-full py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg active:scale-95 transition-all overflow-hidden"
                                    >
                                        <span className="relative pl-4 z-10 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                            Create New Note
                                        </span>
                                        <div className="absolute right-3.5 flex items-center gap-1 opacity-60 text-[10px] text-zinc-200 dark:text-zinc-600 font-mono font-bold tracking-wider">
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 dark:bg-zinc-200">⌘</span>
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 dark:bg-zinc-200">N</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                                        }}
                                        aria-label="Open command palette"
                                        className="group relative flex items-center justify-start gap-2 w-full py-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-all border border-zinc-200 dark:border-zinc-800 active:scale-95"
                                    >
                                        <span className="flex items-center gap-2 text-sm pl-4">
                                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            Open Command Palette
                                        </span>
                                        <div className="absolute right-3.5 flex items-center gap-1 opacity-60 text-[10px] font-mono font-bold tracking-wider dark:text-zinc-400 text-zinc-700">
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">⌘</span>
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">K</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </main>
                    )}
                </Panel>
            </PanelGroup>

            <CommandPalette />
            <DeleteModal />
            <UpdateBanner />
            <TaskDashboard isOpen={isTaskDashboardOpen} onClose={() => setIsTaskDashboardOpen(false)} />
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
