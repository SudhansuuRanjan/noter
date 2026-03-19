export interface Note {
    id: string
    title: string
    preview: string
    content: string
    starred: boolean
    pinned?: boolean
    tags?: string[]
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
    togglePin: (id: string) => Promise<boolean>
    updateNoteLabel: (id: string, labelId: string | undefined) => Promise<boolean>
    importNotes: () => Promise<string[] | null>
    exportNote: (id: string, title: string) => Promise<string | false>
    exportPDF: (id: string, title: string) => Promise<string | false>
    openFolder: () => Promise<void>
    listLabels: () => Promise<Label[]>
    createLabel: (name: string, color: string) => Promise<Label>
    updateLabel: (id: string, name: string, color: string) => Promise<Label | null>
    deleteLabel: (id: string) => Promise<boolean>
    saveAttachment: (buffer: ArrayBuffer, filename: string) => Promise<string>
    getHistory: (id: string) => Promise<{ timestamp: number, preview: string, path: string }[]>
    getRevision: (path: string) => Promise<string | null>
    saveHistoryVersion: (id: string, content: string) => Promise<{ timestamp: number }>
    openInNewWindow: (id: string) => Promise<void>
    saveKey: (key: string) => Promise<boolean>
    hasKey: () => Promise<boolean>
    getSettings: () => Promise<any>
    updateSettings: (settings: any) => Promise<boolean>
    aiChat: (options: { messages: any[], systemPrompt?: string, model?: string }) =>
        Promise<{ content?: string; usage?: any; error?: string }>
    windowArgs: { mode: string; noteId?: string }
    platform: string
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
        updaterAPI: {
            onChecking: (callback: () => void) => void
            onAvailable: (callback: (event: any, info: any) => void) => void
            onNotAvailable: (callback: () => void) => void
            onDownloadProgress: (callback: (event: any, progress: any) => void) => void
            onDownloaded: (callback: (event: any, info: any) => void) => void
            onError: (callback: (event: any, error: any) => void) => void
            installUpdate: () => void
            removeAllListeners: () => void
        }
    }
}
