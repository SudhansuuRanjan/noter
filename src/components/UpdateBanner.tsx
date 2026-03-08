import { useState, useEffect } from 'react'
import { Download, X, RefreshCw } from 'lucide-react'

type UpdateState =
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'error'

interface UpdateInfo {
    version: string
    releaseDate: string
}

export function UpdateBanner() {
    const [state, setState] = useState<UpdateState>('idle')
    const [info, setInfo] = useState<UpdateInfo | null>(null)
    const [progress, setProgress] = useState(0)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (!window.updaterAPI) return

        window.updaterAPI.onChecking(() => {
            setState('checking')
        })

        window.updaterAPI.onAvailable((_, updateInfo) => {
            setState('available')
            setInfo(updateInfo)
            setDismissed(false)
        })

        window.updaterAPI.onNotAvailable(() => {
            setState('idle')
        })

        window.updaterAPI.onDownloadProgress((_, prog) => {
            setState('downloading')
            setProgress(prog.percent)
        })

        window.updaterAPI.onDownloaded((_, updateInfo) => {
            setState('downloaded')
            setInfo(updateInfo)
            setDismissed(false)
        })

        window.updaterAPI.onError(() => {
            setState('error')
        })

        return () => {
            window.updaterAPI?.removeAllListeners()
        }
    }, [])

    // Don't show anything when idle, checking, or dismissed
    if (state === 'idle' || state === 'checking' || dismissed) {
        return null
    }

    // Error state — auto-dismiss
    if (state === 'error') {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-600/20 rounded-lg">
                            <Download className="text-indigo-600 dark:text-indigo-400" size={18} />
                        </div>
                        <div>
                            {state === 'available' && (
                                <>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        Update Available
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Version {info?.version} is ready to download
                                    </p>
                                </>
                            )}

                            {state === 'downloading' && (
                                <>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        Downloading Update…
                                    </p>
                                    <div className="mt-1.5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                                        <div
                                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{progress}%</p>
                                </>
                            )}

                            {state === 'downloaded' && (
                                <>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        Update Ready
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        v{info?.version} — Restart to apply
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setDismissed(true)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5"
                    >
                        <X size={16} />
                    </button>
                </div>

                {state === 'downloaded' && (
                    <button
                        onClick={() => window.updaterAPI?.installUpdate()}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 active:bg-indigo-700 active:scale-[102%] transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                    >
                        <RefreshCw size={14} />
                        Restart & Update
                    </button>
                )}
            </div>
        </div>
    )
}
