export interface Note {
    id: string
    title: string
    preview: string
    content: string
    starred: boolean
    createdAt: string
    updatedAt: string
    filePath: string
}

export type ViewMode = 'edit' | 'preview' | 'split'
export type FilterMode = 'all' | 'starred'

export interface ElectronAPI {
    listNotes: () => Promise<Note[]>
    readNote: (id: string) => Promise<string | null>
    writeNote: (id: string, content: string) => Promise<{ id: string; isNew: boolean; updatedAt: string }>
    createNote: () => Promise<{ id: string; content: string; createdAt: string; updatedAt: string }>
    deleteNote: (id: string) => Promise<boolean>
    starNote: (id: string) => Promise<boolean>
    importNotes: () => Promise<string[] | null>
    exportNote: (id: string, title: string) => Promise<string | false>
    openFolder: () => Promise<void>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
