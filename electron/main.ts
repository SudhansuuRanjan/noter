import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron'
import { join, extname } from 'path'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, copyFileSync } from 'fs'
import { homedir } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { setupAutoUpdater } from './updater'


const NOTES_DIR = join(homedir(), 'Notes', 'noter')
const META_FILE = join(NOTES_DIR, '.meta.json')
const LABELS_FILE = join(NOTES_DIR, '.labels.json')
const ATTACHMENTS_DIR = join(NOTES_DIR, 'attachments')
const HISTORY_DIR = join(NOTES_DIR, '.history')
const SETTINGS_FILE = join(NOTES_DIR, '.settings.json')

// Ensure notes directory exists
function ensureNotesDir() {
    if (!existsSync(NOTES_DIR)) mkdirSync(NOTES_DIR, { recursive: true })
    if (!existsSync(ATTACHMENTS_DIR)) mkdirSync(ATTACHMENTS_DIR, { recursive: true })
    if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true })
}

// Read metadata
function readMeta(): Record<string, { starred: boolean; pinned?: boolean; tags?: string[]; labelId?: string; createdAt: string; updatedAt: string }> {
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
function writeMeta(meta: Record<string, { starred: boolean; pinned?: boolean; tags?: string[]; labelId?: string; createdAt: string; updatedAt: string }>) {
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

function createWindow(noteId?: string): BrowserWindow {

    const isSecondary = !!noteId
    const win = new BrowserWindow({
        width: isSecondary ? 800 : 1280,
        height: isSecondary ? 600 : 800,
        minWidth: isSecondary ? 400 : 800,
        minHeight: isSecondary ? 300 : 600,
        backgroundColor: '#0e0e12',
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
        autoHideMenuBar: isSecondary,
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            additionalArguments: isSecondary ? [
                `--window-mode=secondary`,
                `--note-id=${noteId}`
            ] : [`--window-mode=main`]
        },
        show: false
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http') || url.startsWith('https')) {
            shell.openExternal(url)
            return { action: 'deny' }
        }
        return { action: 'allow' }
    })

    win.once('ready-to-show', () => {
        win.show()
    })

    const url = process.env['ELECTRON_RENDERER_URL']
    if (url) {
        win.loadURL(url)
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return win
}

app.whenReady().then(() => {
    ensureNotesDir()

    protocol.handle('noter', (request) => {
        const urlRequest = request.url.replace('noter://', '')
        if (urlRequest.startsWith('attachments/')) {
            const fileName = urlRequest.replace('attachments/', '')
            const filePath = join(ATTACHMENTS_DIR, fileName)
            return net.fetch('file://' + filePath)
        }
        if (urlRequest.startsWith('local/')) {
            const filePath = decodeURIComponent(urlRequest.replace('local/', ''))
            return net.fetch('file://' + filePath)
        }
        return new Response('Not found', { status: 404 })
    })

    createWindow()
    setupAutoUpdater()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().filter(w => !w.isDestroyed()).length === 0) {
            createWindow()
            setupAutoUpdater()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// IPC: Open In New Window
ipcMain.handle('notes:openInNewWindow', (_event, noteId: string) => {
    createWindow(noteId)
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
            pinned: false,
            tags: [],
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
            pinned: metaEntry.pinned || false,
            tags: metaEntry.tags || [],
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

    // Save history backup if content changed
    if (!isNew) {
        const existingContent = readFileSync(filePath, 'utf-8')
        if (existingContent !== content) {
            const noteHistoryDir = join(HISTORY_DIR, id)
            if (!existsSync(noteHistoryDir)) mkdirSync(noteHistoryDir, { recursive: true })

            // Optimization: Only backup if last backup was > 60s ago
            const historyFiles = readdirSync(noteHistoryDir).filter(f => f.endsWith('.md'))
            const lastBackupTime = historyFiles.length > 0
                ? Math.max(...historyFiles.map(f => Number(f.replace('.md', ''))))
                : 0

            const nowTime = Date.now()
            if (nowTime - lastBackupTime > 60000) {
                const backupPath = join(noteHistoryDir, `${nowTime}.md`)
                writeFileSync(backupPath, existingContent, 'utf-8')
            }
        }
    }

    writeFileSync(filePath, content, 'utf-8')

    // Parse tags from content
    const tagsMatch = Array.from(content.matchAll(/(?:^|\s)(#[a-zA-Z0-9_-]+)/g))
    const tags = tagsMatch.length > 0 ? Array.from(new Set(tagsMatch.map(m => m[1]))) : []

    const meta = readMeta()
    const now = new Date().toISOString()
    if (!meta[id]) {
        meta[id] = { starred: false, pinned: false, tags, createdAt: now, updatedAt: now }
    } else {
        meta[id].updatedAt = now
        meta[id].tags = tags
    }
    writeMeta(meta)

    return { id, isNew, updatedAt: meta[id].updatedAt }
})

// IPC: Attachments Subsystem
ipcMain.handle('attachments:save', async (_event, buffer: ArrayBuffer, originalName: string) => {
    ensureNotesDir()

    const ext = extname(originalName) || '.png'
    const uniqueName = `${uuidv4()}${ext}`
    const destPath = join(ATTACHMENTS_DIR, uniqueName)

    writeFileSync(destPath, Buffer.from(buffer))

    return `noter://attachments/${uniqueName}`
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
        meta[id] = { starred: true, pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    writeMeta(meta)
    return meta[id].starred
})

// IPC: Toggle pin
ipcMain.handle('notes:togglePin', (_event, id: string) => {
    const meta = readMeta()
    if (meta[id]) {
        meta[id].pinned = !meta[id].pinned
    } else {
        meta[id] = { starred: false, pinned: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    writeMeta(meta)
    return meta[id].pinned
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
    const result = (await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
    })) as any

    // electron 29 dialog returns an object with canceled and filePaths properties.
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return null

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

// IPC: Export note (enhanced Markdown)
ipcMain.handle('notes:export', async (_event, { id, title }: { id: string; title: string }) => {
    const filePath = join(NOTES_DIR, `${id}.md`)
    if (!existsSync(filePath)) return false

    const result = (await dialog.showSaveDialog({
        defaultPath: `${title}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }]
    })) as any
    if (result.canceled || !result.filePath) return false

    const content = readFileSync(filePath, 'utf-8')

    try {
        // Use remark to add TOC and slugs
        // @ts-ignore
        const { remark } = await import('remark')
        // @ts-ignore
        const { default: remarkToc } = await import('remark-toc')
        // @ts-ignore
        const { default: remarkSlug } = await import('remark-slug')
        // @ts-ignore
        const { default: remarkGfm } = await import('remark-gfm')

        const processed = await remark()
            .use(remarkGfm)
            .use(remarkSlug)
            .use(remarkToc, { heading: 'contents|toc|table of contents', tight: true })
            .process(content)

        writeFileSync(result.filePath, String(processed), 'utf-8')
    } catch (e) {
        console.error('Failed to process markdown for export:', e)
        copyFileSync(filePath, result.filePath)
    }

    shell.showItemInFolder(result.filePath)
    return result.filePath
})

// IPC: Export PDF (using printToPDF)
ipcMain.handle('notes:exportPDF', async (event, { id, title }: { id: string; title: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false

    const result = (await dialog.showSaveDialog({
        defaultPath: `${title}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })) as any
    if (result.canceled || !result.filePath) return false

    try {
        const data = await win.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4'
        })
        writeFileSync(result.filePath, data)
        shell.showItemInFolder(result.filePath)
        return result.filePath
    } catch (e) {
        console.error('Failed to generate PDF:', e)
        return false
    }
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

// IPC: List note history
ipcMain.handle('notes:getHistory', (_event, id: string) => {
    const noteHistoryDir = join(HISTORY_DIR, id)
    if (!existsSync(noteHistoryDir)) return []

    const files = readdirSync(noteHistoryDir)
        .filter(f => f.endsWith('.md'))
        .sort((a, b) => Number(b.replace('.md', '')) - Number(a.replace('.md', ''))) // newest first

    return files.map(filename => {
        const timestamp = Number(filename.replace('.md', ''))
        const content = readFileSync(join(noteHistoryDir, filename), 'utf-8')
        const preview = content.slice(0, 100).replace(/\n/g, ' ') + (content.length > 100 ? '...' : '')
        return { timestamp, preview, path: join(noteHistoryDir, filename) }
    })
})

// IPC: Read specific revision
ipcMain.handle('notes:getRevision', (_event, path: string) => {
    try {
        if (existsSync(path)) {
            return readFileSync(path, 'utf-8')
        }
    } catch {
        // ignore
    }
    return null
})

// IPC: Settings Management
ipcMain.handle('settings:hasKey', () => {
    try {
        if (existsSync(SETTINGS_FILE)) {
            const settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'))
            return !!settings.openRouterKey
        }
    } catch { }
    return false
})

ipcMain.handle('settings:saveKey', (_event, key: string) => {
    try {
        const { safeStorage } = require('electron')
        const encrypted = safeStorage.encryptString(key).toString('base64')
        writeFileSync(SETTINGS_FILE, JSON.stringify({ openRouterKey: encrypted }), 'utf-8')
        return true
    } catch (e) {
        console.error('Failed to save key:', e)
        return false
    }
})

// IPC: AI Assistant
ipcMain.handle('ai:chat', async (_event, { messages, systemPrompt, model = 'stepfun/step-3.5-flash:free' }) => {
    try {
        const { safeStorage } = require('electron')
        if (!existsSync(SETTINGS_FILE)) throw new Error('API Key not set')

        const settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'))
        const encryptedKey = settings.openRouterKey
        if (!encryptedKey) throw new Error('API Key not set')

        const apiKey = safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'))

        const { OpenRouter } = await import('@openrouter/sdk')
        const openrouter = new OpenRouter({ apiKey })

        const fullMessages = [
            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
            ...messages
        ]

        // Using 'as any' to bypass version-specific type differences while matching user's SDK snippet
        const response = await (openrouter.chat.send as any)({
            chatGenerationParams: {
                model,
                messages: fullMessages,
            }
        })

        return { content: response.choices[0]?.message?.content || '', usage: response.usage }
    } catch (e: any) {
        console.error('AI Error:', e)
        return { error: e.message }
    }
})
