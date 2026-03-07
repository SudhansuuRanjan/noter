import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useNotes } from '../context/NotesContext'

export function Preview() {
    const { activeNote } = useNotes()

    if (!activeNote) {
        return <div className="flex-1 h-full bg-white dark:bg-zinc-950" />
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-zinc-950">
            <div className="max-w-3xl mx-auto px-8 py-6">
                <div className="
          prose prose-zinc dark:prose-invert max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-zinc-200 dark:prose-h1:border-zinc-700/50 prose-h1:pb-3
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
          prose-p:leading-7
          prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-indigo-600 dark:prose-code:text-indigo-300 prose-code:bg-indigo-50 dark:prose-code:bg-zinc-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-700/50 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:p-0
          prose-pre:code:bg-transparent prose-pre:code:text-xs prose-pre:code:p-4 prose-pre:code:block
          prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-600/5 prose-blockquote:rounded-r-xl prose-blockquote:py-0.5
          prose-hr:border-zinc-200 dark:prose-hr:border-zinc-700/50
          prose-img:rounded-xl prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-700/30
          prose-th:bg-zinc-50 dark:prose-th:bg-zinc-800/40
        ">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            input: ({ ...props }) => (
                                <input
                                    {...props}
                                    className="mr-2 accent-indigo-600 w-4 h-4 rounded"
                                />
                            )
                        }}
                    >
                        {activeNote.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    )
}
