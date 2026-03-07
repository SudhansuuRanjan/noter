import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, copyFileSync } from 'fs'
import { homedir } from 'os'
import { v4 as uuidv4 } from 'uuid'

const NOTES_DIR = join(homedir(), 'Notes', 'noter')
const META_FILE = join(NOTES_DIR, '.meta.json')
const LABELS_FILE = join(NOTES_DIR, '.labels.json')

// Ensure notes directory exists
function ensureNotesDir() {
    if (!existsSync(NOTES_DIR)) {
        mkdirSync(NOTES_DIR, { recursive: true })
    }
}

// Read metadata
function readMeta(): Record<string, { starred: boolean; labelId?: string; createdAt: string; updatedAt: string }> {
    try {
        if (existsSync(META_FILE)) {
            return JSON.parse(readFileSync(META_FILE, 'utf-8'))
        }
    } catch {
        // ignore
    }
    return {}
}

// Write metadata
function writeMeta(meta: Record<string, { starred: boolean; labelId?: string; createdAt: string; updatedAt: string }>) {
    writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8')
}

// Read labels
function readLabels(): Array<{ id: string; name: string; color: string }> {
    try {
        if (existsSync(LABELS_FILE)) {
            return JSON.parse(readFileSync(LABELS_FILE, 'utf-8'))
        }
    } catch {
        // ignore
    }
    return []
}

// Write labels
function writeLabels(labels: Array<{ id: string; name: string; color: string }>) {
    writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2), 'utf-8')
}

function createWindow(): void {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#0e0e12',
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        },
        show: false
    })

    win.once('ready-to-show', () => {
        win.show()
    })

    if (process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    ensureNotesDir()
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// IPC: List all notes
ipcMain.handle('notes:list', () => {
    ensureNotesDir()
    const meta = readMeta()
    const files = readdirSync(NOTES_DIR).filter(f => f.endsWith('.md'))

    return files.map(file => {
        const id = file.replace('.md', '')
        const filePath = join(NOTES_DIR, file)
        const content = readFileSync(filePath, 'utf-8')
        const lines = content.split('\n').filter(l => l.trim())
        const titleLine = lines[0] || 'Untitled'
        const title = titleLine.replace(/^#+\s*/, '').trim() || 'Untitled'
        const preview = lines.slice(1).join(' ').replace(/[#*`_\[\]]/g, '').slice(0, 120)
        const fileStat = require('fs').statSync(filePath)
        const metaEntry = meta[id] || {
            starred: false,
            createdAt: fileStat.birthtime.toISOString(),
            updatedAt: fileStat.mtime.toISOString(),
            labelId: undefined
        }

        return {
            id,
            title,
            preview,
            content,
            starred: metaEntry.starred,
            labelId: metaEntry.labelId,
            createdAt: metaEntry.createdAt,
            updatedAt: metaEntry.updatedAt,
            filePath
        }
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

// IPC: Read a note
ipcMain.handle('notes:read', (_event, id: string) => {
    const filePath = join(NOTES_DIR, `${id}.md`)
    if (!existsSync(filePath)) return null
    return readFileSync(filePath, 'utf-8')
})

// IPC: Write/update a note
ipcMain.handle('notes:write', (_event, { id, content }: { id: string; content: string }) => {
    ensureNotesDir()
    const filePath = join(NOTES_DIR, `${id}.md`)
    const isNew = !existsSync(filePath)
    writeFileSync(filePath, content, 'utf-8')

    const meta = readMeta()
    const now = new Date().toISOString()
    if (!meta[id]) {
        meta[id] = { starred: false, createdAt: now, updatedAt: now }
    } else {
        meta[id].updatedAt = now
    }
    writeMeta(meta)

    return { id, isNew, updatedAt: meta[id].updatedAt }
})

// IPC: Create new note
ipcMain.handle('notes:create', () => {
    ensureNotesDir()
    const id = uuidv4()
    const now = new Date().toISOString()
    const filePath = join(NOTES_DIR, `${id}.md`)
    const defaultContent = '# New Note\n\nStart writing here...'
    writeFileSync(filePath, defaultContent, 'utf-8')

    const meta = readMeta()
    meta[id] = { starred: false, createdAt: now, updatedAt: now }
    writeMeta(meta)

    return { id, content: defaultContent, createdAt: now, updatedAt: now }
})

// IPC: Delete a note
ipcMain.handle('notes:delete', (_event, id: string) => {
    const filePath = join(NOTES_DIR, `${id}.md`)
    if (existsSync(filePath)) {
        unlinkSync(filePath)
    }
    const meta = readMeta()
    delete meta[id]
    writeMeta(meta)
    return true
})

// IPC: Toggle star
ipcMain.handle('notes:star', (_event, id: string) => {
    const meta = readMeta()
    if (meta[id]) {
        meta[id].starred = !meta[id].starred
    } else {
        meta[id] = { starred: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    writeMeta(meta)
    return meta[id].starred
})

// IPC: Update Note Label
ipcMain.handle('notes:updateLabel', (_event, { id, labelId }: { id: string; labelId: string | undefined }) => {
    const meta = readMeta()
    if (meta[id]) {
        meta[id].labelId = labelId
    } else {
        meta[id] = { starred: false, labelId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    writeMeta(meta)
    return true
})

// IPC: Import note
ipcMain.handle('notes:import', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
    })
    if (result.canceled || !result.filePaths.length) return null

    const imported = []
    const meta = readMeta()
    const now = new Date().toISOString()

    for (const sourcePath of result.filePaths) {
        const id = uuidv4()
        const destPath = join(NOTES_DIR, `${id}.md`)
        copyFileSync(sourcePath, destPath)
        meta[id] = { starred: false, createdAt: now, updatedAt: now }
        imported.push(id)
    }
    writeMeta(meta)
    return imported
})

// IPC: Export note
ipcMain.handle('notes:export', async (_event, { id, title }: { id: string; title: string }) => {
    const filePath = join(NOTES_DIR, `${id}.md`)
    if (!existsSync(filePath)) return false

    const result = await dialog.showSaveDialog({
        defaultPath: `${title}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || !result.filePath) return false

    copyFileSync(filePath, result.filePath)
    shell.showItemInFolder(result.filePath)
    return result.filePath
})

// IPC: Open notes folder
ipcMain.handle('notes:openFolder', () => {
    shell.openPath(NOTES_DIR)
})

// IPC: Label Management
ipcMain.handle('labels:list', () => {
    ensureNotesDir()
    return readLabels()
})

ipcMain.handle('labels:create', (_event, { name, color }: { name: string; color: string }) => {
    ensureNotesDir()
    const labels = readLabels()
    const newLabel = { id: uuidv4(), name, color }
    labels.push(newLabel)
    writeLabels(labels)
    return newLabel
})

ipcMain.handle('labels:delete', (_event, id: string) => {
    let labels = readLabels()
    labels = labels.filter(l => l.id !== id)
    writeLabels(labels)

    // Detach label from notes that used it
    const meta = readMeta()
    let changed = false
    for (const noteId in meta) {
        if (meta[noteId].labelId === id) {
            meta[noteId].labelId = undefined
            changed = true
        }
    }
    if (changed) writeMeta(meta)

    return true
})

ipcMain.handle('labels:update', (_event, { id, name, color }: { id: string; name: string; color: string }) => {
    ensureNotesDir()
    const labels = readLabels()
    const index = labels.findIndex(l => l.id === id)
    if (index !== -1) {
        labels[index] = { ...labels[index], name, color }
        writeLabels(labels)
        return labels[index]
    }
    return null
})
