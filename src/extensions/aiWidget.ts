import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, keymap } from '@codemirror/view'

export const setAISuggestion = StateEffect.define<{from: number, to: number, text: string} | null>()

class AISuggestionWidget extends WidgetType {
    constructor(readonly data: {from: number, to: number, text: string}) {
        super()
    }

    eq(other: AISuggestionWidget) {
        return other.data.text === this.data.text && other.data.from === this.data.from && other.data.to === this.data.to
    }

    toDOM(view: EditorView) {
        const wrap = document.createElement('span')
        wrap.className = 'inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-md py-[1px] px-1.5 shadow-sm align-middle my-0.5'

        const textSpan = document.createElement('span')
        textSpan.className = 'text-indigo-700 dark:text-indigo-300 font-medium whitespace-pre-wrap'
        textSpan.textContent = this.data.text

        const actions = document.createElement('span')
        actions.className = 'flex items-center gap-0.5 ml-1 select-none border-l border-indigo-200 dark:border-indigo-500/30 pl-1.5'

        const acceptBtn = document.createElement('button')
        acceptBtn.className = 'p-0.5 rounded text-indigo-600 hover:bg-indigo-200/50 dark:text-indigo-400 dark:hover:bg-indigo-500/40 transition-colors cursor-pointer'
        acceptBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        acceptBtn.title = "Accept (Enter)"
        acceptBtn.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            view.dispatch({
                changes: { from: this.data.from, to: this.data.to, insert: this.data.text },
                effects: setAISuggestion.of(null)
            })
        }

        const rejectBtn = document.createElement('button')
        rejectBtn.className = 'p-0.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-colors cursor-pointer'
        rejectBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        rejectBtn.title = "Reject (Esc)"
        rejectBtn.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            view.dispatch({
                effects: setAISuggestion.of(null)
            })
        }

        actions.appendChild(acceptBtn)
        actions.appendChild(rejectBtn)

        wrap.appendChild(textSpan)
        wrap.appendChild(actions)

        return wrap
    }
}

export const aiSuggestionField = StateField.define<{from: number, to: number, text: string} | null>({
    create() { return null },
    update(value, tr) {
        for (let e of tr.effects) {
            if (e.is(setAISuggestion)) {
                return e.value
            }
        }
        if (value && tr.docChanged) {
            const from = tr.changes.mapPos(value.from)
            const to = tr.changes.mapPos(value.to, 1)
            if (from >= to && value.from < value.to) return null 
            return { ...value, from, to }
        }
        return value
    },
    provide: f => EditorView.decorations.from(f, (val) => {
        if (!val) return Decoration.none
        
        const builder = new RangeSetBuilder<Decoration>()
        const widget = new AISuggestionWidget(val)
        
        if (val.from === val.to) {
            builder.add(val.from, val.to, Decoration.widget({
                widget,
                side: 1
            }))
        } else {
            builder.add(val.from, val.to, Decoration.replace({
                widget,
                block: false
            }))
        }
        
        return builder.finish()
    })
})

export const aiSuggestionKeymap = keymap.of([
    {
        key: 'Enter',
        run: (view) => {
            const suggestion = view.state.field(aiSuggestionField, false)
            if (suggestion) {
                view.dispatch({
                    changes: { from: suggestion.from, to: suggestion.to, insert: suggestion.text },
                    effects: setAISuggestion.of(null)
                })
                return true
            }
            return false
        }
    },
    {
        key: 'Escape',
        run: (view) => {
            const suggestion = view.state.field(aiSuggestionField, false)
            if (suggestion) {
                view.dispatch({
                    effects: setAISuggestion.of(null)
                })
                return true
            }
            return false
        }
    }
])

export const aiSuggestionSupport = () => [
    aiSuggestionField,
    aiSuggestionKeymap
]
