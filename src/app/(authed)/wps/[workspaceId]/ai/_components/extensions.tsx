import Mention from '@tiptap/extension-mention';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import { ToolGetTimeNode } from './nodes/tool-get-time';
import { IssueWikiNode } from './nodes/issue-wiki-node';

const starterKit = StarterKit.configure({});
export const extensions = [ToolGetTimeNode, starterKit, Mention, Markdown, IssueWikiNode];
