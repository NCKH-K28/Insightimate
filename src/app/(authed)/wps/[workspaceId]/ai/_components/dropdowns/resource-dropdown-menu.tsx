'use client';

import * as React from 'react';
import type { Editor, Range } from '@tiptap/react';

// --- Lib ---
import { getElementOverflowPosition } from '@/lib/tiptap-collab-utils';

// --- Tiptap UI ---
import type {
  SuggestionItem,
  SuggestionMenuProps,
  SuggestionMenuRenderProps,
} from '@/components/tiptap-ui-utils/suggestion-menu';
import { SuggestionMenu } from '@/components/tiptap-ui-utils/suggestion-menu';

// --- UI Primitives ---
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';

interface Resource {
  id: number;
  name: string;
  type: string;
  url: string;
}

type ResourceDropdownMenuProps = Omit<SuggestionMenuProps, 'items' | 'children'>;

interface ResourceItemProps {
  item: SuggestionItem<Resource>;
  isSelected: boolean;
  onSelect: () => void;
}

const fetchSources = async (query: string): Promise<Resource[]> => {
  const allResources = [
    {
      id: 1,
      name: 'Resource 1',
      type: 'Type A',
      url: 'https://example.com/resource-1',
    },
    {
      id: 2,
      name: 'Resource 2',
      type: 'Type B',
      url: 'https://example.com/resource-2',
    },
  ];

  const trimed = query.trim();
  if (!trimed || trimed.length === 0) {
    return allResources;
  }

  return allResources.filter((resource) =>
    resource.name.toLowerCase().includes(trimed.toLowerCase()),
  );
};

export const ResourceDropdownMenu = (props: ResourceDropdownMenuProps) => {
  const handleItemSelect = (props: { editor: Editor; range: Range; context?: Resource }) => {
    if (!props.editor || !props.range || !props.context) return;

    props.editor
      .chain()
      .focus()
      .insertContentAt(props.range, [
        {
          type: 'text',
          text: props.context.name,
          marks: [{ type: 'link', attrs: { href: props.context.url, target: '_blank' } }],
        },
        { type: 'text', text: ' ' },
      ])
      .run();
  };

  const getSuggestionItems = async (props: { query: string }) => {
    const sources = await fetchSources(props.query);

    return sources.map((s) => ({
      title: s.name,
      subtext: s.name,
      context: s,
      onSelect: handleItemSelect,
    }));
  };

  return (
    <SuggestionMenu
      char='['
      allow={(ctx) => {
        const { state, range } = ctx;
        const prev = state.doc.textBetween(Math.max(0, range.from - 1), range.from, '\n', '\n');
        return prev === '['; // chỉ trigger khi là `[[`
      }}
      pluginKey='resourceDropdownMenu'
      decorationClass='tiptap-resource-decoration'
      selector='tiptap-resource-dropdown-menu'
      items={getSuggestionItems}
      {...props}
    >
      {(props) => <ResourceList {...props} />}
    </SuggestionMenu>
  );
};

const ResourceItem = ({ item, isSelected, onSelect }: ResourceItemProps) => {
  const itemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const menuElement = document.querySelector(
      '[data-selector="tiptap-resource-dropdown-menu"]',
    ) as HTMLElement;
    if (!itemRef.current || !isSelected || !menuElement) return;

    const overflow = getElementOverflowPosition(itemRef.current, menuElement);
    if (overflow === 'top') {
      itemRef.current.scrollIntoView(true);
    } else if (overflow === 'bottom') {
      itemRef.current.scrollIntoView(false);
    }
  }, [isSelected]);

  return (
    <Button
      ref={itemRef}
      data-style='ghost'
      data-active-state={isSelected ? 'on' : 'off'}
      onClick={onSelect}
      data-user-id={item.context?.id}
    >
      {item.title}
    </Button>
  );
};

const ResourceList = ({ items, selectedIndex, onSelect }: SuggestionMenuRenderProps<Resource>) => {
  const renderedItems = React.useMemo(() => {
    const rendered: React.ReactElement[] = [];

    items.forEach((item, index) => {
      rendered.push(
        <ResourceItem
          key={item.context?.id || item.title}
          item={item}
          isSelected={index === selectedIndex}
          onSelect={() => onSelect(item)}
        />,
      );
    });

    return rendered;
  }, [items, selectedIndex, onSelect]);

  if (!renderedItems.length) {
    return null;
  }

  return (
    <Card
      style={{
        maxHeight: 'var(--suggestion-menu-max-height)',
      }}
    >
      <CardBody>
        <ButtonGroup>{renderedItems}</ButtonGroup>
      </CardBody>
    </Card>
  );
};
