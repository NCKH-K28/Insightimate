"use client"

import * as React from "react"
import type { JSONContent } from "@tiptap/react"

// --- Tiptap UI ---
import { CommentInput } from "@/components/tiptap-ui/comment"

interface ThreadFooterProps {
  isCommenting: boolean
  setIsCommenting: (value: boolean) => void
  onCreateComment: (content: JSONContent) => void
}

export const ThreadFooter: React.FC<ThreadFooterProps> = ({
  isCommenting,
  setIsCommenting,
  onCreateComment,
}) => (
  <div className="tiptap-thread-footer">
    <CommentInput
      onSend={onCreateComment}
      onCancel={() => setIsCommenting(false)}
      onEmptyBlur={() => setIsCommenting(false)}
      open={isCommenting}
      onOpen={() => setIsCommenting(true)}
    />
  </div>
)
