import { contextBridge, ipcRenderer } from 'electron'

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
    deleteLabel: (id: string) => Promise<boolean>
}

const api: ElectronAPI = {
    listNotes: () => ipcRenderer.invoke('notes:list'),
    readNote: (id) => ipcRenderer.invoke('notes:read', id),
    writeNote: (id, content) => ipcRenderer.invoke('notes:write', { id, content }),
    createNote: () => ipcRenderer.invoke('notes:create'),
    deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),
    starNote: (id) => ipcRenderer.invoke('notes:star', id),
    updateNoteLabel: (id, labelId) => ipcRenderer.invoke('notes:updateLabel', { id, labelId }),
    importNotes: () => ipcRenderer.invoke('notes:import'),
    exportNote: (id, title) => ipcRenderer.invoke('notes:export', { id, title }),
    openFolder: () => ipcRenderer.invoke('notes:openFolder'),
    listLabels: () => ipcRenderer.invoke('labels:list'),
    createLabel: (name, color) => ipcRenderer.invoke('labels:create', { name, color }),
    deleteLabel: (id) => ipcRenderer.invoke('labels:delete', id)
}

contextBridge.exposeInMainWorld('electronAPI', api)
