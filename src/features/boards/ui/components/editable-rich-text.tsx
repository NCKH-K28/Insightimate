'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pencil,
  Check,
  X,
  Loader2,
} from 'lucide-react';

// ============ Types ============

interface EditableRichTextProps {
  value: string;
  onSave: (html: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

// ============ Toolbar Button ============

const ToolbarButton = ({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 rounded-md transition-colors',
      'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
      isActive && 'bg-accent text-accent-foreground',
    )}
  >
    {children}
  </button>
);

// ============ Toolbar ============

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30'>
      {/* Text formatting */}
      <div className='flex items-center gap-0.5 pr-2 border-r border-border'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title='Bold (Ctrl+B)'
        >
          <Bold className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title='Italic (Ctrl+I)'
        >
          <Italic className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title='Underline (Ctrl+U)'
        >
          <UnderlineIcon className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title='Strikethrough'
        >
          <Strikethrough className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title='Inline code'
        >
          <Code className='h-4 w-4' />
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className='flex items-center gap-0.5 px-2 border-r border-border'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title='Heading 1'
        >
          <Heading1 className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title='Heading 2'
        >
          <Heading2 className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title='Heading 3'
        >
          <Heading3 className='h-4 w-4' />
        </ToolbarButton>
      </div>

      {/* Lists & Quote */}
      <div className='flex items-center gap-0.5 px-2 border-r border-border'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title='Bullet list'
        >
          <List className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title='Numbered list'
        >
          <ListOrdered className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title='Quote'
        >
          <Quote className='h-4 w-4' />
        </ToolbarButton>
      </div>

      {/* Link */}
      <div className='flex items-center gap-0.5 px-2 border-r border-border'>
        <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title='Add link'>
          <LinkIcon className='h-4 w-4' />
        </ToolbarButton>
      </div>

      {/* Undo/Redo */}
      <div className='flex items-center gap-0.5 pl-2'>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title='Undo (Ctrl+Z)'
        >
          <Undo className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title='Redo (Ctrl+Y)'
        >
          <Redo className='h-4 w-4' />
        </ToolbarButton>
      </div>
    </div>
  );
};

// ============ Read-only View ============

const ReadOnlyView = ({
  html,
  placeholder,
  onClick,
  className,
  minHeight,
}: {
  html: string;
  placeholder: string;
  onClick: () => void;
  className?: string;
  minHeight?: string;
}) => {
  const isEmpty = !html || html === '<p></p>';

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      tabIndex={0}
      role='button'
      className={cn(
        'group cursor-text rounded-lg border border-transparent',
        'hover:border-border hover:bg-accent/30 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'p-3 relative',
        className,
      )}
      style={{ minHeight }}
    >
      {isEmpty ? (
        <p className='text-muted-foreground italic'>{placeholder}</p>
      ) : (
        <div
          className='prose prose-sm dark:prose-invert max-w-none'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      <Pencil
        className={cn(
          'absolute top-3 right-3 h-4 w-4',
          'text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity',
        )}
      />
    </div>
  );
};

// ============ Main Component ============

export default function EditableRichText({
  value,
  onSave,
  placeholder = 'Click to add description...',
  className,
  editorClassName,
  minHeight = '120px',
  maxHeight = '400px',
  disabled = false,
}: EditableRichTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalValue, setOriginalValue] = useState(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Underline,
    ],
    content: value,
    editable: true,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none p-3',
          'min-h-[inherit]',
        ),
      },
    },
  });

  // Sync value từ props
  useEffect(() => {
    if (editor && !isEditing) {
      editor.commands.setContent(value);
      setOriginalValue(value);
    }
  }, [value, editor, isEditing]);

  const handleEdit = useCallback(() => {
    if (disabled) return;
    setOriginalValue(value);
    setIsEditing(true);
    setTimeout(() => editor?.commands.focus('end'), 0);
  }, [disabled, value, editor]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    const html = editor.getHTML();
    const isEmpty = html === '<p></p>';

    setIsSaving(true);
    try {
      await onSave(isEmpty ? '' : html);
      setIsEditing(false);
    } catch {
      // Keep editing on error
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave]);

  const handleCancel = useCallback(() => {
    editor?.commands.setContent(originalValue);
    setIsEditing(false);
  }, [editor, originalValue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      // Ctrl/Cmd + Enter to save
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleSave, handleCancel]);

  if (!isEditing) {
    return (
      <ReadOnlyView
        html={value}
        placeholder={placeholder}
        onClick={handleEdit}
        className={className}
        minHeight={minHeight}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border overflow-hidden',
        'focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <Toolbar editor={editor} />

      <div style={{ minHeight, maxHeight }} className={cn('overflow-auto', editorClassName)}>
        <EditorContent editor={editor} className='min-h-[inherit]' />
      </div>

      {/* Footer with actions */}
      <div className='flex items-center justify-between p-2 border-t border-border bg-muted/30'>
        <span className='text-xs text-muted-foreground'>
          <kbd className='px-1.5 py-0.5 rounded bg-muted text-[10px]'>Ctrl</kbd>
          {' + '}
          <kbd className='px-1.5 py-0.5 rounded bg-muted text-[10px]'>Enter</kbd>
          {' to save, '}
          <kbd className='px-1.5 py-0.5 rounded bg-muted text-[10px]'>Esc</kbd>
          {' to cancel'}
        </span>

        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' onClick={handleCancel} disabled={isSaving}>
            <X className='h-4 w-4 mr-1' />
            Cancel
          </Button>
          <Button size='sm' onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className='h-4 w-4 mr-1 animate-spin' />
            ) : (
              <Check className='h-4 w-4 mr-1' />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Styles for placeholder ============
// Add this to your global CSS:
/*
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
  font-style: italic;
}
*/
