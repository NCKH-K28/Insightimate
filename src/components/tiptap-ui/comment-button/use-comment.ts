"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import { useHotkeys } from "react-hotkeys-hook"
import type { TCollabThread } from "@tiptap-pro/provider"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useIsMobile } from "@/hooks/use-mobile"

// --- Lib ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

// --- Contexts ---
import { useThreadState } from "@/contexts/thread-store"

// --- Icons ---
import { MessageSquarePlusIcon } from "@/components/tiptap-icons/message-square-plus-icon"

export const COMMENT_SHORTCUT_KEY = "mod+shift+m"

/**
 * Configuration for the comment functionality
 */
export interface UseCommentConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when commenting is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Control visibility for resolved block threads
   * @default true
   */
  showOnResolvedBlockThreads?: boolean
  /**
   * Callback function called after a successful comment addition.
   */
  onCommented?: () => void
}

/**
 * Get the thread ID from the current block thread selection in the editor
 */
export function getSelectedThreadId(editor: Editor | null): string | null {
  if (!editor) return null

  const { selection } = editor.state
  const { $from } = selection
  const node = $from.parent

  if (node.type.name === "blockThread") {
    return node.attrs["data-thread-id"] || null
  }

  return null
}

/**
 * Checks if a comment can be added in the current editor state
 */
export function canAddComment(
  editor: Editor | null,
  threads: TCollabThread[],
  showOnResolvedBlockThreads: boolean
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("blockThread", editor)) return false

  const { selection } = editor.state

  if (!selection || selection.empty) {
    return false
  }

  let shouldShow: boolean = true
  const isBlockThread = editor.isActive("blockThread")

  if (isBlockThread) {
    const threadId = getSelectedThreadId(editor)
    const thread = threadId ? threads.find((t) => t.id === threadId) : null
    const isResolved = !!thread?.resolvedAt

    // Only show on resolved block threads if enabled
    shouldShow = isResolved ? showOnResolvedBlockThreads : false
  }

  // If not on a thread, show if the schema supports block threads
  // Only hide if hideWhenUnavailable is true and blockThreadInSchema is false
  return shouldShow
}

/**
 * Adds a comment in the editor
 */
export function addComment(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("blockThread", editor)) return false

  const blockThreadInSchema = isNodeInSchema("blockThread", editor)

  if (!blockThreadInSchema) {
    console.warn("Block thread node is not available in the editor schema.")
    return false
  }

  editor.commands.commentInputShow()

  return true
}

/**
 * Determines if the comment button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  threads: TCollabThread[]
  hideWhenUnavailable: boolean
  showOnResolvedBlockThreads: boolean
}): boolean {
  const { editor, threads, hideWhenUnavailable, showOnResolvedBlockThreads } =
    props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("blockThread", editor)) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canAddComment(editor, threads, showOnResolvedBlockThreads)
  }

  return true
}

/**
 * Custom hook that provides comment functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage - no params needed
 * function MySimpleCommentButton() {
 *   const { isVisible, handleComment } = useComment()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleComment}>Add Comment</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedCommentButton() {
 *   const { isVisible, handleComment, label } = useComment({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onCommented: () => console.log('Comment added!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleComment}
 *       aria-label={label}
 *     >
 *       Add Comment
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useComment(config?: UseCommentConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    showOnResolvedBlockThreads = true,
    onCommented,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsMobile()
  const { threads } = useThreadState()
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const canComment = canAddComment(editor, threads, showOnResolvedBlockThreads)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowButton({
          editor,
          threads,
          hideWhenUnavailable,
          showOnResolvedBlockThreads,
        })
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, threads, hideWhenUnavailable, showOnResolvedBlockThreads])

  const handleComment = React.useCallback(() => {
    if (!editor) return false

    const success = addComment(editor)
    if (success) {
      onCommented?.()
    }
    return success
  }, [editor, onCommented])

  useHotkeys(
    COMMENT_SHORTCUT_KEY,
    (event) => {
      event.preventDefault()
      handleComment()
    },
    {
      enabled: isVisible && canComment,
      enableOnContentEditable: !isMobile,
      enableOnFormTags: true,
    }
  )

  return {
    isVisible,
    handleComment,
    canComment,
    label: "Add comment",
    shortcutKeys: COMMENT_SHORTCUT_KEY,
    Icon: MessageSquarePlusIcon,
  }
}
