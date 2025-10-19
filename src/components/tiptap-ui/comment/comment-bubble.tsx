"use client"

import * as React from "react"

// --- Contexts ---
import { useThreadState } from "@/contexts/thread-store"
import { useAppState } from "@/contexts/app-context"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"

// --- Lib ---
import { getAvatar } from "@/lib/tiptap-collab-utils"

// --- UI Primitives ---
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/tiptap-ui-primitive/avatar"

interface Author {
  name: string
  id: string
}

interface ThreadCountProps {
  count: number
}

interface AuthorAvatarProps {
  author: Author
}

interface AdaptiveAvatarGroupProps {
  authors: Author[]
}

type ResolvedThreadDisplay = "hide" | "semi-transparent"

export const CommentBubble = (props: {
  threadIds: string[]
  offset: number
  onBubbleClick?: (threadId: string) => void
  resolvedThreadDisplay?: ResolvedThreadDisplay
}) => {
  const { threadIds, offset, onBubbleClick, resolvedThreadDisplay } = props
  const { threads: allThreads } = useThreadState()
  const { addThreadBubble, removeThreadBubble } = useAppState()
  const bubbleRef = React.useRef<HTMLDivElement>(null)

  const threads = React.useMemo(
    () => allThreads.filter((thread) => threadIds.includes(thread.id)),
    [allThreads, threadIds]
  )

  React.useEffect(() => {
    if (!bubbleRef.current) return

    const element = bubbleRef.current

    addThreadBubble(threadIds, element)

    return () => {
      removeThreadBubble(element)
    }
  }, [addThreadBubble, removeThreadBubble, threadIds])

  const isSingleThread = threads.length === 1
  const threadComments = React.useMemo(
    () => (isSingleThread ? (threads[0]?.comments ?? []) : []),
    [isSingleThread, threads]
  )

  const threadAuthors = React.useMemo(() => {
    if (!isSingleThread) return []

    return threadComments
      .map((comment) => ({
        name: comment.data.authorName,
        id: comment.data.authorId,
      }))
      .filter(
        (author, index, self) =>
          self.findIndex((a) => a.id === author.id) === index
      )
  }, [isSingleThread, threadComments])

  const handleClick = React.useCallback(() => {
    if (onBubbleClick) {
      onBubbleClick(threadIds[0] || "")
    }
  }, [onBubbleClick, threadIds])

  const allThreadsResolved = threads.every((thread) => !!thread.resolvedAt)

  if (resolvedThreadDisplay === "hide" && allThreadsResolved) {
    return null
  }

  return (
    <div
      className="tiptap-comment-bubble"
      data-resolved={allThreadsResolved}
      style={{ "--offset": `${offset}px` } as React.CSSProperties}
      ref={bubbleRef}
    >
      <button onClick={handleClick} className="tiptap-comment-bubble-button">
        {isSingleThread ? (
          <SingleThreadContent authors={threadAuthors} />
        ) : (
          <ThreadCount count={threads.length} />
        )}
        <BubblePointer />
      </button>
    </div>
  )
}

const BubblePointer: React.FC = () => (
  <svg
    width="16"
    height="7"
    viewBox="0 0 16 7"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="tiptap-comment-bubble-pointer"
  >
    <path d="M0 0H16H12.8062C10.9897 0 9.22719 0.618246 7.80869 1.75305L2.43704 6.05036C1.4549 6.83608 0 6.13682 0 4.87906V0Z" />
  </svg>
)

const ThreadCount: React.FC<ThreadCountProps> = ({ count }) => (
  <div className="tiptap-comment-bubble-thread-count">{count}</div>
)

const AuthorAvatar: React.FC<AuthorAvatarProps> = ({ author }) => (
  <Avatar key={author.id}>
    <AvatarImage src={getAvatar(author.name)} />
    <AvatarFallback>{author.name?.toUpperCase()[0]}</AvatarFallback>
  </Avatar>
)

const MobileAuthorsIndicator: React.FC<AuthorAvatarProps> = ({ author }) => (
  <div className="tiptap-comment-bubble-mobile-authors">
    <Avatar>
      <AvatarImage src={getAvatar(author.name)} />
    </Avatar>
    <span className="tiptap-comment-bubble-mobile-authors-indicator">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_d_2609_52743)">
          <path
            d="M1 6C1 3.23858 3.23858 1 6 1C8.76142 1 11 3.23858 11 6C11 8.76142 8.76142 11 6 11C3.23858 11 1 8.76142 1 6Z"
            fill="#222325"
          />
          <path
            d="M5.31936 9V3H6.68064V9H5.31936ZM3 6.68064V5.31936H9V6.68064H3Z"
            fill="white"
          />
        </g>
        <defs>
          <filter
            id="filter0_d_2609_52743"
            x="0"
            y="0"
            width="12"
            height="12"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="1"
              operator="dilate"
              in="SourceAlpha"
              result="effect1_dropShadow_2609_52743"
            />
            <feOffset />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_2609_52743"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_2609_52743"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
    </span>
  </div>
)

const AdaptiveAvatarGroup: React.FC<AdaptiveAvatarGroupProps> = ({
  authors,
}) => {
  const isMobile = useIsMobile()

  if (isMobile && authors.length > 1) {
    return authors[0] ? <MobileAuthorsIndicator author={authors[0]} /> : null
  }

  return (
    <AvatarGroup maxVisible={2}>
      {authors.map((author) => (
        <AuthorAvatar key={author.id} author={author} />
      ))}
    </AvatarGroup>
  )
}

const SingleThreadContent: React.FC<AdaptiveAvatarGroupProps> = ({
  authors,
}) => <AdaptiveAvatarGroup authors={authors} />
