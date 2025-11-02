import Mention from '@tiptap/extension-mention';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import { ToolGetTimeNode } from './nodes/tool-get-time';
import { IssueWikiNode } from './nodes/issue-wiki-node';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Placeholder } from '@tiptap/extensions';

export const inputExtensions = [Document, Paragraph, Text, Mention, IssueWikiNode];

const starterKit = StarterKit.configure({});
export const outputExtensions = [
  ...inputExtensions,
  ToolGetTimeNode,
  starterKit,
  Mention,
  Markdown,
  IssueWikiNode,
];
