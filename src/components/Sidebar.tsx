import React, { useState } from 'react'
import { Search, Plus, Star, FileText, X, ChevronRight, ChevronDown, Edit2, Check, Calendar, HelpCircle, ArrowUpDown, SortAsc, SortDesc, Sparkles, Settings, FileEdit } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { NoteCard } from './NoteCard'
import { ThemeToggle } from './ThemeToggle'
import { HelpModal } from './HelpModal'
import { AISettings } from './AISettings'
import { useEffect } from 'react'

export function Sidebar() {
    const {
        state,
        filteredNotes,
        createNote,
        importNotes,
        setFilter,
        setSearch,
        setSelectedLabelId,
        openFolder,
        openDailyNote,
        createLabel,
        updateLabel,
        deleteLabel,
        setSelectedTag,
        setSortBy,
        setSortOrder
    } = useNotes()

    const [isLabelsExpanded, setIsLabelsExpanded] = useState(false)
    const [isTagsExpanded, setIsTagsExpanded] = useState(false)
    const [isHelpOpen, setIsHelpOpen] = useState(false)
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false)
    const [isCreatingLabel, setIsCreatingLabel] = useState(false)
    const [newLabelName, setNewLabelName] = useState('')
    const [newLabelColor, setNewLabelColor] = useState('#3b82f6') // default blue

    const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
    const [editLabelName, setEditLabelName] = useState('')
    const [editLabelColor, setEditLabelColor] = useState('#3b82f6')

    useEffect(() => {
        const handleOpenSettings = () => setIsAISettingsOpen(true)
        const handleOpenHelp = () => setIsHelpOpen(true)

        window.addEventListener('open-settings', handleOpenSettings)
        window.addEventListener('open-help', handleOpenHelp)

        return () => {
            window.removeEventListener('open-settings', handleOpenSettings)
            window.removeEventListener('open-help', handleOpenHelp)
        }
    }, [])

    const handleCreateLabel = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newLabelName.trim()) {
            await createLabel(newLabelName.trim(), newLabelColor)
            setNewLabelName('')
            setIsCreatingLabel(false)
        }
    }

    const startEditingLabel = (label: { id: string, name: string, color: string }) => {
        setEditingLabelId(label.id)
        setEditLabelName(label.name)
        setEditLabelColor(label.color)
    }

    const handleUpdateLabel = async (e: React.FormEvent, id: string) => {
        e.preventDefault()
        if (editLabelName.trim()) {
            await updateLabel(id, editLabelName.trim(), editLabelColor)
            setEditingLabelId(null)
        }
    }

    // Extract unique tags from all notes
    const allTags = Array.from(new Set(state.notes.flatMap(n => n.tags || []))).sort()

    return (
        <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-900/50">
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
                            onClick={() => setIsAISettingsOpen(true)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                            title="AI Settings"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="p-2 rounded-lg text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all duration-200"
                            title="Help Guide"
                        >
                            <HelpCircle size={15} />
                        </button>
                    </div>
                </div>

                {/* New Note + Daily Note + Import */}
                <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <button
                        onClick={createNote}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95"
                        title="Create regular note"
                    >
                        <FileEdit size={14} />
                        New Note
                    </button>
                    <button
                        onClick={openDailyNote}
                        className="py-2 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all duration-200 active:scale-95"
                        title="Daily Note"
                    >
                        <Calendar size={14} />
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
                        className="w-full pl-8 pr-10 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-500/20 transition-all duration-200"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                            <span className="text-[12px] leading-none mb-[1px]">⌘</span>
                            <span>K</span>
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Filter tabs + Sort */}
            <div className="px-4 mb-3 flex items-center justify-between">
                <div className="flex gap-1">
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
                                <span className={`ml-1 text-xs ${state.filterMode === f ? 'text-indigo-600 dark:text-indigo-300' : 'text-zinc-500 dark:text-zinc-500'}`}>{state.notes.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <select
                        value={state.sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-[11px] text-zinc-500 dark:text-zinc-400 border-none outline-none cursor-pointer hover:text-indigo-500 transition-colors"
                        title="Sort by"
                    >
                        <option value="updatedAt">Date Updated</option>
                        <option value="createdAt">Date Created</option>
                        <option value="title">Name</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(state.sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        title={`Sort ${state.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                    >
                        {state.sortOrder === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
                    </button>
                </div>
            </div>

            {/* Labels Section */}
            <div className="px-4 mb-3">
                <div className="flex items-center justify-between mb-1 group">
                    <button
                        onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
                        className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        {isLabelsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Labels
                    </button>
                    <button
                        onClick={() => {
                            if (!isLabelsExpanded) setIsLabelsExpanded(true)
                            setIsCreatingLabel(!isCreatingLabel)
                        }}
                        className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${isCreatingLabel ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        title="Create Label"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                {isLabelsExpanded && (
                    <>
                        {isCreatingLabel && (
                            <form onSubmit={handleCreateLabel} className="flex items-center gap-1 mb-2">
                                <input
                                    type="color"
                                    value={newLabelColor}
                                    onChange={(e) => setNewLabelColor(e.target.value)}
                                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                                    title="Label Color"
                                />
                                <input
                                    type="text"
                                    placeholder="Label name..."
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    className="flex-1 py-1 px-2 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-400"
                                    autoFocus
                                />
                            </form>
                        )}

                        <div className="flex flex-col gap-0.5 mt-1">
                            {state.labels.map(label => (
                                <div key={label.id} className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                                    {editingLabelId === label.id ? (
                                        <form onSubmit={(e) => handleUpdateLabel(e, label.id)} className="flex items-center gap-1 flex-1">
                                            <input
                                                type="color"
                                                value={editLabelColor}
                                                onChange={(e) => setEditLabelColor(e.target.value)}
                                                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={editLabelName}
                                                onChange={(e) => setEditLabelName(e.target.value)}
                                                className="flex-1 py-0.5 px-1.5 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-400"
                                                autoFocus
                                            />
                                            <button type="submit" className="p-1 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 rounded">
                                                <Check size={12} />
                                            </button>
                                        </form>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setSelectedLabelId(state.selectedLabelId === label.id ? null : label.id)}
                                                className={`flex items-center gap-2 flex-1 text-left text-xs ${state.selectedLabelId === label.id ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                                <span className="truncate">{label.name}</span>
                                            </button>
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                                <button
                                                    onClick={() => startEditingLabel(label)}
                                                    className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors"
                                                    title="Edit label"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => deleteLabel(label.id)}
                                                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                                    title="Delete label"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {state.labels.length === 0 && !isCreatingLabel && (
                                <p className="text-xs text-zinc-400 dark:text-zinc-600 px-2 py-1">No labels yet</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Tags Section */}
            <div className="px-4 mb-3">
                <div className="flex items-center justify-between mb-1 group">
                    <button
                        onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                        className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        {isTagsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Tags
                    </button>
                </div>
                {isTagsExpanded && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(state.selectedTag === tag ? null : tag)}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${state.selectedTag === tag ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                            >
                                {tag}
                            </button>
                        ))}
                        {allTags.length === 0 && (
                            <p className="text-xs text-zinc-400 dark:text-zinc-600 px-1 py-1">No tags found in notes</p>
                        )}
                    </div>
                )}
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {state.isLoading ? (
                    <div className="flex flex-col gap-2 px-4 mt-2">
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

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            <AISettings isOpen={isAISettingsOpen} onClose={() => setIsAISettingsOpen(false)} />
        </div>
    )
}
