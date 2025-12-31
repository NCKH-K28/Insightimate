// 'use client';

// import * as React from 'react';
// import type { Editor, Range } from '@tiptap/react';

// // --- Lib ---
// import { getElementOverflowPosition } from '@/lib/tiptap-collab-utils';

// // --- Tiptap UI ---
// import type {
//   SuggestionItem,
//   SuggestionMenuProps,
//   SuggestionMenuRenderProps,
// } from '@/components/tiptap-ui-utils/suggestion-menu';
// import { SuggestionMenu } from '@/components/tiptap-ui-utils/suggestion-menu';

// // --- UI Primitives ---
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/tiptap-ui-primitive/avatar';
// import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
// import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';
// import { queryApi } from '@/features/query/http';

// const SELECTOR_ID = 'tiptap-source-mention-dropdown';
// type SourceOption = {
//   id: string;
//   label: string;
//   iconURL?: string;
//   type?: string;
// };
// type SourceMentionDropdownProps = Omit<SuggestionMenuProps, 'items' | 'children'>;

// interface MentionItemProps {
//   item: SuggestionItem<SourceOption>;
//   isSelected: boolean;
//   onSelect: () => void;
// }

// export const SourceMentionDropdown = (props: SourceMentionDropdownProps) => {
//   const [isLoading, setIsLoading] = React.useState(false);

//   const handleItemSelect = (props: { editor: Editor; range: Range; context?: SourceOption }) => {
//     const { editor, range, context } = props;
//     if (!editor || !range || !context) return;

//     editor
//       .chain()
//       .focus()
//       .insertContentAt(range, [{ type: 'mention', attrs: context }])
//       .run();
//   };

//   const mapToSuggestionItems = (
//     data: Awaited<ReturnType<typeof queryApi.search>>['data'],
//   ): SuggestionItem<SourceOption>[] => {
//     if (!data) return [];
//     return data.map((source) => ({
//       title: source.title,
//       subtext: source.snippet,
//       context: {
//         id: source.id,
//         label: source.title,
//         iconURL: source.iconURL,
//         type: source.type,
//       },
//       onSelect: handleItemSelect,
//     }));
//   };

//   const getSuggestionItems = async (props: { query: string }) => {
//     const { query } = props;
//     const trimmed = query.trim();
//     if (!trimmed || trimmed.length < 1) return [];

//     try {
//       setIsLoading(true);
//       const res = await queryApi.search({ q: trimmed });
//       return mapToSuggestionItems(res.data);
//     } catch (error) {
//       console.error('Failed to fetch source mentions:', error);
//       return []; // Return an empty array on failure
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <SuggestionMenu
//       char='[['
//       pluginKey='mentionDropdownMenu'
//       decorationClass='tiptap-mention-decoration'
//       selector={SELECTOR_ID}
//       allowSpaces={true}
//       items={getSuggestionItems}
//       {...props}
//     >
//       {(props) => <MentionList {...props} isLoading={isLoading} />}
//     </SuggestionMenu>
//   );
// };

// const MentionItem = ({ item, isSelected, onSelect }: MentionItemProps) => {
//   const itemRef = React.useRef<HTMLButtonElement>(null);

//   React.useEffect(() => {
//     const menuElement = document.querySelector(`[data-selector="${SELECTOR_ID}"]`) as HTMLElement;
//     if (!itemRef.current || !isSelected || !menuElement) return;

//     const overflow = getElementOverflowPosition(itemRef.current, menuElement);
//     if (overflow === 'top') {
//       itemRef.current.scrollIntoView(true);
//     } else if (overflow === 'bottom') {
//       itemRef.current.scrollIntoView(false);
//     }
//   }, [isSelected]);

//   return (
//     <Button
//       ref={itemRef}
//       data-style='ghost'
//       data-active-state={isSelected ? 'on' : 'off'}
//       onClick={onSelect}
//       data-item-id={item.context?.id}
//       data-item-type={item.context?.type}
//     >
//       <Avatar>
//         <AvatarImage src={item.context?.iconURL} alt={item.title} />
//         <AvatarFallback>{item.title[0]?.toUpperCase()}</AvatarFallback>
//       </Avatar>

//       <span className='tiptap-button-text'>{item.title}</span>
//     </Button>
//   );
// };

// type MentionListProps = SuggestionMenuRenderProps<SourceOption> & { isLoading?: boolean };
// const MentionList = ({ items, selectedIndex, onSelect, isLoading }: MentionListProps) => {
//   const renderedItems = React.useMemo(() => {
//     const rendered: React.ReactElement[] = [];

//     items.forEach((item, index) => {
//       rendered.push(
//         <MentionItem
//           key={item.context?.id || `index-${index}`}
//           item={item}
//           isSelected={index === selectedIndex}
//           onSelect={() => onSelect(item)}
//         />,
//       );
//     });

//     return rendered;
//   }, [items, selectedIndex, onSelect]);

//   return (
//     <Card style={{ maxHeight: 'var(--suggestion-menu-max-height)' }}>
//       <CardBody>
//         {isLoading && <div className='p-2 text-sm text-center'>Loading...</div>}
//         {!isLoading && renderedItems.length === 0 && (
//           <div className='p-2 text-sm text-center'>No sources found</div>
//         )}

//         <ButtonGroup>{renderedItems}</ButtonGroup>
//       </CardBody>
//     </Card>
//   );
// };
