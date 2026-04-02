import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, Send, BrainCircuit, Languages, Wand2, RefreshCw, Copy, Check } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { withViewTransition } from '../utils/transition'
import { useHotkey } from '@tanstack/react-hotkeys'

interface AICommandProps {
    isOpen: boolean
    onClose: () => void
    initialPrompt?: string
    selectionText?: string
    onApply?: (result: string) => void
}

export const AICommand: React.FC<AICommandProps> = ({
    isOpen,
    onClose,
    initialPrompt = '',
    selectionText = '',
    onApply
}) => {
    const [prompt, setPrompt] = useState(initialPrompt)
    const [result, setResult] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCopied, setIsCopied] = useState(false)
    const [hasKey, setHasKey] = useState<boolean | null>(null)
    const { activeNote } = useNotes()

    useHotkey('Escape', () => {
        withViewTransition(onClose)
    }, { enabled: isOpen })

    useEffect(() => {
        if (isOpen) {
            const checkKey = async () => {
                const has = await window.electronAPI.hasKey()
                setHasKey(has)
            }
            checkKey()
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen) {
            setPrompt(initialPrompt)
            setResult('')
            setError(null)
        }
    }, [isOpen, initialPrompt, selectionText])

    const buildPromptWithContext = (userPrompt: string) => {
        const trimmedPrompt = userPrompt.trim()
        const context = selectionText || activeNote?.content || ''

        if (!context) {
            return trimmedPrompt
        }

        if (selectionText) {
            return `Use the selected text below as context for the request.\n\nSelected text:\n${context}\n\nRequest:\n${trimmedPrompt}`
        }

        return `Use the current note below as context for the request.\n\nCurrent note:\n${context}\n\nRequest:\n${trimmedPrompt}`
    }

    const handleRunAI = async (actionPrompt: string, customSystemPrompt?: string) => {
        setIsLoading(true)
        setError(null)
        setResult('')

        try {
            const hasKey = await window.electronAPI.hasKey()
            if (!hasKey) {
                setError('API Key not found. Please configure it in settings.')
                setIsLoading(false)
                return
            }

            const response = await window.electronAPI.aiChat({
                messages: [{ role: 'user', content: actionPrompt }],
                systemPrompt: customSystemPrompt || 'You are a helpful AI writing assistant. Your output should be pure Markdown only, without any preamble or conversational filler.'
            })

            if (response.error) {
                setError(response.error)
            } else {
                setResult(response.content || '')
            }
        } catch (e: any) {
            setError(e.message || 'AI request failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = (type: 'rephrase' | 'summarize' | 'grammar' | 'continue') => {
        let actionPrompt = ''
        let systemPrompt = 'You are a helpful AI writing assistant. Return ONLY the transformed text in Markdown.'

        const context = selectionText || activeNote?.content || ''

        switch (type) {
            case 'rephrase':
                actionPrompt = `Rephrase this text while maintaining its meaning, but make it more professional:\n\n${context}`
                break
            case 'summarize':
                actionPrompt = `Summarize the following text into a concise list of bullet points:\n\n${context}`
                break
            case 'grammar':
                actionPrompt = `Fix any spelling or grammar mistakes in this text. Maintain the original tone and formatting:\n\n${context}`
                break
            case 'continue':
                actionPrompt = `Continue writing this note based on the existing content:\n\n${context}`
                break
        }

        handleRunAI(actionPrompt, systemPrompt)
    }

    const handleCopy = async () => {
        if (!result) return
        try {
            await navigator.clipboard.writeText(result)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => withViewTransition(onClose)}
        >
            <div 
                className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Writer & Editor</h2>
                    </div>
                    <button
                        onClick={() => withViewTransition(onClose)}
                        className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {hasKey === false && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-start gap-3">
                            <Wand2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">API Key Required</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Please configure your AI API key in Settings to use the AI command palette.</p>
                                <button
                                    onClick={() => { withViewTransition(onClose); window.dispatchEvent(new Event('open-settings')); }}
                                    className="mt-2 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors"
                                >
                                    Open Settings
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={hasKey === false ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleAction('rephrase')} disabled={!hasKey || isLoading} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Rephrase
                                </button>
                                <button onClick={() => handleAction('summarize')} disabled={!hasKey || isLoading} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" /> Summarize
                                </button>
                                <button onClick={() => handleAction('grammar')} disabled={!hasKey || isLoading} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <Languages className="w-3.5 h-3.5 text-indigo-500" /> Fix Grammar
                                </button>
                                <button onClick={() => handleAction('continue')} disabled={!hasKey || isLoading} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> Continue Writing
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={!hasKey || isLoading}
                                    placeholder="What should the AI do? (e.g., 'Write a poem about space')"
                                    className="w-full h-24 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all disabled:opacity-50"
                                />
                                <button
                                    onClick={() => handleRunAI(buildPromptWithContext(prompt))}
                                    disabled={isLoading || !prompt.trim() || !hasKey}
                                    className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow transition-all group"
                                >
                                    <Send className="w-4 h-4 group-active:translate-x-1 group-active:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {(isLoading || result || error) && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>AI Result</>
                                )}
                            </h3>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[100px] relative">
                                {error ? (
                                    <div className="text-rose-500 text-sm flex items-center gap-2">
                                        <X className="w-4 h-4" /> {error}
                                    </div>
                                ) : (
                                    <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                                        {result}
                                    </pre>
                                )}
                            </div>

                            {result && !isLoading && (
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 active:scale-95 border border-zinc-200 dark:border-zinc-700/50"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy Content
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => withViewTransition(() => { if (onApply) onApply(result); onClose(); })}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        Apply to {selectionText ? 'Selection' : 'Note'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
