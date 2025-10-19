"use client"

import * as React from "react"
import { autoPlacement, flip, offset, shift } from "@floating-ui/react"
import type { Editor } from "@tiptap/react"

// --- Contexts ---
import { useAppState } from "@/contexts/app-context"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useThreadPositionRect } from "@/hooks/use-thread-position"
import { useThreadSync } from "@/hooks/use-thread-sync"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import { FloatingElement } from "@/components/tiptap-ui-utils/floating-element"
import { Thread } from "@/components/tiptap-ui/thread"

interface ThreadFloatingProps {
  editor?: Editor | null
}

export const ThreadFloating = ({
  editor: providedEditor,
}: ThreadFloatingProps) => {
  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsMobile()
  const { activeThread, setActiveThread, threadBubbles } = useAppState()

  useThreadSync()
  const positionRect = useThreadPositionRect({
    mode: "thread-only",
    editor,
    activeThread,
    threadBubbles,
  })

  const shouldShow = React.useMemo(() => !!activeThread, [activeThread])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        setActiveThread(null)
      }
    },
    [setActiveThread]
  )

  const getBoundingClientRect = React.useCallback(() => {
    return positionRect
  }, [positionRect])

  if (!activeThread || !editor) {
    return null
  }

  return (
    <FloatingElement
      editor={editor}
      shouldShow={shouldShow}
      updateOnScroll={false}
      onOpenChange={handleOpenChange}
      getBoundingClientRect={getBoundingClientRect}
      floatingOptions={{
        placement: "bottom-start",
        middleware: [
          autoPlacement({
            allowedPlacements: ["bottom-start", "bottom-end"],
          }),
          shift(),
          flip(),
          offset({
            crossAxis: 0,
            mainAxis: -32,
            alignmentAxis: 0,
          }),
        ],
      }}
      {...(isMobile
        ? {
            style: {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              margin: ".5rem",
              zIndex: 50,
            },
          }
        : {})}
    >
      <Thread />
    </FloatingElement>
  )
}
