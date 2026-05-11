import { useEffect, useRef, useState } from 'react'

const storeLifetimes = new WeakMap()

export default function useForestryLocal(factory, ...rest) {
  const [store] = useState(() => factory(...rest))
  const retainedStore = useRef(false)
  const [value, setValue] = useState(store.value)

  useEffect(() => {
    let lifetime = storeLifetimes.get(store)

    if (!lifetime) {
      lifetime = {
        cleanupTimer: null,
        refs: 0,
      }
      storeLifetimes.set(store, lifetime)
    }

    lifetime.refs += 1
    retainedStore.current = true

    if (lifetime.cleanupTimer) {
      clearTimeout(lifetime.cleanupTimer)
      lifetime.cleanupTimer = null
    }

    const sub = store.subscribe((nextValue) => {
      setValue(nextValue)
    })

    return () => {
      sub?.unsubscribe?.()

      const currentLifetime = storeLifetimes.get(store)

      if (!currentLifetime || !retainedStore.current) {
        return
      }

      retainedStore.current = false
      currentLifetime.refs = Math.max(0, currentLifetime.refs - 1)

      if (currentLifetime.refs > 0) {
        return
      }

      currentLifetime.cleanupTimer = setTimeout(() => {
        const latestLifetime = storeLifetimes.get(store)

        if (!latestLifetime || latestLifetime.refs > 0) {
          return
        }

        store.complete()
        storeLifetimes.delete(store)
      }, 1000)
    }
  }, [store])

  return [value, store]
}
