import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { ExternalLink, X, Copy, Check } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { useEffect, useRef, useState } from 'react'
import { common } from 'lowlight'

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-300 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 z-10 shadow-sm"
            title="Copy code"
        >
            {copied ? <Check size={14} className="text-green-600 dark:text-green-400" /> : <Copy size={14} />}
        </button>
    )
}

const MermaidRenderer = ({ content }: { content: string }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            if (containerRef.current) {
                try {
                    // Dynamically import mermaid only when a diagram is rendered
                    const m = (await import('mermaid')).default
                    m.initialize({
                        startOnLoad: false,
                        theme: 'default',
                        securityLevel: 'strict',
                        fontFamily: 'inherit'
                    })
                    if (isMounted) {
                        containerRef.current.removeAttribute('data-processed')
                        await m.run({ nodes: [containerRef.current] })
                    }
                } catch (e) {
                    console.error("Failed to render mermaid diagram", e)
                }
            }
        }
        renderDiagram()
        return () => { isMounted = false }
    }, [content])

    return (
        <div ref={containerRef} className="mermaid flex justify-center my-4">
            {content}
        </div>
    )
}

export function Preview() {
    const { activeNote, openNoteByTitle } = useNotes()
    const [linkModalId, setLinkModalId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
    }, [activeNote?.id])

    if (!activeNote) {
        return <div className="flex-1 h-full bg-white dark:bg-zinc-950" />
    }

    const { state } = useNotes()

    const getWidthClass = () => {
        switch (state.previewWidth) {
            case 'full': return 'w-full px-8'
            case 'large': return 'max-w-6xl mx-auto px-8'
            case 'medium':
            default: return 'max-w-4xl mx-auto px-8'
        }
    }

    return (
        <div ref={scrollRef} className="flex-1 h-full overflow-y-auto bg-white dark:bg-zinc-950 scroll-smooth select-text cursor-text">
            <div className={`${getWidthClass()} py-6 transition-all duration-300`}>
                <div className="
          prose prose-zinc dark:prose-invert max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-zinc-200 dark:prose-h1:border-zinc-700/50 prose-h1:pb-3
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
          prose-p:leading-7
          prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-indigo-600 prose-code:font-medium dark:prose-code:text-indigo-300 prose-code:bg-zinc-100/80 dark:prose-code:bg-zinc-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-700/50 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:p-0
          prose-pre:code:bg-transparent prose-pre:code:text-xs prose-pre:code:p-4 prose-pre:code:block
          prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-600/5 prose-blockquote:rounded-r-xl prose-blockquote:py-0.5
          prose-hr:border-zinc-200 dark:prose-hr:border-zinc-700/50
          prose-img:rounded-xl prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-700/30
          prose-table:w-full prose-table:my-6 prose-table:border prose-table:border-zinc-200 dark:prose-table:border-zinc-800/60 prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-sm
          prose-th:bg-zinc-50 dark:prose-th:bg-zinc-800/40 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-zinc-200 dark:prose-th:border-zinc-800/60
          prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-zinc-100 dark:prose-td:border-zinc-800/40
          prose-tr:hover:bg-zinc-50/80 dark:prose-tr:hover:bg-zinc-800/30 prose-tr:transition-colors prose-tr:border-none
        ">
                    <ReactMarkdown
                        urlTransform={(value: string) => {
                            // Only allow safe protocols
                            const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:']
                            const internalProtocols = ['noter:', 'noteref:']

                            try {
                                const url = new URL(value)
                                if (!safeProtocols.includes(url.protocol) && !internalProtocols.includes(url.protocol)) {
                                    return ''
                                }
                            } catch (e) {
                                // If not a valid absolute URL, it might be a relative path or an internal link we handle below
                                if (value.startsWith('javascript:') || value.startsWith('data:')) {
                                    return ''
                                }
                            }

                            // Auto-fix GitHub blob URLs to raw URLs
                            if (value.startsWith('https://github.com/') && value.includes('/blob/')) {
                                return value
                                    .replace('github.com', 'raw.githubusercontent.com')
                                    .replace('/blob/', '/')
                            }

                            if (value.startsWith('http') || value.startsWith('https') || value.startsWith('noter://') || value.startsWith('noteref://') || value.startsWith('mailto:')) {
                                return value
                            }
                            // Handle relative paths
                            if (activeNote.filePath && !value.startsWith('/')) {
                                try {
                                    // Use path components to find dir. 
                                    const dir = activeNote.filePath.split('/').slice(0, -1).join('/')
                                    const absolutePath = `${dir}/${value.replace(/^\.\//, '')}`
                                    return `noter://local/${encodeURIComponent(absolutePath)}`
                                } catch (e) {
                                    console.error('Failed to resolve relative path', e)
                                }
                            }
                            return value
                        }}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                            [rehypeSanitize, {
                                ...defaultSchema,
                                protocols: {
                                    ...defaultSchema.protocols,
                                    href: [...(defaultSchema.protocols?.href || []), 'noter', 'noteref'],
                                    src: [...(defaultSchema.protocols?.src || []), 'noter']
                                }
                            }],
                            [rehypeHighlight, { languages: common }],
                            [rehypeKatex, {
                                macros: {
                                    "\\f": "#1f(#2)"
                                }
                            }]
                        ]}
                        components={{
                            pre({ node, children, ...props }) {
                                const getTextContext = (element: any): string => {
                                    if (!element) return ''
                                    if (element.type === 'text') return element.value || ''
                                    if (element.children) {
                                        const childrenArr = Array.isArray(element.children) ? element.children : [element.children]
                                        return childrenArr.map(getTextContext).join('')
                                    }
                                    return ''
                                }
                                const codeString = getTextContext(node).replace(/\n$/, '')

                                return (
                                    <div className="relative group mt-5 mb-4">
                                        <CopyButton text={codeString} />
                                        <pre {...props} className="m-0 border border-zinc-200 dark:border-zinc-700/50 rounded-xl overflow-x-auto">
                                            {children}
                                        </pre>
                                    </div>
                                )
                            },
                            code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match
                                const content = String(children).replace(/\n$/, '')
                                if (!isInline && match && match[1] === 'mermaid') {
                                    return <MermaidRenderer content={content} />
                                }
                                return (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            input: ({ node, disabled, ...props }) => (
                                <input
                                    {...props}
                                    readOnly
                                    onClick={(e) => e.preventDefault()}
                                    className="mr-2 accent-indigo-600 w-4 h-4 rounded cursor-default"
                                />
                            ),
                            a: ({ href, children, ...props }) => {
                                if (href?.startsWith('noteref://')) {
                                    const targetId = decodeURIComponent(href.replace('noteref://', ''))
                                    return (
                                        <span
                                            role="link"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (targetId) setLinkModalId(targetId)
                                            }}
                                            className="text-indigo-600 dark:text-indigo-400 no-underline hover:underline cursor-pointer border-b border-indigo-200 dark:border-indigo-900/50 pb-0.5"
                                            title="Open note"
                                        >
                                            {children}
                                        </span>
                                    )
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
                            }
                        }}
                    >
                        {activeNote.content.replace(/\[\[(.*?)\]\]/g, (_, inner) => {
                            const [target, alias] = inner.split('|')
                            const label = alias || target
                            return `[${label}](noteref://${encodeURIComponent(target.trim())})`
                        })}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Link Open Modal */}
            {linkModalId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <ExternalLink className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Open Note</h2>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Choose viewing mode</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLinkModalId(null)}
                                className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                How would you like to open this linked note?
                            </p>

                            <div className="flex flex-col gap-2.5 pt-2">
                                <button
                                    onClick={() => {
                                        openNoteByTitle(linkModalId, false)
                                        setLinkModalId(null)
                                    }}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                                >
                                    Open in Current Window
                                </button>

                                <button
                                    onClick={() => {
                                        openNoteByTitle(linkModalId, true)
                                        setLinkModalId(null)
                                    }}
                                    className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
                                >
                                    Open in New Window
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
