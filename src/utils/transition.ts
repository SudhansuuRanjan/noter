import { flushSync } from 'react-dom'

export function withViewTransition(callback: () => void) {
    if (!document.startViewTransition) {
        callback()
        return
    }

    document.startViewTransition(() => {
        flushSync(() => {
            callback()
        })
    })
}
