import { cn } from '@/lib/utils';
import { Node, mergeAttributes } from '@tiptap/core';

const ISSUE_RE = /^\[\[issue:([A-Za-z0-9._-]+)(?:\|([^\]]+))?\]\]/;

export const IssueWikiNode = Node.create({
  name: 'issue-wiki',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return { key: { default: null }, title: { default: null } };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="issue-wiki"]',
        getAttrs: (el: Element) => ({
          key: el.getAttribute('data-key'),
          title: el.getAttribute('data-title'),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { key, title } = node.attrs;
    const attrs: Record<string, any> = { 'data-type': 'issue-wiki' };
    if (key != null) attrs['data-key'] = key;
    if (title != null) attrs['data-title'] = title;

    return [
      'span',
      mergeAttributes(
        {
          class: cn(
            'px-1 py-0.5',
            'border border-blue-400 bg-blue-100/50',
            'hover:bg-blue-100/70',
            'cursor-pointer',
            //
          ),
          ...HTMLAttributes,
        },
        attrs,
      ),
      [
        'a',
        { href: `/issues/${key ?? ''}`, target: '_blank', rel: 'noopener noreferrer' },
        title ?? key ?? 'issue',
      ],
    ];
  },

  // // NodeView: đọc title/key, KHÔNG đọc "content"
  // addNodeView() {
  //   return ReactNodeViewRenderer(({ node }) => (
  //     <NodeViewWrapper className='custom-react-node'>
  //       <div
  //         style={{
  //           border: '2px solid #3b82f6',
  //           borderRadius: 8,
  //           padding: 16,
  //           margin: '8px 0',
  //           background: '#eff6ff',
  //         }}
  //       >
  //         <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Custom React Component</h4>
  //         <p style={{ margin: 0, color: '#374151' }}>
  //           {node.attrs.title ?? node.attrs.key ?? 'Issue'}
  //         </p>
  //       </div>
  //     </NodeViewWrapper>
  //   ));
  // },

  // --- Markdown (MarkedJS) ---
  markdownTokenName: 'issue-wiki',
  markdownTokenizer: {
    name: 'issue-wiki',
    level: 'inline',
    start: (src: string) => src.indexOf('[[issue:'),
    tokenize: (src, tokens, lexer) => {
      const m = ISSUE_RE.exec(src); // phải match NGAY ĐẦU src
      if (!m) return undefined;
      const [raw, key, title] = m;
      return { type: 'issue-wiki', raw, text: raw, key, title };
    },
  },

  // Token -> Tiptap JSON
  parseMarkdown: (token: any) => ({
    type: 'issue-wiki',
    attrs: { key: token.key, title: token.title ?? null },
  }),

  // Tiptap JSON -> Markdown
  renderMarkdown: (node: any) => {
    const { key, title } = node.attrs;
    return title ? `[[issue:${key}|${title}]]` : `[[issue:${key}]]`;
  },
});
