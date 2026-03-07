import React from 'react'
import { Search, Plus, Star, FileText, FolderOpen } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { NoteCard } from './NoteCard'
import { ThemeToggle } from './ThemeToggle'

export function Sidebar() {
    const {
        state,
        filteredNotes,
        createNote,
        importNotes,
        setFilter,
        setSearch,
        openFolder
    } = useNotes()

    return (
        <div className="w-72 flex-shrink-0 h-full flex flex-col bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800/60">
            {/* Header — traffic light space + drag region */}
            <div className="pt-10 pb-3 px-4" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                            <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide">Noter</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                        <ThemeToggle />
                        <button
                            onClick={openFolder}
                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200"
                            title="Open Notes Folder"
                        >
                            <FolderOpen size={15} />
                        </button>
                    </div>
                </div>

                {/* New Note + Import */}
                <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <button
                        onClick={createNote}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Plus size={14} />
                        New Note
                    </button>
                    <button
                        onClick={importNotes}
                        className="py-2 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all duration-200 active:scale-95"
                        title="Import Markdown file"
                    >
                        Import
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 mb-3">
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={state.searchQuery}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-500/20 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Filter tabs */}
            <div className="px-4 mb-3 flex gap-1">
                {(['all', 'starred'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${state.filterMode === f
                            ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                            : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                            }`}
                    >
                        {f === 'starred' && <Star size={11} className={state.filterMode === 'starred' ? 'fill-amber-500 text-amber-500' : ''} />}
                        {f === 'all' ? 'All' : 'Starred'}
                        {f === 'all' && (
                            <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-600">{state.notes.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {state.isLoading ? (
                    <div className="flex flex-col gap-2 px-2 mt-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-xl bg-zinc-200 dark:bg-zinc-800/40 p-3 animate-pulse">
                                <div className="h-3 bg-zinc-300 dark:bg-zinc-700/60 rounded w-3/4 mb-2" />
                                <div className="h-2 bg-zinc-200 dark:bg-zinc-700/40 rounded w-full mb-1" />
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-700/30 rounded w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <FileText size={28} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {state.searchQuery ? 'No notes match your search' : 'No notes yet. Create one!'}
                        </p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {filteredNotes.map(note => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                isActive={note.id === state.activeNoteId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
