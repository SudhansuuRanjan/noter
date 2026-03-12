import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Key, ShieldCheck, AlertCircle, X, Sparkles, Settings as SettingsIcon, Palette } from 'lucide-react'
import { useNotes } from '../context/NotesContext'

interface AISettingsProps {
    isOpen: boolean
    onClose: () => void
}

const THEMES = [
    { id: 'indigo', name: 'Indigo', color: 'bg-[#6366f1]' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-500' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
    { id: 'violet', name: 'Violet', color: 'bg-violet-500' },
    { id: 'amber', name: 'Amber', color: 'bg-amber-500' },
    { id: 'cyan', name: 'Cyan', color: 'bg-cyan-500' },
    { id: 'pink', name: 'Pink', color: 'bg-pink-500' },
]

export const AISettings: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
    const { state, setAccentColor, setPreviewWidth } = useNotes()
    const [apiKey, setApiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [hasKey, setHasKey] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [activeTab, setActiveTab] = useState<'appearance' | 'ai'>('appearance')

    useEffect(() => {
        if (isOpen) {
            window.electronAPI.hasKey().then(setHasKey)
        }
    }, [isOpen])

    const handleSave = async () => {
        if (!apiKey.startsWith('sk-or-')) {
            setStatus({ type: 'error', message: 'Invalid OpenRouter Key format (sk-or-...)' })
            return
        }

        setIsSaving(true)
        setStatus(null)
        try {
            const success = await window.electronAPI.saveKey(apiKey)
            if (success) {
                setStatus({ type: 'success', message: 'API Key encrypted and saved!' })
                setHasKey(true)
                setApiKey('')
            } else {
                setStatus({ type: 'error', message: 'Failed to save key securelly.' })
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'An unexpected error occurred.' })
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <SettingsIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">App Settings</h2>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Preferences & Integrations</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                <div className="flex border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900">
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors border-b-2 ${activeTab === 'appearance' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        Appearance
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors border-b-2 ${activeTab === 'ai' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        AI Assistant
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                                    <Palette className="w-3.5 h-3.5" />
                                    Accent Color
                                </label>
                                <div className="grid grid-cols-7 gap-3">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => setAccentColor(theme.id)}
                                            className={`
                                                relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all
                                                ${state.accentColor === theme.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            <div className={`size-6 rounded-full shadow-sm ${theme.color} ring-1 ring-black/10 dark:ring-white/10`} />
                                            <span className={`text-[10px] font-medium ${state.accentColor === theme.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                {theme.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                                    Editor Content Width
                                </label>
                                <div className="flex gap-3">
                                    {[
                                        { id: 'medium', label: 'Medium (Optimal)' },
                                        { id: 'large', label: 'Large' },
                                        { id: 'full', label: 'Full Width' }
                                    ].map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => setPreviewWidth(option.id as 'medium' | 'large' | 'full')}
                                            className={`
                                                flex-1 py-2 px-3 text-xs font-medium rounded-xl border transition-all
                                                ${state.previewWidth === option.id
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                                                    : 'bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                                                }
                                            `}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">OpenRouter API Key</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Key className="w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={hasKey ? "••••••••••••••••" : "sk-or-v1-..."}
                                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5 px-1 leading-relaxed">
                                    <ShieldCheck className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-500" />
                                    Your key is encrypted locally using the OS Keychain/DPAPI and never stored in plain text.
                                </p>
                            </div>

                            {status && (
                                <div className={`p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200 ${status.type === 'success' ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50' : 'bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50'
                                    }`}>
                                    {status.type === 'success' ? (
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                    <span className={`text-xs font-medium ${status.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                        {status.message}
                                    </span>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !apiKey}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {hasKey ? 'Update API Key' : 'Save Connection'}
                                </button>
                            </div>

                            <div className="pt-3 flex items-center justify-center">
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    Don't have a key? Get one at <a href="https://openrouter.ai/" target="_blank" className="text-indigo-500 hover:underline">openrouter.ai</a>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
