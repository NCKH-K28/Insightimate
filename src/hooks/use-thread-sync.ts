"use client"

import * as React from "react"
import { useAppState } from "@/contexts/app-context"
import { useCollab } from "@/contexts/collab-context"

/**
 * Hook that synchronizes thread IDs between the URL and application state.
 *
 * Extracts thread IDs from URL query parameters and activates them in the application
 * after ensuring the collaboration provider has properly synced. This ensures threads
 * referenced in shared URLs are properly activated when a document is loaded.
 *
 * @returns Object containing sync status and current thread ID being processed
 */
export const useThreadSync = () => {
  const { setActiveThread } = useAppState()
  const { provider } = useCollab()
  const [syncState, setSyncState] = React.useState({
    /**
     * Whether the collaboration provider has completed synchronization.
     */
    isSynced: false,
    /**
     * The thread ID extracted from the URL that needs to be activated.
     */
    threadId: null as string | null,
  })

  /**
   * Extracts the thread ID from the URL's query parameters.
   */
  const getThreadFromUrl = React.useCallback(() => {
    const url = new URL(window.location.href)
    return url.searchParams.get("thread_id")
  }, [])

  /**
   * Effect that extracts the thread ID from the URL on component mount.
   */
  React.useEffect(() => {
    const threadId = getThreadFromUrl()
    if (threadId) {
      window.requestAnimationFrame(() => {
        setSyncState((prev) => ({ ...prev, threadId }))
      })
    }
  }, [getThreadFromUrl])

  /**
   * Effect that listens for the collaboration provider's sync event.
   */
  React.useEffect(() => {
    if (!provider) return

    const handleSync = () => {
      setSyncState((prev) => ({ ...prev, isSynced: true }))
    }

    provider.on("synced", handleSync)

    return () => {
      provider.off("synced", handleSync)
    }
  }, [provider])

  /**
   * Effect that activates the thread once both conditions are met:
   * 1. The provider is synced
   * 2. A thread ID has been extracted from the URL
   */
  React.useEffect(() => {
    const { isSynced, threadId } = syncState
    if (isSynced && threadId) {
      setActiveThread(threadId)
      setSyncState((prev) => ({ ...prev, threadId: null }))
    }
  }, [syncState, setActiveThread])

  return {
    /**
     * Whether the collaboration provider has completed synchronization.
     */
    isSynced: syncState.isSynced,
    /**
     * The thread ID currently being processed from the URL.
     */
    currentThreadId: syncState.threadId,
  }
}
