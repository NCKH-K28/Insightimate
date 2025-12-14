import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';

import Mention from '@tiptap/extension-mention';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { TableKit } from '@tiptap/extension-table';

import { ToolGetTimeNode } from './nodes/tool-get-time';
import { IssueWikiNode } from './nodes/issue-wiki-node';
import { GeneratedIssuesNode } from './nodes/generated-issues-node';

export const inputExtensions = [Document, Paragraph, Text, Mention, IssueWikiNode];

export const outputExtensions = [
  ...inputExtensions,
  TableKit,
  ToolGetTimeNode,
  StarterKit.configure({}),
  Mention,
  Markdown,
  IssueWikiNode,
  GeneratedIssuesNode,
];
