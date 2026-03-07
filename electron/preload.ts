import { contextBridge, ipcRenderer } from 'electron'

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

const api: ElectronAPI = {
    listNotes: () => ipcRenderer.invoke('notes:list'),
    readNote: (id) => ipcRenderer.invoke('notes:read', id),
    writeNote: (id, content) => ipcRenderer.invoke('notes:write', { id, content }),
    createNote: () => ipcRenderer.invoke('notes:create'),
    deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),
    starNote: (id) => ipcRenderer.invoke('notes:star', id),
    importNotes: () => ipcRenderer.invoke('notes:import'),
    exportNote: (id, title) => ipcRenderer.invoke('notes:export', { id, title }),
    openFolder: () => ipcRenderer.invoke('notes:openFolder')
}

contextBridge.exposeInMainWorld('electronAPI', api)
