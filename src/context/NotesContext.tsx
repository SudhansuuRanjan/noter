import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react'
import { Note, Label, ViewMode, FilterMode } from '../types/note'
import { withViewTransition } from '../utils/transition'

interface NotesState {
    notes: Note[]
    labels: Label[]
    activeNoteId: string | null
    viewMode: ViewMode
    filterMode: FilterMode
    searchQuery: string
    selectedLabelId: string | null
    selectedTags: string[]
    theme: 'dark' | 'light'
    isLoading: boolean
    isSaving: boolean
    deleteConfirmId: string | null
    isSidebarOpen: boolean
    sortBy: 'title' | 'createdAt' | 'updatedAt'
    sortOrder: 'asc' | 'desc'
    accentColor: string
    version: string
    previewWidth: 'medium' | 'large' | 'full'
    historySyncState: 'synced' | 'pending' | 'syncing'
}

type Action =
    | { type: 'SET_NOTES'; notes: Note[] }
    | { type: 'SET_ACTIVE'; id: string | null }
    | { type: 'SET_VIEW_MODE'; mode: ViewMode }
    | { type: 'SET_FILTER'; filter: FilterMode }
    | { type: 'SET_SEARCH'; query: string }
    | { type: 'SET_SELECTED_LABEL'; labelId: string | null }
    | { type: 'TOGGLE_SELECTED_TAG'; tag: string }
    | { type: 'CLEAR_SELECTED_TAGS' }
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
    | { type: 'SET_SORT_BY'; sortBy: 'title' | 'createdAt' | 'updatedAt' }
    | { type: 'SET_SORT_ORDER'; sortOrder: 'asc' | 'desc' }
    | { type: 'SET_ACCENT_COLOR'; color: string }
    | { type: 'SET_PREVIEW_WIDTH'; width: 'medium' | 'large' | 'full' }
    | { type: 'SET_HISTORY_SYNC_STATE'; syncState: 'synced' | 'pending' | 'syncing' }

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
        case 'TOGGLE_SELECTED_TAG': {
            const tags = state.selectedTags.includes(action.tag)
                ? state.selectedTags.filter(t => t !== action.tag)
                : [...state.selectedTags, action.tag]
            return { ...state, selectedTags: tags }
        }
        case 'CLEAR_SELECTED_TAGS':
            return { ...state, selectedTags: [] }
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
        case 'SET_SORT_BY':
            return { ...state, sortBy: action.sortBy }
        case 'SET_SORT_ORDER':
            return { ...state, sortOrder: action.sortOrder }
        case 'SET_ACCENT_COLOR':
            return { ...state, accentColor: action.color }
        case 'SET_PREVIEW_WIDTH':
            return { ...state, previewWidth: action.width }
        case 'SET_HISTORY_SYNC_STATE':
            return { ...state, historySyncState: action.syncState }
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
    version: '1.0.2',
    notes: [],
    labels: [],
    activeNoteId: null,
    viewMode: 'preview',
    filterMode: 'all',
    searchQuery: '',
    selectedLabelId: null,
    selectedTags: [],
    theme: (localStorage.getItem('noter-theme') as 'dark' | 'light') || 'dark',
    isLoading: true,
    isSaving: false,
    deleteConfirmId: null,
    isSidebarOpen: true,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    accentColor: localStorage.getItem('noter-accent') || 'indigo',
    previewWidth: (localStorage.getItem('noter-preview-width') as 'medium' | 'large' | 'full') || 'medium'
    , historySyncState: 'synced'
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
    toggleTag: (tag: string) => void
    clearTags: () => void
    toggleTheme: () => void
    toggleSidebar: () => void
    setDeleteConfirm: (id: string | null) => void
    openFolder: () => void
    setSortBy: (sortBy: 'title' | 'createdAt' | 'updatedAt') => void
    setSortOrder: (sortOrder: 'asc' | 'desc') => void
    createLabel: (name: string, color: string) => Promise<void>
    updateLabel: (id: string, name: string, color: string) => Promise<void>
    deleteLabel: (id: string) => Promise<void>
    updateNoteLabel: (id: string, labelId: string | undefined) => Promise<void>
    openNoteByTitle: (title: string, inNewWindow?: boolean) => Promise<void>
    exportPDF: (id: string, title: string) => Promise<void>
    setAccentColor: (color: string) => void
    setPreviewWidth: (width: 'medium' | 'large' | 'full') => void
    saveVersionHistory: () => Promise<boolean>
    ensureHistorySynced: (nextNoteId?: string | null) => Promise<boolean>
    cloneNote: (id: string) => Promise<void>
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(notesReducer, initialState)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingNoteContentRef = useRef<Record<string, string>>({})
    const lastHistorySyncedContentRef = useRef<Record<string, string>>({})

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

        html.setAttribute('data-theme', state.accentColor)

        localStorage.setItem('noter-theme', state.theme)
        localStorage.setItem('noter-accent', state.accentColor)
        localStorage.setItem('noter-preview-width', state.previewWidth)
    }, [state.theme, state.accentColor, state.previewWidth])

    const loadNotes = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', loading: true })
        const notes = await window.electronAPI.listNotes()
        const syncedMap = notes.reduce<Record<string, string>>((acc, note) => {
            acc[note.id] = note.content
            return acc
        }, {})
        lastHistorySyncedContentRef.current = syncedMap
        dispatch({ type: 'SET_NOTES', notes })
        const labels = await window.electronAPI.listLabels()
        dispatch({ type: 'SET_LABELS', labels })
    }, [])

    useEffect(() => {
        loadNotes().then(() => {
            const id = window.electronAPI.windowArgs.noteId
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
        withViewTransition(() => {
            dispatch({ type: 'ADD_NOTE', note })
            dispatch({ type: 'SET_VIEW_MODE', mode: 'edit' })
        })
    }, [])

    const openDailyNote = useCallback(async () => {
        const date = new Date()
        const day = date.getDate()
        const monthMatch = date.toLocaleString('en-IN', { month: 'short' })
        const yearMatch = date.getFullYear()
        const weekdayMatch = date.toLocaleString('en-IN', { weekday: 'short' })

        const todayString = `${day} ${monthMatch}, ${yearMatch} (${weekdayMatch})`
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
            dispatch({ type: 'SET_VIEW_MODE', mode: 'edit' })
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
            withViewTransition(() => {
                dispatch({ type: 'ADD_NOTE', note })
                dispatch({ type: 'SET_ACTIVE', id: note.id })
                dispatch({ type: 'SET_VIEW_MODE', mode: 'edit' })
            })
        }
    }, [state.notes, state.labels])

    const openNoteByTitle = useCallback(async (ref: string, inNewWindow = false) => {
        const cleanRef = ref.trim()

        // Try to find by ID first
        let existingNote = state.notes.find(n => n.id === cleanRef)

        // Fallback to finding by Title
        if (!existingNote) {
            existingNote = state.notes.find(n => n.title.toLowerCase() === cleanRef.toLowerCase())
        }

        if (existingNote) {
            if (inNewWindow) {
                window.electronAPI.openInNewWindow(existingNote.id)
            } else {
                dispatch({ type: 'SET_ACTIVE', id: existingNote.id })
            }
            return
        }

        // Note doesn't exist, create it (treat as title)
        const cleanTitle = cleanRef
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
        withViewTransition(() => {
            dispatch({ type: 'ADD_NOTE', note })
        })

        if (!inNewWindow) {
            withViewTransition(() => {
                dispatch({ type: 'SET_ACTIVE', id: note.id })
            })
        }

        if (inNewWindow) {
            window.electronAPI.openInNewWindow(result.id)
        }
    }, [state.notes])

    const cloneNote = useCallback(async (id: string) => {
        const noteToClone = state.notes.find(n => n.id === id)
        if (!noteToClone) return

        const result = await window.electronAPI.createNote()
        
        const lines = noteToClone.content.split('\n')
        let newContent = noteToClone.content
        let newTitle = noteToClone.title + ' (Copy)'
        
        if (lines.length > 0 && lines[0].startsWith('# ')) {
            lines[0] = lines[0] + ' (Copy)'
            newContent = lines.join('\n')
            newTitle = extractTitle(newContent)
        } else {
            newContent = `# ${newTitle}\n\n${newContent}`
        }

        await window.electronAPI.writeNote(result.id, newContent)

        const note: Note = {
            ...noteToClone,
            id: result.id,
            title: newTitle,
            content: newContent,
            preview: extractPreview(newContent),
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            pinned: false,
            starred: false
        }
        
        withViewTransition(() => {
            dispatch({ type: 'ADD_NOTE', note })
            dispatch({ type: 'SET_ACTIVE', id: note.id })
        })
    }, [state.notes])

    const updateNote = useCallback((id: string, content: string) => {
        pendingNoteContentRef.current[id] = content
        dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'pending' })
        dispatch({ type: 'SET_SAVING', saving: true })
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
            // Capture the content we're about to save
            const contentToSave = content
            const result = await window.electronAPI.writeNote(id, contentToSave)
            // Only clear pending ref if no new content was typed while saving
            // (i.e., the pending content is still the same as what we saved)
            if (pendingNoteContentRef.current[id] === contentToSave) {
                delete pendingNoteContentRef.current[id]
            }
            dispatch({ type: 'UPDATE_NOTE', id, content: contentToSave, updatedAt: result.updatedAt })
        }, 800)
    }, [])

    const saveVersionHistory = useCallback(async () => {
        const note = state.notes.find(n => n.id === state.activeNoteId)
        if (!note) return false

        const content = pendingNoteContentRef.current[note.id] ?? note.content
        const lastSyncedContent = lastHistorySyncedContentRef.current[note.id]

        if (lastSyncedContent === content) {
            dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'synced' })
            return true
        }

        dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'syncing' })
        await window.electronAPI.saveHistoryVersion(note.id, content)
        lastHistorySyncedContentRef.current[note.id] = content
        dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'synced' })
        return true
    }, [state.notes, state.activeNoteId])

    const ensureHistorySynced = useCallback(async (_nextNoteId?: string | null) => {
        const note = state.notes.find(n => n.id === state.activeNoteId)
        if (!note) return true

        const content = pendingNoteContentRef.current[note.id] ?? note.content
        const lastSyncedContent = lastHistorySyncedContentRef.current[note.id]

        if (content === lastSyncedContent) {
            dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'synced' })
            return true
        }

        dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'syncing' })
        await window.electronAPI.saveHistoryVersion(note.id, content)
        lastHistorySyncedContentRef.current[note.id] = content
        dispatch({ type: 'SET_HISTORY_SYNC_STATE', syncState: 'synced' })
        return true
    }, [state.notes, state.activeNoteId])

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
            }
        }
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

    const exportPDF = useCallback(async (id: string, title: string) => {
        await window.electronAPI.exportPDF(id, title)
    }, [])

    const setActiveNote = useCallback((id: string | null) => {
        const currentId = state.activeNoteId
        if (id && currentId && id !== currentId) {
            const currentNote = state.notes.find(n => n.id === currentId)
            if (currentNote) {
                const content = pendingNoteContentRef.current[currentId] ?? currentNote.content
                const lastSyncedContent = lastHistorySyncedContentRef.current[currentId]
                dispatch({
                    type: 'SET_HISTORY_SYNC_STATE',
                    syncState: content === lastSyncedContent ? 'synced' : 'pending'
                })
            }
        }
        withViewTransition(() => dispatch({ type: 'SET_ACTIVE', id }))
    }, [state.activeNoteId, state.notes])

    const toggleSidebar = useCallback(() => {
        withViewTransition(() => dispatch({ type: 'TOGGLE_SIDEBAR' }))
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

    const toggleTag = useCallback((tag: string) => {
        dispatch({ type: 'TOGGLE_SELECTED_TAG', tag })
    }, [])
    const clearTags = useCallback(() => {
        dispatch({ type: 'CLEAR_SELECTED_TAGS' })
    }, [])

    const setSortBy = useCallback((sortBy: 'title' | 'createdAt' | 'updatedAt') => {
        dispatch({ type: 'SET_SORT_BY', sortBy })
    }, [])

    const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
        dispatch({ type: 'SET_SORT_ORDER', sortOrder })
    }, [])

    const setAccentColor = useCallback((color: string) => {
        dispatch({ type: 'SET_ACCENT_COLOR', color })
    }, [])

    const setPreviewWidth = useCallback((width: 'medium' | 'large' | 'full') => {
        dispatch({ type: 'SET_PREVIEW_WIDTH', width })
    }, [])

    const activeNote = React.useMemo(() => {
        const note = state.notes.find(n => n.id === state.activeNoteId)
        if (!note) return undefined

        const pendingContent = pendingNoteContentRef.current[note.id]
        if (pendingContent === undefined || pendingContent === note.content) {
            return note
        }

        const tagsMatch = Array.from(pendingContent.matchAll(/(?:^|\s)(#[a-zA-Z0-9_-]+)/g))
        const tags = tagsMatch.length > 0 ? Array.from(new Set(tagsMatch.map(m => m[1]))) : []

        return {
            ...note,
            content: pendingContent,
            title: extractTitle(pendingContent),
            preview: extractPreview(pendingContent),
            tags
        }
    }, [state.notes, state.activeNoteId])

    const sortedNotes = React.useMemo(() => {
        const filtered = state.notes.filter(note => {
            const matchesLabel = state.selectedLabelId ? note.labelId === state.selectedLabelId : true
            const matchesTags = state.selectedTags.length > 0
                ? state.selectedTags.every(tag => note.tags?.includes(tag))
                : true
            const matchesFilter = state.filterMode === 'all' || note.starred
            const matchesSearch = state.searchQuery === '' ||
                note.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(state.searchQuery.toLowerCase())
            return matchesLabel && matchesTags && matchesFilter && matchesSearch
        })

        return [...filtered].sort((a, b) => {
            // Keep pinned notes at top
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1

            let comparison = 0
            if (state.sortBy === 'title') {
                comparison = a.title.localeCompare(b.title)
            } else if (state.sortBy === 'createdAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            } else {
                comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            }

            return state.sortOrder === 'desc' ? -comparison : comparison
        })
    }, [state.notes, state.selectedLabelId, state.selectedTags, state.filterMode, state.searchQuery, state.sortBy, state.sortOrder])

    return (
        <NotesContext.Provider value={{
            state,
            activeNote,
            filteredNotes: sortedNotes,
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
            toggleTag,
            clearTags,
            toggleTheme,
            toggleSidebar,
            setDeleteConfirm,
            openFolder,
            setSortBy,
            setSortOrder,
            createLabel,
            updateLabel,
            deleteLabel,
            updateNoteLabel,
            openNoteByTitle,
            exportPDF,
            setAccentColor,
            setPreviewWidth,
            saveVersionHistory,
            ensureHistorySynced,
            cloneNote
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
