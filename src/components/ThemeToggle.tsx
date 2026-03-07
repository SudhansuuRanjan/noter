import { useNotes } from '../context/NotesContext'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
    const { state, toggleTheme } = useNotes()

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200"
            title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {state.theme === 'dark'
                ? <Sun size={16} className="text-amber-400" />
                : <Moon size={16} className="text-indigo-500" />
            }
        </button>
    )
}
