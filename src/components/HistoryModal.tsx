import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, History, RotateCcw } from 'lucide-react'
import { Note } from '../types/note'
import { useNotes } from '../context/NotesContext'
import { withViewTransition } from '../utils/transition'
import { useHotkey } from '@tanstack/react-hotkeys'

interface HistoryEntry {
    timestamp: number
    preview: string
    path: string
}

interface HistoryModalProps {
    note: Note
    onClose: () => void
}

export function HistoryModal({ note, onClose }: HistoryModalProps) {
    const { updateNote } = useNotes()
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedRevision, setSelectedRevision] = useState<HistoryEntry | null>(null)
    const [revisionContent, setRevisionContent] = useState<string | null>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await window.electronAPI.getHistory(note.id)
            setHistory(data)
            setIsLoading(false)
        }
        fetchHistory()
    }, [note.id])

    useHotkey('Escape', () => {
        withViewTransition(onClose)
    })

    const fetchRevisionContent = async (entry: HistoryEntry) => {
        setSelectedRevision(entry)
        const content = await window.electronAPI.getRevision(entry.path)
        setRevisionContent(content)
    }

    const restoreRevision = () => {
        if (revisionContent !== null) {
            withViewTransition(() => {
                updateNote(note.id, revisionContent)
                onClose()
            })
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    }

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in py-10"
            onClick={() => withViewTransition(onClose)}
        >
            <div 
                className="flex flex-col w-[800px] h-full max-h-[80vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 translate-y-0 scale-100 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <History size={18} className="text-indigo-500" />
                        <h2 className="font-semibold text-sm">Revision History</h2>
                        <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full ml-2 truncate max-w-[200px]">{note.title}</span>
                    </div>
                    <button
                        onClick={() => withViewTransition(onClose)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left sidebar: Revision List */}
                    <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50">
                        {isLoading ? (
                            <div className="p-6 text-center text-sm text-zinc-500">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="p-6 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
                                <Clock size={20} className="text-zinc-400" />
                                No revisions found for this note.
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {history.map(entry => (
                                    <button
                                        key={entry.timestamp}
                                        onClick={() => withViewTransition(() => fetchRevisionContent(entry))}
                                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${selectedRevision?.timestamp === entry.timestamp
                                            ? 'bg-indigo-100 dark:bg-indigo-500/20 ring-1 ring-indigo-300 dark:ring-indigo-500/50'
                                            : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                            <Clock size={12} className={selectedRevision?.timestamp === entry.timestamp ? 'text-indigo-500' : 'text-zinc-500'} />
                                            {formatDate(entry.timestamp)}
                                        </div>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate mt-0.5">{entry.preview}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side: Revision Preview */}
                    <div className="w-2/3 flex flex-col bg-white dark:bg-zinc-900">
                        {selectedRevision ? (
                            <>
                                <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-medium">
                                    <span>Viewing backup from {formatDate(selectedRevision.timestamp)}</span>
                                    <button
                                        onClick={restoreRevision}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                                    >
                                        <RotateCcw size={13} />
                                        Restore this version
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 md:p-6 text-sm text-zinc-800 dark:text-zinc-300 font-mono whitespace-pre-wrap">
                                    {revisionContent === null ? (
                                        <div className="animate-pulse flex items-center gap-2 text-zinc-400">Loading content...</div>
                                    ) : (
                                        revisionContent
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                                <History size={48} strokeWidth={1} className="mb-4 text-zinc-200 dark:text-zinc-800" />
                                <p className="text-sm">Select a revision to view its contents</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
