export interface Note {
    id: string
    title: string
    preview: string
    content: string
    starred: boolean
    labelId?: string
    createdAt: string
    updatedAt: string
    filePath: string
}

export interface Label {
    id: string
    name: string
    color: string
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
    updateNoteLabel: (id: string, labelId: string | undefined) => Promise<boolean>
    importNotes: () => Promise<string[] | null>
    exportNote: (id: string, title: string) => Promise<string | false>
    openFolder: () => Promise<void>
    listLabels: () => Promise<Label[]>
    createLabel: (name: string, color: string) => Promise<Label>
    updateLabel: (id: string, name: string, color: string) => Promise<Label | null>
    deleteLabel: (id: string) => Promise<boolean>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
