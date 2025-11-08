"use client"

import * as React from "react"
import type { JSONContent, Editor } from "@tiptap/react"
import { NodeSelection } from "@tiptap/pm/state"

// --- Contexts ---
import { useUser } from "@/contexts/user-context"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUiEditorState } from "@/hooks/use-ui-editor-state"

// --- Lib ---
import { isSelectionValid } from "@/lib/tiptap-collab-utils"

// --- Tiptap UI ---
import { FloatingElement } from "@/components/tiptap-ui-utils/floating-element"
import { CommentInput } from "@/components/tiptap-ui/comment"

interface CommentInputFloatingProps {
  editor?: Editor | null
}

export const CommentInputFloating = ({
  editor: providedEditor,
}: CommentInputFloatingProps) => {
  const { editor } = useTiptapEditor(providedEditor)
  const { user } = useUser()
  const isMobile = useIsMobile()
  const { commentInputVisible } = useUiEditorState(editor)
  const [shouldShow, setShouldShow] = React.useState(false)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setShouldShow(
        isSelectionValid(editor, editor.state.selection) && commentInputVisible
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, commentInputVisible])

  const handleSend = React.useCallback(
    (content: JSONContent) => {
      if (!editor) return

      const { selection } = editor.view.state
      const { from, to } = selection

      if (selection instanceof NodeSelection) {
        editor.chain().focus().setTextSelection({ from, to }).run()
      }

      const commentData = {
        authorId: user.id,
        authorName: user.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      editor
        .chain()
        .focus()
        .setThread({
          content,
          commentData,
          data: commentData,
        })
        .run()

      editor.commands.commentInputHide()
    },
    [editor, user.id, user.name]
  )

  return (
    <FloatingElement
      shouldShow={shouldShow}
      floatingOptions={{
        placement: "bottom",
        onOpenChange: (isOpen) => {
          if (!isOpen) editor?.commands.commentInputHide()
        },
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
      <CommentInput onSend={handleSend} floating />
    </FloatingElement>
  )
}
