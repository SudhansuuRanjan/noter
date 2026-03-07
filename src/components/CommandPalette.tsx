import React, { useState, useEffect, useRef } from 'react'
import { Search, FileText, Plus, Moon, Sun, Tag, FolderOpen } from 'lucide-react'
import { useNotes } from '../context/NotesContext'

export function CommandPalette() {
    const { state, setActiveNote, createNote, toggleTheme, openFolder, setSelectedLabelId } = useNotes()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(o => !o)
                setQuery('')
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    if (!isOpen) return null

    const q = query.toLowerCase()

    const noteResults = state.notes.filter(n => n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q)).slice(0, 5)

    const actionResults = [
        { id: 'new-note', label: 'Create new note', icon: <Plus size={14} />, action: () => createNote() },
        { id: 'toggle-theme', label: `Switch to ${state.theme === 'dark' ? 'Light' : 'Dark'} Theme`, icon: state.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />, action: () => toggleTheme() },
        { id: 'open-folder', label: 'Open notes folder', icon: <FolderOpen size={14} />, action: () => openFolder() }
    ].filter(a => a.label.toLowerCase().includes(q))

    const labelResults = state.labels.filter(l => l.name.toLowerCase().includes(q)).map(l => ({
        id: `label-${l.id}`,
        label: `Filter by label: ${l.name}`,
        icon: <Tag size={14} style={{ color: l.color }} />,
        action: () => setSelectedLabelId(l.id)
    }))

    const handleSelectAction = (action: () => void) => {
        action()
        setIsOpen(false)
    }

    const handleSelectNote = (id: string) => {
        setActiveNote(id)
        setIsOpen(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-fade-in">
            <div
                ref={containerRef}
                className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform scale-100 transition-transform"
            >
                <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
                    <Search className="text-zinc-400 mr-3" size={18} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search notes or type a command..."
                        className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 text-[15px] placeholder-zinc-400"
                    />
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">ESC</kbd>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query && noteResults.length === 0 && actionResults.length === 0 && labelResults.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-zinc-500">
                            No results found for "{query}"
                        </div>
                    )}

                    {actionResults.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-1 mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Actions</div>
                            {actionResults.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => handleSelectAction(action.action)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {action.icon}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-1">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {labelResults.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-1 mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Labels</div>
                            {labelResults.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => handleSelectAction(action.action)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800">
                                        {action.icon}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-1">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {noteResults.length > 0 && (
                        <div>
                            <div className="px-3 py-1 mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Notes</div>
                            {noteResults.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => handleSelectNote(note.id)}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5">
                                        <FileText size={14} />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{note.title || 'Untitled Note'}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-500 truncate">{note.preview || 'Empty note...'}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
