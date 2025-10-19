"use client"

import * as React from "react"
import type { TCollabThread } from "@tiptap-pro/provider"

// --- Icons ---
import { CheckIcon } from "@/components/tiptap-icons/check-icon"
import { ChevronLeftIcon } from "@/components/tiptap-icons/chevron-left-icon"
import { ChevronRightIcon } from "@/components/tiptap-icons/chevron-right-icon"
import { CircleCheckIcon } from "@/components/tiptap-icons/circle-check-icon"
import { CloseIcon } from "@/components/tiptap-icons/close-icon"
import { EllipsisIcon } from "@/components/tiptap-icons/ellipsis-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { RotateCcwIcon } from "@/components/tiptap-icons/rotate-ccw-icon"
import { TrashIcon } from "@/components/tiptap-icons/trash-icon"

// --- UI Primitives ---
import { Badge } from "@/components/tiptap-ui-primitive/badge"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"

interface ThreadHeaderProps {
  thread: TCollabThread
  threadCount: number
  currentThreadIndex: number
  onPrevThread: () => void
  onNextThread: () => void
  onResolveUnresolve: () => void
  onCopyLink: () => void
  onDelete: () => void
  onClose: () => void
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({
  thread,
  threadCount,
  currentThreadIndex,
  onPrevThread,
  onNextThread,
  onResolveUnresolve,
  onCopyLink,
  onDelete,
  onClose,
}) => (
  <div className="tiptap-thread-header">
    {threadCount > 1 && (
      <ButtonGroup orientation="horizontal">
        <Button
          data-style="ghost"
          disabled={currentThreadIndex === 0}
          onClick={onPrevThread}
        >
          <ChevronLeftIcon className="tiptap-button-icon" />
        </Button>
        <Button
          data-style="ghost"
          disabled={currentThreadIndex === threadCount - 1}
          onClick={onNextThread}
        >
          <ChevronRightIcon className="tiptap-button-icon" />
        </Button>
      </ButtonGroup>
    )}

    <div className="tiptap-thread-header-title">
      {threadCount > 1
        ? `${currentThreadIndex + 1} of ${threadCount}`
        : "Thread"}
    </div>

    <ButtonGroup orientation="horizontal">
      {!thread.resolvedAt ? (
        <Button
          data-style="ghost"
          onClick={onResolveUnresolve}
          tooltip={thread.resolvedAt ? "Unresolve thread" : "Resolve thread"}
          shortcutKeys="Ctrl-Shift-s"
        >
          {thread.resolvedAt ? (
            <RotateCcwIcon className="tiptap-button-icon" />
          ) : (
            <CircleCheckIcon className="tiptap-button-icon" />
          )}
        </Button>
      ) : (
        <Badge data-style="gray">
          <CheckIcon className="tiptap-badge-icon" />
          <span className="tiptap-badge-text">Resolved</span>
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-style="ghost" tooltip="Thread options">
            <EllipsisIcon className="tiptap-button-icon" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="left" align="start">
          <Card>
            <CardBody>
              <ButtonGroup>
                <DropdownMenuItem asChild>
                  <Button data-style="ghost" onClick={onResolveUnresolve}>
                    {thread.resolvedAt ? (
                      <RotateCcwIcon className="tiptap-button-icon" />
                    ) : (
                      <CheckIcon className="tiptap-button-icon" />
                    )}
                    <span className="tiptap-button-text">
                      {thread.resolvedAt ? "Unresolve" : "Resolve"}
                    </span>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button data-style="ghost" onClick={onCopyLink}>
                    <LinkIcon className="tiptap-button-icon" />
                    <span className="tiptap-button-text">Copy link</span>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button data-style="ghost" onClick={onDelete}>
                    <TrashIcon className="tiptap-button-icon" />
                    <span className="tiptap-button-text">Delete thread</span>
                  </Button>
                </DropdownMenuItem>
              </ButtonGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button data-style="ghost" onClick={onClose}>
        <CloseIcon className="tiptap-button-icon" />
      </Button>
    </ButtonGroup>
  </div>
)
