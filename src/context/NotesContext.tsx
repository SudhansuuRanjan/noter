import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { Note, Label, ViewMode, FilterMode } from '../types/note'

interface NotesState {
    notes: Note[]
    labels: Label[]
    activeNoteId: string | null
    viewMode: ViewMode
    filterMode: FilterMode
    searchQuery: string
    selectedLabelId: string | null
    selectedTag: string | null
    theme: 'dark' | 'light'
    isLoading: boolean
    isSaving: boolean
    deleteConfirmId: string | null
    isSidebarOpen: boolean
}

type Action =
    | { type: 'SET_NOTES'; notes: Note[] }
    | { type: 'SET_ACTIVE'; id: string | null }
    | { type: 'SET_VIEW_MODE'; mode: ViewMode }
    | { type: 'SET_FILTER'; filter: FilterMode }
    | { type: 'SET_SEARCH'; query: string }
    | { type: 'SET_SELECTED_LABEL'; labelId: string | null }
    | { type: 'SET_SELECTED_TAG'; tag: string | null }
    | { type: 'SET_THEME'; theme: 'dark' | 'light' }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_SAVING'; saving: boolean }
    | { type: 'SET_DELETE_CONFIRM'; id: string | null }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'UPDATE_NOTE'; id: string; content: string; updatedAt: string }
    | { type: 'REMOVE_NOTE'; id: string }
    | { type: 'TOGGLE_STAR'; id: string; starred: boolean }
    | { type: 'TOGGLE_PIN'; id: string; pinned: boolean }
    | { type: 'UPDATE_NOTE_LABEL'; id: string; labelId: string | undefined }
    | { type: 'ADD_NOTE'; note: Note }
    | { type: 'SET_LABELS'; labels: Label[] }
    | { type: 'ADD_LABEL'; label: Label }
    | { type: 'UPDATE_LABEL'; label: Label }
    | { type: 'REMOVE_LABEL'; id: string }

function notesReducer(state: NotesState, action: Action): NotesState {
    switch (action.type) {
        case 'SET_NOTES':
            return {
                ...state,
                notes: action.notes.sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1
                    if (!a.pinned && b.pinned) return 1
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                }),
                isLoading: false
            }
        case 'SET_LABELS':
            return { ...state, labels: action.labels }
        case 'SET_ACTIVE':
            return { ...state, activeNoteId: action.id }
        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.mode }
        case 'SET_FILTER':
            return { ...state, filterMode: action.filter }
        case 'SET_SEARCH':
            return { ...state, searchQuery: action.query }
        case 'SET_SELECTED_LABEL':
            return { ...state, selectedLabelId: action.labelId }
        case 'SET_SELECTED_TAG':
            return { ...state, selectedTag: action.tag }
        case 'SET_THEME':
            return { ...state, theme: action.theme }
        case 'SET_LOADING':
            return { ...state, isLoading: action.loading }
        case 'SET_SAVING':
            return { ...state, isSaving: action.saving }
        case 'SET_DELETE_CONFIRM':
            return { ...state, deleteConfirmId: action.id }
        case 'TOGGLE_SIDEBAR':
            return { ...state, isSidebarOpen: !state.isSidebarOpen }
        case 'UPDATE_NOTE': {
            const tagsMatch = Array.from(action.content.matchAll(/(?:^|\s)(#[a-zA-Z0-9_-]+)/g))
            const tags = tagsMatch.length > 0 ? Array.from(new Set(tagsMatch.map(m => m[1]))) : []

            return {
                ...state,
                isSaving: false,
                notes: state.notes.map(n =>
                    n.id === action.id
                        ? {
                            ...n,
                            content: action.content,
                            updatedAt: action.updatedAt,
                            title: extractTitle(action.content),
                            preview: extractPreview(action.content),
                            tags
                        }
                        : n
                ).sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1
                    if (!a.pinned && b.pinned) return 1
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                })
            }
        }
        case 'REMOVE_NOTE':
            return {
                ...state,
                notes: state.notes.filter(n => n.id !== action.id),
                activeNoteId: state.activeNoteId === action.id ? null : state.activeNoteId,
                deleteConfirmId: null
            }
        case 'TOGGLE_STAR':
            return {
                ...state,
                notes: state.notes.map(n => n.id === action.id ? { ...n, starred: action.starred } : n)
            }
        case 'TOGGLE_PIN':
            return {
                ...state,
                notes: state.notes.map(n => n.id === action.id ? { ...n, pinned: action.pinned } : n)
                    .sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1
                        if (!a.pinned && b.pinned) return 1
                        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    })
            }
        case 'UPDATE_NOTE_LABEL':
            return {
                ...state,
                notes: state.notes.map(n => n.id === action.id ? { ...n, labelId: action.labelId } : n)
            }
        case 'ADD_NOTE':
            return {
                ...state,
                notes: [action.note, ...state.notes].sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1
                    if (!a.pinned && b.pinned) return 1
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                }),
                activeNoteId: action.note.id
            }
        case 'ADD_LABEL':
            return {
                ...state,
                labels: [...state.labels, action.label]
            }
        case 'UPDATE_LABEL':
            return {
                ...state,
                labels: state.labels.map(l => l.id === action.label.id ? action.label : l)
            }
        case 'REMOVE_LABEL':
            return {
                ...state,
                labels: state.labels.filter(l => l.id !== action.id),
                selectedLabelId: state.selectedLabelId === action.id ? null : state.selectedLabelId,
                notes: state.notes.map(n => n.labelId === action.id ? { ...n, labelId: undefined } : n)
            }
        default:
            return state
    }
}

function extractTitle(content: string): string {
    const lines = content.split('\n').filter(l => l.trim())
    const titleLine = lines[0] || 'Untitled'
    return titleLine.replace(/^#+\s*/, '').trim() || 'Untitled'
}

function extractPreview(content: string): string {
    const lines = content.split('\n').filter(l => l.trim())
    return lines.slice(1).join(' ').replace(/[#*`_\[\]]/g, '').slice(0, 120)
}

const initialState: NotesState = {
    notes: [],
    labels: [],
    activeNoteId: null,
    viewMode: 'split',
    filterMode: 'all',
    searchQuery: '',
    selectedLabelId: null,
    selectedTag: null,
    theme: (localStorage.getItem('noter-theme') as 'dark' | 'light') || 'dark',
    isLoading: true,
    isSaving: false,
    deleteConfirmId: null,
    isSidebarOpen: true
}

interface NotesContextValue {
    state: NotesState
    activeNote: Note | undefined
    filteredNotes: Note[]
    loadNotes: () => Promise<void>
    createNote: () => Promise<void>
    openDailyNote: () => Promise<void>
    updateNote: (id: string, content: string) => void
    deleteNote: (id: string) => Promise<void>
    toggleStar: (id: string) => Promise<void>
    togglePin: (id: string) => Promise<void>
    importNotes: () => Promise<void>
    exportNote: (id: string, title: string) => Promise<void>
    setActiveNote: (id: string | null) => void
    setViewMode: (mode: ViewMode) => void
    setFilter: (filter: FilterMode) => void
    setSearch: (query: string) => void
    setSelectedLabelId: (id: string | null) => void
    setSelectedTag: (tag: string | null) => void
    toggleTheme: () => void
    toggleSidebar: () => void
    setDeleteConfirm: (id: string | null) => void
    openFolder: () => void
    createLabel: (name: string, color: string) => Promise<void>
    updateLabel: (id: string, name: string, color: string) => Promise<void>
    deleteLabel: (id: string) => Promise<void>
    updateNoteLabel: (id: string, labelId: string | undefined) => Promise<void>
    openNoteByTitle: (title: string) => Promise<void>
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(notesReducer, initialState)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Apply theme to document
    useEffect(() => {
        const html = document.documentElement
        if (state.theme === 'dark') {
            html.classList.add('dark')
            document.getElementById('hljs-theme')?.setAttribute('href',
                'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css')
        } else {
            html.classList.remove('dark')
            document.getElementById('hljs-theme')?.setAttribute('href',
                'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css')
        }
        localStorage.setItem('noter-theme', state.theme)
    }, [state.theme])

    const loadNotes = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', loading: true })
        const notes = await window.electronAPI.listNotes()
        dispatch({ type: 'SET_NOTES', notes })
        const labels = await window.electronAPI.listLabels()
        dispatch({ type: 'SET_LABELS', labels })
    }, [])

    useEffect(() => {
        loadNotes().then(() => {
            const params = new URLSearchParams(window.location.search)
            const id = params.get('id')
            if (id) {
                dispatch({ type: 'SET_ACTIVE', id })
            }
        })
    }, [loadNotes])

    const createNote = useCallback(async () => {
        const result = await window.electronAPI.createNote()
        const note: Note = {
            id: result.id,
            title: 'New Note',
            preview: 'Start writing here...',
            content: result.content,
            starred: false,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            filePath: ''
        }
        dispatch({ type: 'ADD_NOTE', note })
    }, [])

    const openDailyNote = useCallback(async () => {
        const todayString = new Date().toISOString().split('T')[0]
        const existingNote = state.notes.find(n => n.title === todayString)

        // Ensure "Journal" label exists
        let journalLabel = state.labels.find(l => l.name.toLowerCase() === 'journal')
        if (!journalLabel) {
            journalLabel = await window.electronAPI.createLabel('Journal', '#10b981')
            dispatch({ type: 'ADD_LABEL', label: journalLabel })
        }

        if (existingNote) {
            dispatch({ type: 'SET_ACTIVE', id: existingNote.id })
            // Auto apply journal label if missing
            if (existingNote.labelId !== journalLabel.id) {
                await window.electronAPI.updateNoteLabel(existingNote.id, journalLabel.id)
                dispatch({ type: 'UPDATE_NOTE_LABEL', id: existingNote.id, labelId: journalLabel.id })
            }
        } else {
            const result = await window.electronAPI.createNote()
            const content = `# ${todayString}\n\n`
            await window.electronAPI.writeNote(result.id, content)
            await window.electronAPI.updateNoteLabel(result.id, journalLabel.id)

            const note: Note = {
                id: result.id,
                title: todayString,
                preview: '',
                content: content,
                starred: false,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                filePath: '',
                labelId: journalLabel.id
            }
            dispatch({ type: 'ADD_NOTE', note })
            dispatch({ type: 'SET_ACTIVE', id: note.id })
        }
    }, [state.notes, state.labels])

    const openNoteByTitle = useCallback(async (title: string) => {
        const cleanTitle = title.trim()
        const existingNote = state.notes.find(n => n.title.toLowerCase() === cleanTitle.toLowerCase())

        if (existingNote) {
            dispatch({ type: 'SET_ACTIVE', id: existingNote.id })
            return
        }

        // Note doesn't exist, create it
        const result = await window.electronAPI.createNote()
        const content = `# ${cleanTitle}\n\n`
        await window.electronAPI.writeNote(result.id, content)

        const note = {
            id: result.id,
            title: cleanTitle,
            preview: '',
            content,
            starred: false,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            filePath: '',
            pinned: false,
            tags: []
        }
        dispatch({ type: 'ADD_NOTE', note })
    }, [state.notes])

    const updateNote = useCallback((id: string, content: string) => {
        dispatch({ type: 'SET_SAVING', saving: true })
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
            const result = await window.electronAPI.writeNote(id, content)
            dispatch({ type: 'UPDATE_NOTE', id, content, updatedAt: result.updatedAt })
        }, 800)
    }, [])

    const deleteNote = useCallback(async (id: string) => {
        await window.electronAPI.deleteNote(id)
        dispatch({ type: 'REMOVE_NOTE', id })
    }, [])

    const toggleStar = useCallback(async (id: string) => {
        const starred = await window.electronAPI.starNote(id)
        dispatch({ type: 'TOGGLE_STAR', id, starred })
    }, [])

    const togglePin = useCallback(async (id: string) => {
        const pinned = await window.electronAPI.togglePin(id)
        dispatch({ type: 'TOGGLE_PIN', id, pinned })
    }, [])

    const importNotes = useCallback(async () => {
        const ids = await window.electronAPI.importNotes()
        if (ids && ids.length > 0) {
            await loadNotes()
        }
    }, [loadNotes])

    const exportNote = useCallback(async (id: string, title: string) => {
        await window.electronAPI.exportNote(id, title)
    }, [])

    const setActiveNote = useCallback((id: string | null) => {
        dispatch({ type: 'SET_ACTIVE', id })
    }, [])

    const toggleSidebar = useCallback(() => {
        dispatch({ type: 'TOGGLE_SIDEBAR' })
    }, [])

    const setViewMode = useCallback((mode: ViewMode) => {
        dispatch({ type: 'SET_VIEW_MODE', mode })
    }, [])

    const setFilter = useCallback((filter: FilterMode) => {
        dispatch({ type: 'SET_FILTER', filter })
    }, [])

    const setSearch = useCallback((query: string) => {
        dispatch({ type: 'SET_SEARCH', query })
    }, [])

    const toggleTheme = useCallback(() => {
        dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })
    }, [state.theme])

    const setDeleteConfirm = useCallback((id: string | null) => {
        dispatch({ type: 'SET_DELETE_CONFIRM', id })
    }, [])

    const openFolder = useCallback(() => {
        window.electronAPI.openFolder()
    }, [])

    const createLabel = useCallback(async (name: string, color: string) => {
        const label = await window.electronAPI.createLabel(name, color)
        dispatch({ type: 'ADD_LABEL', label })
    }, [])

    const updateLabel = useCallback(async (id: string, name: string, color: string) => {
        const label = await window.electronAPI.updateLabel(id, name, color)
        if (label) {
            dispatch({ type: 'UPDATE_LABEL', label })
        }
    }, [])

    const deleteLabel = useCallback(async (id: string) => {
        await window.electronAPI.deleteLabel(id)
        dispatch({ type: 'REMOVE_LABEL', id })
    }, [])

    const updateNoteLabel = useCallback(async (id: string, labelId: string | undefined) => {
        await window.electronAPI.updateNoteLabel(id, labelId)
        dispatch({ type: 'UPDATE_NOTE_LABEL', id, labelId })
    }, [])

    const setSelectedLabelId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_LABEL', labelId: id })
    }, [])

    const setSelectedTag = useCallback((tag: string | null) => {
        dispatch({ type: 'SET_SELECTED_TAG', tag })
    }, [])

    const activeNote = state.notes.find(n => n.id === state.activeNoteId)

    const filteredNotes = state.notes.filter(note => {
        const matchesLabel = state.selectedLabelId ? note.labelId === state.selectedLabelId : true
        const matchesTag = state.selectedTag ? note.tags?.includes(state.selectedTag) : true
        const matchesFilter = state.filterMode === 'all' || note.starred
        const matchesSearch = state.searchQuery === '' ||
            note.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(state.searchQuery.toLowerCase())
        return matchesLabel && matchesTag && matchesFilter && matchesSearch
    })

    return (
        <NotesContext.Provider value={{
            state,
            activeNote,
            filteredNotes,
            loadNotes,
            createNote,
            openDailyNote,
            updateNote,
            deleteNote,
            toggleStar,
            togglePin,
            importNotes,
            exportNote,
            setActiveNote,
            setViewMode,
            setFilter,
            setSearch,
            setSelectedLabelId,
            setSelectedTag,
            toggleTheme,
            toggleSidebar,
            setDeleteConfirm,
            openFolder,
            createLabel,
            updateLabel,
            deleteLabel,
            updateNoteLabel,
            openNoteByTitle
        }}>
            {children}
        </NotesContext.Provider>
    )
}

export function useNotes() {
    const ctx = useContext(NotesContext)
    if (!ctx) throw new Error('useNotes must be used within NotesProvider')
    return ctx
}
