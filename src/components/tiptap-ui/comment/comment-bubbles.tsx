"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

// --- Contexts ---
import { useAppState } from "@/contexts/app-context"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import { CommentBubble } from "@/components/tiptap-ui/comment/comment-bubble"

// --- Styles ---
import "@/components/tiptap-ui/comment/comment-bubbles.scss"

interface Position {
  id: string
  pos: number
}

export const CommentBubbles = ({
  editor: providedEditor,
}: {
  editor?: Editor | null
}) => {
  const { editor } = useTiptapEditor(providedEditor)
  const [positions, setPositions] = React.useState<Record<number, Position>>({})
  const [editorWidth, setEditorWidth] = React.useState(0)
  const { setActiveThread } = useAppState()
  const positionsRef = React.useRef<Record<number, Position>>({})

  const commentBubbleItems = editor?.extensionStorage.commentBubbles?.items
  const bubbles = React.useMemo(
    () =>
      (commentBubbleItems ? Object.values(commentBubbleItems) : []) as Array<{
        pos: number
        threadIds: string[]
      }>,
    [commentBubbleItems]
  )

  const calculateDimensions = React.useCallback(() => {
    if (!bubbles || bubbles.length === 0 || !editor) {
      return
    }

    const newPositions: Record<number, Position> = {}
    const editorDom = editor.view.dom
    const editorRect = editorDom.getBoundingClientRect()

    setEditorWidth(editorRect.width)

    bubbles.forEach((bubble) => {
      const id = bubble.threadIds[0]
      if (!id) return

      const domNode = editorDom.querySelector(
        `[data-thread-id="${id}"]`
      ) as HTMLElement | null

      if (!domNode) return

      if (Object.values(newPositions).some((pos) => pos.id === id)) {
        return
      }

      let coords = editor.view.coordsAtPos(bubble.pos)
      const rect = domNode.getBoundingClientRect()

      // use rect if coords are not available
      if (!coords) {
        coords = {
          left: rect.left,
          top: rect.top,
          bottom: rect.bottom,
          right: rect.right,
        }
      }

      const scrollTop = window.scrollY || document.documentElement.scrollTop

      newPositions[bubble.pos] = {
        pos: coords.top + scrollTop,
        id,
      }
    })

    setPositions(newPositions)
    positionsRef.current = newPositions
  }, [bubbles, editor])

  React.useEffect(() => {
    if (!editor) return

    calculateDimensions()

    const observer = new ResizeObserver(calculateDimensions)
    observer.observe(editor.view.dom)

    const handleScroll = () => {
      requestAnimationFrame(calculateDimensions)
    }

    editor.view.root.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    const handleUpdate = () => {
      requestAnimationFrame(calculateDimensions)
    }

    editor.on("update", handleUpdate)

    return () => {
      observer.disconnect()
      editor.view.root.removeEventListener("scroll", handleScroll)
      editor.off("update", handleUpdate)
    }
  }, [calculateDimensions, editor])

  if (bubbles.length === 0 || !editor) {
    return null
  }

  return (
    <div
      className="tiptap-comment-bubbles"
      style={{ "--editor-width": `${editorWidth}px` } as React.CSSProperties}
    >
      {bubbles.map((bubble) => (
        <CommentBubble
          key={bubble.pos}
          offset={positions[bubble.pos]?.pos ?? 0}
          threadIds={bubble.threadIds}
          resolvedThreadDisplay="semi-transparent"
          onBubbleClick={(threadId) => setActiveThread(threadId)}
        />
      ))}
    </div>
  )
}
