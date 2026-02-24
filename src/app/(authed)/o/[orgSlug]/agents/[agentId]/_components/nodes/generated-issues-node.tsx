// nodes/generated-issues-node.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GeneratedIssuesNodeView } from './generated-issues-node-view';

export const GeneratedIssuesNode = Node.create({
  name: 'generated-issues',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      issues: { default: [] },
      projectId: { default: null },
      saved: { default: false },
    };
  },

  // Nếu bạn có serialize sang HTML
  parseHTML() {
    return [
      {
        tag: 'div[data-type="generated-issues"]',
        getAttrs: (el: Element) => ({
          issues: JSON.parse(el.getAttribute('data-issues') || '[]'),
          projectId: el.getAttribute('data-project-id'),
          saved: el.getAttribute('data-saved') === 'true',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs: Record<string, any> = {
      'data-type': 'generated-issues',
      'data-issues': JSON.stringify(node.attrs.issues ?? []),
      'data-project-id': node.attrs.projectId ?? '',
      'data-saved': String(node.attrs.saved ?? false),
    };

    return ['div', mergeAttributes(HTMLAttributes, attrs)];
  },

  addNodeView() {
    // Quan trọng: gắn React NodeView vào node
    return ReactNodeViewRenderer(GeneratedIssuesNodeView);
  },
});
