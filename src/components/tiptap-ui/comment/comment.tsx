"use client"

import * as React from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import type { TCollabComment } from "@tiptap-pro/provider"
import type { Editor, JSONContent } from "@tiptap/react"

// --- Contexts ---
import { useUser } from "@/contexts/user-context"

// --- Icons ---
import { TrashIcon } from "@/components/tiptap-icons/trash-icon"
import { PencilIcon } from "@/components/tiptap-icons/pencil-icon"
import { EllipsisIcon } from "@/components/tiptap-icons/ellipsis-icon"

// --- Lib ---
import { getAvatar } from "@/lib/tiptap-collab-utils"

// --- Tiptap UI ---
import { CommentContent } from "@/components/tiptap-ui/comment"
import { CommentInput } from "@/components/tiptap-ui/comment"
import { CommentReactions } from "@/components/tiptap-ui/comment"

// --- UI Primitives ---
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/tiptap-ui-primitive/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"

// --- Styles ---
import "@/components/tiptap-ui/comment/comment.scss"

dayjs.extend(relativeTime)

export const Comment = ({
  editor: providedEditor,
  comment,
  hideDelete,
  onDelete,
  onEdit,
  onReact,
}: {
  editor?: Editor | null
  comment: TCollabComment
  hideDelete?: boolean
  onDelete?: (commentId: string) => void
  onEdit?: (commentId: string, newContent: JSONContent) => void
  onReact?: (commentId: string, reactionId: string) => void
}) => {
  const { id } = comment
  const { user } = useUser()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isCommentReactionOpen, setIsCommentReactionOpen] =
    React.useState(false)
  const [showReactionButton, setShowReactionButton] = React.useState(false)

  const isCommentOwner = user.id === comment.data.authorId

  const handleDelete = React.useCallback(() => {
    onDelete?.(id)
  }, [onDelete, id])

  const handleEdit = React.useCallback(
    (newContent: JSONContent) => {
      onEdit?.(id, newContent)
      setIsEditing(false)
    },
    [onEdit, id]
  )

  const handleReact = React.useCallback(
    (reactionId: string) => {
      onReact?.(id, reactionId)
    },
    [onReact, id]
  )

  const hasReactions = React.useMemo(() => {
    return Object.values(comment.data.reactions || {}).some((value) => {
      const users = value as string[]
      return users.length > 0
    })
  }, [comment.data.reactions])

  if (comment.deletedAt) {
    return null
  }

  return (
    <div
      className="tiptap-comment"
      key={comment.id}
      onMouseEnter={() => setShowReactionButton(true)}
      onMouseLeave={() =>
        !hasReactions && !isCommentReactionOpen && setShowReactionButton(false)
      }
    >
      <Avatar>
        <AvatarImage
          src={getAvatar(comment.data.authorName)}
          alt={comment.data.authorName}
        />
        <AvatarFallback>
          {comment.data.authorName?.toUpperCase()[0]}
        </AvatarFallback>
      </Avatar>

      {!isEditing && (
        <div className="tiptap-comment-panel">
          <div className="tiptap-comment-details">
            <div className="tiptap-comment-information">
              <div className="tiptap-comment-meta">
                <div className="tiptap-comment-author">
                  {comment.data.authorName}
                </div>
                <div className="tiptap-comment-date">
                  <div className="tiptap-comment-date-created">
                    {dayjs(comment.createdAt).fromNow()}
                  </div>
                  {comment.data.editedAt && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="tiptap-comment-date-edited">
                          (edited)
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {dayjs(comment.data.editedAt).fromNow()}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {comment.deletedAt ? (
                <div className="deleted-message">Comment was deleted</div>
              ) : (
                <>
                  <CommentContent comment={comment.content as JSONContent} />
                  {hasReactions && (
                    <CommentReactions
                      onReact={handleReact}
                      reactions={comment.data?.reactions || {}}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {!comment.deletedAt && (
            <div className="tiptap-comment-actions">
              {isCommentOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-size="small"
                      data-style="ghost"
                      tooltip="Comment options"
                    >
                      <EllipsisIcon className="tiptap-button-icon" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent side="left" align="start">
                    <Card>
                      <CardBody>
                        <ButtonGroup>
                          <DropdownMenuItem asChild>
                            <Button
                              data-style="ghost"
                              onClick={() => setIsEditing(true)}
                            >
                              <PencilIcon className="tiptap-button-icon" />
                              <span className="tiptap-button-text">
                                Edit comment
                              </span>
                            </Button>
                          </DropdownMenuItem>

                          {!hideDelete && (
                            <DropdownMenuItem asChild>
                              <Button data-style="ghost" onClick={handleDelete}>
                                <TrashIcon className="tiptap-button-icon" />
                                <span className="tiptap-button-text">
                                  Delete comment
                                </span>
                              </Button>
                            </DropdownMenuItem>
                          )}
                        </ButtonGroup>
                      </CardBody>
                    </Card>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {showReactionButton && !hasReactions && (
                <CommentReactions
                  editor={providedEditor}
                  onReact={handleReact}
                  onOpenChange={(open) => setIsCommentReactionOpen(open)}
                  reactions={comment.data?.reactions || {}}
                />
              )}
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <CommentInput
          onSend={handleEdit}
          onCancel={() => setIsEditing(false)}
          onEmptyBlur={() => setIsEditing(false)}
          content={comment.content}
          showCancel
        />
      )}
    </div>
  )
}
