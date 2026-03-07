import { Star, Trash2 } from 'lucide-react'
import { Note } from '../types/note'
import { useNotes } from '../context/NotesContext'

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
    const { state, setActiveNote, toggleStar, setDeleteConfirm } = useNotes()

    const label = note.labelId ? state.labels.find(l => l.id === note.labelId) : null

    return (
        <div
            onClick={() => setActiveNote(note.id)}
            className={`
        group relative px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 mb-1
        ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                }
      `}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        {note.starred && (
                            <Star size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                        <h3 className={`text-sm font-medium truncate ${isActive
                            ? 'text-indigo-700 dark:text-zinc-50'
                            : 'text-zinc-800 dark:text-zinc-200'
                            }`}>
                            {note.title}
                        </h3>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate leading-relaxed">
                        {note.preview || 'Empty note'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
                            {formatDate(note.updatedAt)}
                        </p>
                        {label && (
                            <div
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium border"
                                style={{
                                    backgroundColor: `${label.color}15`,
                                    color: label.color,
                                    borderColor: `${label.color}30`
                                }}
                            >
                                {label.name}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(note.id) }}
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
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    )
}
