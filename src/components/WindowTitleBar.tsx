import React, { useEffect, useState } from 'react'
import { FileText, Minus, PanelLeft, Search, Square, Copy, X } from 'lucide-react'
import { useNotes } from '../context/NotesContext'

interface WindowTitleBarProps {
    title?: string
    showSearch?: boolean
}

export function WindowTitleBar({ title, showSearch = false }: WindowTitleBarProps) {
    const { state, setSearch, toggleSidebar } = useNotes()
    const [isMaximized, setIsMaximized] = useState(false)
    const isMac = window.electronAPI.platform === 'darwin'
    const isWindows = window.electronAPI.platform === 'win32'

    useEffect(() => {
        let isMounted = true

        window.electronAPI.isWindowMaximized().then((value) => {
            if (isMounted) {
                setIsMaximized(value)
            }
        })

        const unsubscribe = window.electronAPI.onMaximizedChange((value) => {
            setIsMaximized(value)
        })

        return () => {
            isMounted = false
            unsubscribe()
        }
    }, [])

    return (
        <div
            className="h-10 min-w-0 flex-shrink-0 grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 overflow-hidden border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl px-3 select-none"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            <div className={`flex items-center gap-2 min-w-0 max-w-[240px] ${isMac ? 'pl-20' : ''}`}>
                {showSearch && isWindows && (
                    <button
                        onClick={toggleSidebar}
                        aria-label={state.isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                        <PanelLeft size={16} />
                    </button>
                )}
                <div className="size-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                    <FileText size={15} className="text-indigo-600 dark:text-indigo-300" />
                </div>
                <div className="min-w-0 overflow-hidden">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {showSearch ? 'Noter' : (title || 'Noter')}
                    </div>
                    {!showSearch && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            Secondary window
                        </div>
                    )}
                </div>
            </div>

            {showSearch ? (
                <div className="min-w-0 w-full max-w-xl justify-self-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <label className="relative h-full block">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                        <input
                            aria-label="Search notes"
                            type="text"
                            placeholder="Search notes..."
                            value={state.searchQuery}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-7 pl-9 pr-16 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-white/90 dark:bg-zinc-900/80 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-300/40 dark:focus:ring-indigo-500/20 transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">
                            Ctrl+K
                        </span>
                    </label>
                </div>
            ) : (
                <div className="min-w-0 w-full" />
            )}

            {isWindows ? (
                <div className="flex items-center flex-shrink-0 -mr-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <button
                        onClick={() => window.electronAPI.minimizeWindow()}
                        aria-label="Minimize window"
                        className="h-10 w-12 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Minus size={15} />
                    </button>
                    <button
                        onClick={async () => setIsMaximized(await window.electronAPI.toggleMaximizeWindow())}
                        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
                        className="h-10 w-12 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                    >
                        {isMaximized ? <Copy size={14} /> : <Square size={13} />}
                    </button>
                    <button
                        onClick={() => window.electronAPI.closeWindow()}
                        aria-label="Close window"
                        className="h-10 w-12 flex items-center justify-center text-zinc-500 hover:text-white dark:text-zinc-400 hover:bg-red-500 transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>
            ) : (
                <div className="w-12 flex-shrink-0" />
            )}
        </div>
    )
}
