import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'

let isUpdaterSetup = false;

export function setupAutoUpdater(): void {
    if (process.env.NODE_ENV === 'development') return
    if (isUpdaterSetup) return;
    isUpdaterSetup = true;

    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowDowngrade = false

    process.env.ELECTRON_UPDATER_ALLOW_HTTP = 'true'

    const sendToRenderer = (channel: string, data?: any) => {
        BrowserWindow.getAllWindows().forEach((win) => {
            if (!win.isDestroyed()) {
                win.webContents.send(channel, data)
            }
        })
    }

    autoUpdater.on('checking-for-update', () => {
        sendToRenderer('updater:checking')
    })

    autoUpdater.on('update-available', (info) => {
        sendToRenderer('updater:available', {
            version: info.version,
            releaseDate: info.releaseDate
        })
    })

    autoUpdater.on('update-not-available', () => {
        sendToRenderer('updater:not-available')
    })

    autoUpdater.on('download-progress', (progress) => {
        sendToRenderer('updater:download-progress', {
            percent: Math.round(progress.percent),
            transferred: progress.transferred,
            total: progress.total
        })
    })

    autoUpdater.on('update-downloaded', (info) => {
        sendToRenderer('updater:downloaded', {
            version: info.version,
            releaseDate: info.releaseDate
        })
    })

    autoUpdater.on('error', (err) => {
        console.error('Auto-update error:', err)
        sendToRenderer('updater:error', { message: err.message })
    })

    ipcMain.handle('updater:check', async () => {
        try {
            const result = await autoUpdater.checkForUpdates()
            return { updateAvailable: !!result?.updateInfo }
        } catch (err: any) {
            return { error: err.message }
        }
    })

    ipcMain.on('updater:install', () => {
        autoUpdater.quitAndInstall(false, true)
    })

    // ---------- JITTERED DISTRIBUTED SCHEDULER ----------
    const initialMinDelay = 5 * 60 * 1000      // 5 min
    const initialMaxDelay = 20 * 60 * 1000     // 20 min
    const baseInterval = 60 * 60 * 1000        // 1 hour
    const periodicJitterMax = 10 * 60 * 1000   // up to +10 min jitter each cycle

    const getRandom = (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min

    const scheduleNextCheck = () => {
        const jitter = getRandom(0, periodicJitterMax)
        const nextDelay = baseInterval + jitter

        setTimeout(async () => {
            try {
                await autoUpdater.checkForUpdatesAndNotify()
            } catch (err) {
                console.error('Auto-update periodic check failed:', err)
            }

            scheduleNextCheck()
        }, nextDelay)
    }

    // Initial randomized delay (5–20 min)
    const initialDelay = getRandom(initialMinDelay, initialMaxDelay)

    setTimeout(async () => {
        try {
            await autoUpdater.checkForUpdatesAndNotify()
        } catch (err) {
            console.error('Auto-update initial check failed:', err)
        }

        scheduleNextCheck()
    }, initialDelay)
}
