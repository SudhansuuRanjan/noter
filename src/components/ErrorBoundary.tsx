import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.reload()
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
                    <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/30 p-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6 text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl">
                            <AlertTriangle className="w-8 h-8 shrink-0" />
                            <div>
                                <h1 className="text-lg font-bold text-rose-700 dark:text-rose-400">Something went wrong</h1>
                                <p className="text-sm text-rose-600/80 dark:text-rose-400/80">The application encountered an unexpected error.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            {this.state.error && (
                                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                                    <p className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="text-xs text-zinc-500 dark:text-zinc-500 font-mono whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg transition-colors active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload Application
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
