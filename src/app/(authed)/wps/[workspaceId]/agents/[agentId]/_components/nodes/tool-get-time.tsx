import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';

type ToolGetTimeOptions = {
  HTMLAttributes: Record<string, any>;
};

export const ToolGetTimeNode = Node.create<ToolGetTimeOptions>({
  name: 'toolGetTime',
  group: 'block',
  inline: false,
  atom: true,

  addAttributes() {
    return { value: { default: '' } };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tool-get-time"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'tool-get-time' }),
      `{{toolGetTime:${HTMLAttributes.value}}}`,
    ];
  },
});
