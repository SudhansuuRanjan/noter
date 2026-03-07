import { AlertTriangle, X } from 'lucide-react'
import { useNotes } from '../context/NotesContext'

export function DeleteModal() {
    const { state, deleteNote, setDeleteConfirm, filteredNotes } = useNotes()
    const { deleteConfirmId } = state

    if (!deleteConfirmId) return null

    const note = filteredNotes.find(n => n.id === deleteConfirmId)
        || { title: 'this note' } as any

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteConfirm(null)}
        >
            <div
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-6 w-80 shadow-2xl animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-500 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Delete Note</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">This action is irreversible</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <X size={15} />
                    </button>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                    Are you sure you want to delete{' '}
                    <span className="text-zinc-900 dark:text-zinc-200 font-medium">"{note.title}"</span>?
                    The file will be permanently removed.
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => deleteNote(deleteConfirmId)}
                        className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-red-600/20"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
