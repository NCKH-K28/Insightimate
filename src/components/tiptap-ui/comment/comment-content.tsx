"use client"

import * as React from "react"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Mention } from "@tiptap/extension-mention"
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji"

export const CommentContent = ({ comment }: { comment: JSONContent }) => {
  const previewEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        gapcursor: false,
      }),
      Emoji.configure({
        emojis: gitHubEmojis.filter(
          (emoji) => !emoji.name.includes("regional")
        ),
        forceFallbackImages: true,
      }),
      Mention,
    ],
    editable: false,
    content: comment,
  })

  React.useEffect(() => {
    if (previewEditor) {
      previewEditor.commands.setContent(comment)
    }
  }, [comment, previewEditor])

  if (!previewEditor) {
    return null
  }

  return (
    <EditorContent className="tiptap-comment-content" editor={previewEditor} />
  )
}
