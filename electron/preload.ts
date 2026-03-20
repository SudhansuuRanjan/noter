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
    clearKey: () => Promise<boolean>
    aiChat: (options: { messages: any[], systemPrompt?: string, model?: string }) =>
        Promise<{ content?: string; usage?: any; error?: string }>
    windowArgs: { mode: string; noteId?: string }
    platform: NodeJS.Platform
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
    exportPDF: (id: string, title: string) => ipcRenderer.invoke('notes:exportPDF', { id, title }),
    openFolder: () => ipcRenderer.invoke('notes:openFolder'),
    listLabels: () => ipcRenderer.invoke('labels:list'),
    createLabel: (name: string, color: string) => ipcRenderer.invoke('labels:create', { name, color }),
    updateLabel: (id: string, name: string, color: string) => ipcRenderer.invoke('labels:update', { id, name, color }),
    deleteLabel: (id: string) => ipcRenderer.invoke('labels:delete', id),
    saveAttachment: (buffer: ArrayBuffer, filename: string) => ipcRenderer.invoke('attachments:save', buffer, filename),
    getHistory: (id: string) => ipcRenderer.invoke('notes:getHistory', id),
    getRevision: (path: string) => ipcRenderer.invoke('notes:getRevision', path),
    saveHistoryVersion: (id: string, content: string) => ipcRenderer.invoke('notes:saveHistoryVersion', { id, content }),
    openInNewWindow: (id: string) => ipcRenderer.invoke('notes:openInNewWindow', id),
    saveKey: (key: string) => ipcRenderer.invoke('settings:saveKey', key),
    hasKey: () => ipcRenderer.invoke('settings:hasKey'),
    clearKey: () => ipcRenderer.invoke('settings:clearKey'),
    getSettings: () => ipcRenderer.invoke('settings:get'),
    updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
    aiChat: (options: { messages: any[], systemPrompt?: string, model?: string }) =>
        ipcRenderer.invoke('ai:chat', options),
    windowArgs: getWindowArgs(),
    platform: process.platform
}

const updaterApi = {
    onChecking: (callback: () => void) => ipcRenderer.on('updater:checking', () => callback()),
    onAvailable: (callback: (event: any, info: any) => void) => ipcRenderer.on('updater:available', callback),
    onNotAvailable: (callback: () => void) => ipcRenderer.on('updater:not-available', () => callback()),
    onDownloadProgress: (callback: (event: any, progress: any) => void) => ipcRenderer.on('updater:download-progress', callback),
    onDownloaded: (callback: (event: any, info: any) => void) => ipcRenderer.on('updater:downloaded', callback),
    onError: (callback: (event: any, error: any) => void) => ipcRenderer.on('updater:error', callback),
    installUpdate: () => ipcRenderer.send('updater:install'),
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('updater:checking')
        ipcRenderer.removeAllListeners('updater:available')
        ipcRenderer.removeAllListeners('updater:not-available')
        ipcRenderer.removeAllListeners('updater:download-progress')
        ipcRenderer.removeAllListeners('updater:downloaded')
        ipcRenderer.removeAllListeners('updater:error')
    }
}

contextBridge.exposeInMainWorld('electronAPI', api)
contextBridge.exposeInMainWorld('updaterAPI', updaterApi)
