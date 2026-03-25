import { Star, Trash2, Pin, Link as LinkIcon, Copy } from 'lucide-react'
import { Note } from '../types/note'
import { useNotes } from '../context/NotesContext'
import { useState } from 'react'

interface NoteCardProps {
    note: Note
    isActive: boolean
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    } else if (days === 1) {
        return 'Yesterday'
    } else if (days < 7) {
        return `${days}d ago`
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
}

export function NoteCard({ note, isActive }: NoteCardProps) {
    const { state, setActiveNote, toggleStar, togglePin, setDeleteConfirm, ensureHistorySynced, cloneNote } = useNotes()
    const [isHovered, setIsHovered] = useState(false)

    const label = note.labelId ? state.labels.find(l => l.id === note.labelId) : null
    const showActions = isActive || isHovered
    const openNote = async () => {
        if (note.id === state.activeNoteId) return
        const canOpen = await ensureHistorySynced(note.id)
        if (canOpen) {
            setActiveNote(note.id)
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={`Open note ${note.title}`}
            onClick={openNote}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    void openNote()
                }
            }}
            className={`
        group relative px-3 py-3 border rounded-xl cursor-pointer transition-all duration-150 mb-1
        ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800/60'
                }
      `}
        >
            <div className="flex items-start justify-between gap-2">
                <div className='w-full'>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        {note.pinned && (
                            <Pin size={11} className="text-indigo-500 fill-indigo-500 flex-shrink-0" />
                        )}
                        {note.starred && !note.pinned && (
                            <Star size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                        <h3 className={`text-sm font-medium truncate ${isActive
                            ? 'text-indigo-700 dark:text-indigo-400'
                            : 'text-zinc-800 dark:text-zinc-200'
                            }`}>
                            {note.title}
                        </h3>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate leading-relaxed">
                        {note.preview || 'Empty note'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                        <div className='flex items-center gap-2'>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide whitespace-nowrap">
                                {formatDate(note.updatedAt)}
                            </p>
                            {label && (
                                <div
                                    className="px-1.5 py-0.5 rounded text-[9px] font-medium border truncate max-w-[120px] leading-none flex items-center"
                                    style={{
                                        backgroundColor: `${label.color}15`,
                                        color: label.color,
                                        borderColor: `${label.color}30`
                                    }}
                                    title={label.name}
                                >
                                    {label.name}
                                </div>
                            )}
                        </div>

                        <div className={`flex self-end items-center gap-0.5 flex-shrink-0 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(note.id)
                                }}
                                tabIndex={showActions ? 0 : -1}
                                aria-label={`Copy link id for ${note.title}`}
                                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-150"
                                title="Copy Note ID for linking"
                            >
                                <LinkIcon size={13} className="text-zinc-400" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePin(note.id) }}
                                tabIndex={showActions ? 0 : -1}
                                aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title} to top`}
                                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-150"
                                title={note.pinned ? 'Unpin' : 'Pin to top'}
                            >
                                <Pin
                                    size={13}
                                    className={note.pinned ? 'text-indigo-500 fill-indigo-500' : 'text-zinc-400'}
                                />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    cloneNote(note.id)
                                }}
                                tabIndex={showActions ? 0 : -1}
                                aria-label={`Duplicate ${note.title}`}
                                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-150"
                                title="Duplicate Note"
                            >
                                <Copy size={13} className="text-zinc-400" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleStar(note.id) }}
                                tabIndex={showActions ? 0 : -1}
                                aria-label={note.starred ? `Unstar ${note.title}` : `Star ${note.title}`}
                                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-150"
                                title={note.starred ? 'Unstar' : 'Star'}
                            >
                                <Star
                                    size={13}
                                    className={note.starred ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'}
                                />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(note.id) }}
                                tabIndex={showActions ? 0 : -1}
                                aria-label={`Delete ${note.title}`}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150"
                                title="Delete"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
