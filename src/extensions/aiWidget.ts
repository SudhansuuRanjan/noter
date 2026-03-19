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
        wrap.className = 'relative inline-block bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/30 rounded-lg py-2 px-3 shadow-sm align-middle my-1.5'

        const textSpan = document.createElement('span')
        textSpan.className = 'text-indigo-700 dark:text-indigo-300 font-medium whitespace-pre-wrap block pr-16 text-sm leading-relaxed'
        textSpan.textContent = this.data.text

        const actions = document.createElement('div')
        actions.className = 'absolute bottom-1.5 right-1.5 flex items-center gap-1 select-none bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-md border border-indigo-100 dark:border-indigo-500/20 p-1 shadow-sm'

        const acceptBtn = document.createElement('button')
        acceptBtn.className = 'p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-sm active:scale-90 flex items-center justify-center'
        acceptBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
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
        rejectBtn.className = 'p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-all cursor-pointer active:scale-90 flex items-center justify-center'
        rejectBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
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
