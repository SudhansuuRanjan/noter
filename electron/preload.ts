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
    togglePin: (id: string) => Promise<boolean>
    updateNoteLabel: (id: string, labelId: string | undefined) => Promise<boolean>
    importNotes: () => Promise<string[] | null>
    exportNote: (id: string, title: string) => Promise<string | false>
    openFolder: () => Promise<void>
    listLabels: () => Promise<Label[]>
    createLabel: (name: string, color: string) => Promise<Label>
    updateLabel: (id: string, name: string, color: string) => Promise<Label | null>
    deleteLabel: (id: string) => Promise<boolean>
    saveAttachment: (buffer: ArrayBuffer, filename: string) => Promise<string>
    getHistory: (id: string) => Promise<{ timestamp: number, preview: string, path: string }[]>
    getRevision: (path: string) => Promise<string | null>
    openInNewWindow: (id: string) => Promise<void>
    windowArgs: { mode: string; noteId?: string }
}

const getWindowArgs = () => {
    const args = process.argv
    const modeArg = args.find(arg => arg.startsWith('--window-mode='))
    const idArg = args.find(arg => arg.startsWith('--note-id='))

    return {
        mode: modeArg ? modeArg.split('=')[1] : 'main',
        noteId: idArg ? idArg.split('=')[1] : undefined
    }
}

const api: ElectronAPI = {
    listNotes: () => ipcRenderer.invoke('notes:list'),
    readNote: (id: string) => ipcRenderer.invoke('notes:read', id),
    writeNote: (id: string, content: string) => ipcRenderer.invoke('notes:write', { id, content }),
    createNote: () => ipcRenderer.invoke('notes:create'),
    deleteNote: (id: string) => ipcRenderer.invoke('notes:delete', id),
    starNote: (id: string) => ipcRenderer.invoke('notes:star', id),
    togglePin: (id: string) => ipcRenderer.invoke('notes:togglePin', id),
    updateNoteLabel: (id: string, labelId: string | undefined) => ipcRenderer.invoke('notes:updateLabel', { id, labelId }),
    importNotes: () => ipcRenderer.invoke('notes:import'),
    exportNote: (id: string, title: string) => ipcRenderer.invoke('notes:export', { id, title }),
    openFolder: () => ipcRenderer.invoke('notes:openFolder'),
    listLabels: () => ipcRenderer.invoke('labels:list'),
    createLabel: (name: string, color: string) => ipcRenderer.invoke('labels:create', { name, color }),
    updateLabel: (id: string, name: string, color: string) => ipcRenderer.invoke('labels:update', { id, name, color }),
    deleteLabel: (id: string) => ipcRenderer.invoke('labels:delete', id),
    saveAttachment: (buffer: ArrayBuffer, filename: string) => ipcRenderer.invoke('attachments:save', buffer, filename),
    getHistory: (id: string) => ipcRenderer.invoke('notes:getHistory', id),
    getRevision: (path: string) => ipcRenderer.invoke('notes:getRevision', path),
    openInNewWindow: (id: string) => ipcRenderer.invoke('notes:openInNewWindow', id),
    windowArgs: getWindowArgs()
}

contextBridge.exposeInMainWorld('electronAPI', api)
