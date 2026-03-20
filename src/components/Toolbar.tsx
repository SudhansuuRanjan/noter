import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Edit2, Eye, Columns, Download, Trash2, Star, Save, Tag, Pin, History as HistoryIcon, PanelLeft, ExternalLink, Sparkles, FileText, Link2, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { ViewMode } from '../types/note'
import { HistoryModal } from './HistoryModal'

const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'edit', icon: <Edit2 size={14} />, label: 'Edit' },
    { mode: 'split', icon: <Columns size={14} />, label: 'Split' },
    { mode: 'preview', icon: <Eye size={14} />, label: 'Preview' }
]

export function Toolbar() {
    const { state, activeNote, setViewMode, toggleStar, togglePin, setDeleteConfirm, updateNoteLabel, toggleSidebar, saveVersionHistory } = useNotes()
    const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false)
    const [linkSearchQuery, setLinkSearchQuery] = useState('')
    const labelMenuRef = useRef<HTMLDivElement>(null)
    const linkMenuRef = useRef<HTMLDivElement>(null)

    const exportNote = useCallback(async (id: string, title: string) => {
        await window.electronAPI.exportNote(id, title)
    }, [])

    const exportPDF = useCallback(async (id: string, title: string) => {
        await window.electronAPI.exportPDF(id, title)
    }, [])

    const activeLabel = activeNote?.labelId ? state.labels.find(l => l.id === activeNote.labelId) : null
    const historySyncLabel = state.historySyncState === 'synced'
        ? 'History synced'
        : state.historySyncState === 'syncing'
            ? 'Syncing history…'
            : 'History not synced'

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (labelMenuRef.current && !labelMenuRef.current.contains(event.target as Node)) {
                setIsLabelMenuOpen(false)
            }
            if (linkMenuRef.current && !linkMenuRef.current.contains(event.target as Node)) {
                setIsLinkMenuOpen(false)
                setTimeout(() => setLinkSearchQuery(''), 200) // Reset search after menu closes
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!activeNote) return null

    const isMac = window?.electronAPI?.platform === 'darwin'
    const paddingLeftClass = (!state.isSidebarOpen && isMac) ? 'pl-20' : 'pl-4'

    return (
        <div className={`h-11 gap-1 flex-shrink-0 flex items-center justify-between pr-4 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-sm transition-all duration-200 relative z-30 ${paddingLeftClass}`} style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            {/* Left: Note title + save indicator */}
            <div className="flex items-center gap-3 min-w-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-md transition-colors ${state.isSidebarOpen ? 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800' : 'text-zinc-800 bg-zinc-200 dark:text-zinc-200 dark:bg-zinc-700'}`}
                    title="Toggle Sidebar"
                >
                    <PanelLeft size={16} />
                </button>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700/60" />
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate max-w-xs">
                    {activeNote.title}
                </h2>
                {state.isSaving && (
                    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs">
                        <Save size={11} className="animate-pulse" />
                        <span>Saving…</span>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {/* Center: View mode toggle */}
                <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700/40" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    {viewModes.map(({ mode, icon, label }) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${state.viewMode === mode
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            {icon}
                            {mode === state.viewMode && label}
                        </button>
                    ))}
                </div>

                <div className="relative" ref={labelMenuRef}>
                    <button
                        onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeLabel
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        title="Assign Label"
                    >
                        <Tag size={13} className={activeLabel ? '' : ''} style={activeLabel ? { color: activeLabel.color } : {}} />
                        {activeLabel && (
                            <span className="truncate max-w-[100px]" style={{ color: activeLabel.color }}>
                                {activeLabel.name}
                            </span>
                        )}
                    </button>

                    {isLabelMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 max-w-[200px] w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 overflow-hidden">
                            <div className="px-3 py-1.5 mb-1 border-b border-zinc-100 dark:border-zinc-800/60">
                                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Assign Label</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => { updateNoteLabel(activeNote.id, undefined); setIsLabelMenuOpen(false) }}
                                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${!activeNote.labelId ? 'bg-zinc-50 dark:bg-zinc-800/30' : ''}`}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                    <span className="text-zinc-600 dark:text-zinc-400">None</span>
                                </button>
                                {state.labels.map(label => (
                                    <button
                                        key={label.id}
                                        onClick={() => { updateNoteLabel(activeNote.id, label.id); setIsLabelMenuOpen(false) }}
                                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${activeNote.labelId === label.id ? 'bg-zinc-50 dark:bg-zinc-800/30 font-medium' : ''}`}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                        <span className="text-zinc-700 dark:text-zinc-300 truncate">{label.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700/50 mx-1" />

                <button
                    onClick={() => saveVersionHistory()}
                    disabled={state.historySyncState === 'syncing' || state.historySyncState === 'synced'}
                    className={`flex text-nowrap items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${state.historySyncState === 'synced'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                        : state.historySyncState === 'syncing'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 cursor-wait'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                        }`}
                    title="Save current content to version history"
                >
                    {state.historySyncState === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <HistoryIcon size={14} />}
                    {state.historySyncState === 'synced' ? 'History Saved' : 'Save Version'}
                </button>

                {(state.viewMode === 'edit' || state.viewMode === 'split') && (
                    <div className="relative" ref={linkMenuRef}>
                        <button
                            onClick={() => setIsLinkMenuOpen(!isLinkMenuOpen)}
                            className={`p-2 rounded-lg transition-all duration-200 ${isLinkMenuOpen
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            title="Insert Link to Note"
                        >
                            <Link2 size={15} />
                        </button>

                        {isLinkMenuOpen && (
                            <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 overflow-hidden">
                                <div className="px-3 py-2 mb-1 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Search notes..."
                                            value={linkSearchQuery}
                                            onChange={(e) => setLinkSearchQuery(e.target.value)}
                                            className="w-full pl-6 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {state.notes
                                        .filter(n => n.id !== activeNote.id)
                                        .filter(n => linkSearchQuery === '' ||
                                            n.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                                            n.preview.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                                        .map(note => (
                                            <button
                                                key={note.id}
                                                onClick={() => {
                                                    const markdownLink = `[${note.title}](noteref://${note.id})`
                                                    window.dispatchEvent(new CustomEvent('insert-note-link', { detail: markdownLink }))
                                                    setIsLinkMenuOpen(false)
                                                    setTimeout(() => setLinkSearchQuery(''), 200)
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800/30 last:border-0"
                                            >
                                                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{note.title}</span>
                                                <span className="text-zinc-400 dark:text-zinc-500 text-[10px] truncate">{note.preview || 'No content...'}</span>
                                            </button>
                                        ))}
                                    {state.notes
                                        .filter(n => n.id !== activeNote.id)
                                        .filter(n => linkSearchQuery === '' ||
                                            n.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                                            n.preview.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                                        .length === 0 && (
                                            <div className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                                                {linkSearchQuery ? 'No matching notes' : 'No other notes found'}
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => togglePin(activeNote.id)}
                    className={`p-2 rounded-lg transition-all duration-200 ${activeNote.pinned
                        ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                    title={activeNote.pinned ? 'Unpin note' : 'Pin note to top'}
                >
                    <Pin size={15} className={activeNote.pinned ? 'fill-indigo-500' : ''} />
                </button>

                <button
                    onClick={() => toggleStar(activeNote.id)}
                    className={`p-2 rounded-lg transition-all duration-200 ${activeNote.starred
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-400/10'
                        : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                    title={activeNote.starred ? 'Unstar note' : 'Star note'}
                >
                    <Star size={15} className={activeNote.starred ? 'fill-amber-500' : ''} />
                </button>

                <button
                    onClick={() => exportNote(activeNote.id, activeNote.title)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                    title="Export note"
                >
                    <Download size={15} />
                </button>

                {state.viewMode === 'preview' && (
                    <button
                        onClick={() => exportPDF(activeNote.id, activeNote.title)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200"
                        title="Export as PDF"
                    >
                        <FileText size={15} />
                    </button>
                )}

                <button
                    onClick={() => window.electronAPI.openInNewWindow(activeNote.id)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200"
                    title="Open in New Window"
                >
                    <ExternalLink size={15} />
                </button>

                {(state.viewMode === 'edit' || state.viewMode === 'split') && (
                    <button
                        onClick={() => window.dispatchEvent(new Event('open-ai-command'))}
                        className="p-2 rounded-lg text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200"
                        title="AI Assistant"
                    >
                        <Sparkles size={15} />
                    </button>
                )}

                <button
                    onClick={() => setShowHistory(true)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200"
                    title="View Revision History"
                >
                    <HistoryIcon size={15} />
                </button>

                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700/50 mx-1" />

                <button
                    onClick={() => setDeleteConfirm(activeNote.id)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                    title="Delete note"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {showHistory && (
                <HistoryModal note={activeNote} onClose={() => setShowHistory(false)} />
            )}
        </div>
    )
}
