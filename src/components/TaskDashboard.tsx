import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, Circle, FileText, Loader2 } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { withViewTransition } from '../utils/transition'
import { useHotkey } from '@tanstack/react-hotkeys'

interface TaskDashboardProps {
    isOpen: boolean
    onClose: () => void
}

interface TaskItem {
    id: string // noteId-lineNumber
    noteId: string
    noteTitle: string
    lineIndex: number
    content: string
    isCompleted: boolean
}

export function TaskDashboard({ isOpen, onClose }: TaskDashboardProps) {
    const { state, updateNote, setActiveNote, ensureHistorySynced } = useNotes()
    const [mounted, setMounted] = useState(false)
    const [updatingTasks, setUpdatingTasks] = useState<Record<string, boolean>>({})

    useEffect(() => {
        setMounted(true)
    }, [])

    useHotkey('Escape', () => {
        withViewTransition(onClose)
    }, { enabled: isOpen && mounted })

    // Extract tasks
    const tasks = useMemo(() => {
        const extracted: TaskItem[] = []
        state.notes.forEach(note => {
            const lines = note.content.split('\n')
            lines.forEach((line, index) => {
                const match = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.*)$/)
                if (match) {
                    extracted.push({
                        id: `${note.id}-${index}`,
                        noteId: note.id,
                        noteTitle: note.title,
                        lineIndex: index,
                        content: match[3],
                        isCompleted: match[2].toLowerCase() === 'x'
                    })
                }
            })
        })
        return extracted
    }, [state.notes])

    const groupedTasks = useMemo(() => {
        const grouped: Record<string, TaskItem[]> = {}
        // Sort tasks: incomplete first
        const sorted = [...tasks].sort((a, b) => {
            if (a.isCompleted === b.isCompleted) return 0
            return a.isCompleted ? 1 : -1
        })

        sorted.forEach(t => {
            if (!grouped[t.noteId]) grouped[t.noteId] = []
            grouped[t.noteId].push(t)
        })
        return grouped
    }, [tasks])

    const toggleTask = async (task: TaskItem) => {
        if (updatingTasks[task.id]) return

        setUpdatingTasks(prev => ({ ...prev, [task.id]: true }))

        try {
            const note = state.notes.find(n => n.id === task.noteId)
            if (!note) return

            const lines = note.content.split('\n')
            const line = lines[task.lineIndex]
            if (!line) return

            // Find the specific markdown checkbox structure and replace its inner char
            const updatedLine = line.replace(/^(\s*-\s+\[)([ xX])(\])/, (_, prefix, current, suffix) => {
                const newValue = current === ' ' ? 'x' : ' '
                return `${prefix}${newValue}${suffix}`
            })

            lines[task.lineIndex] = updatedLine
            updateNote(note.id, lines.join('\n'))

            // Small delay to prevent race conditions and show the loading state nicely
            await new Promise(resolve => setTimeout(resolve, 400))
        } finally {
            setUpdatingTasks(prev => {
                const next = { ...prev }
                delete next[task.id]
                return next
            })
        }
    }

    if (!mounted || !isOpen) return null

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.isCompleted).length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0 cursor-pointer" onClick={() => withViewTransition(onClose)} />

            <div
                className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tasks Dashboard</h2>
                                <p className="text-[10px] text-zinc-500 font-medium">{completedTasks} of {totalTasks} completed</p>
                            </div>
                        </div>
                        <button
                            onClick={() => withViewTransition(onClose)}
                            className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {Object.keys(groupedTasks).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <CheckCircle2 size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No tasks found</p>
                            <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Add tasks using "- [ ]" in your notes</p>
                        </div>
                    ) : (
                        Object.entries(groupedTasks).map(([noteId, noteTasks]) => (
                            <div key={noteId} className="mb-4">
                                <button
                                    onClick={async () => {
                                        const canOpen = await ensureHistorySynced()
                                        if (canOpen) {
                                            setActiveNote(noteId)
                                            withViewTransition(onClose)
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group w-full text-left"
                                >
                                    <FileText size={12} className="group-hover:text-indigo-500" />
                                    {noteTasks[0].noteTitle}
                                </button>
                                <div className="flex flex-col gap-1 px-2">
                                    {noteTasks.map(task => (
                                        <div
                                            onClick={() => !updatingTasks[task.id] && toggleTask(task)}
                                            key={task.id}
                                            className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all ${updatingTasks[task.id] ? 'opacity-50 cursor-wait pointer-events-none' : 'cursor-pointer'} ${task.isCompleted
                                                    ? 'bg-zinc-50/50 dark:bg-zinc-900/50 border-transparent opacity-60'
                                                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30'
                                                }`}
                                        >
                                            <button
                                                className={`shrink-0 transition-colors ${task.isCompleted
                                                        ? 'text-emerald-500 hover:text-emerald-600'
                                                        : 'text-zinc-300 dark:text-zinc-600 hover:text-indigo-500'
                                                    }`}
                                            >
                                                {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                            </button>
                                            <span className={`flex-1 text-sm leading-relaxed ${task.isCompleted
                                                    ? 'text-zinc-400 dark:text-zinc-500 line-through'
                                                    : 'text-zinc-700 dark:text-zinc-300 font-medium'
                                                }`}>
                                                {task.content}
                                            </span>
                                            {updatingTasks[task.id] && (
                                                <Loader2 size={14} className="text-indigo-500 animate-spin" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
