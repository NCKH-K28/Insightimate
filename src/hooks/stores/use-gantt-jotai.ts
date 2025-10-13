import { useCallback, useMemo } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import {
  childrenMapAtom,
  collapseNodesAtom,
  expandNextAtom,
  expandNodesAtom,
  ganttExpandedNodesAtom,
  ganttNodesAtom,
  toggleNodeAtom,
  visibleNodesAtom,
} from '@/features/gantt/atoms/gantt-atom';

export function useGanttExpansion() {
  const nodes = useAtomValue(ganttNodesAtom);
  const visibleNodes = useAtomValue(visibleNodesAtom);
  const childrenMap = useAtomValue(childrenMapAtom);
  const expanded = useAtomValue(ganttExpandedNodesAtom);

  const toggle = useSetAtom(toggleNodeAtom);
  const expandAll = useSetAtom(expandNodesAtom);
  const collapseAll = useSetAtom(collapseNodesAtom);
  const expandNext = useSetAtom(expandNextAtom);

  const hasChildren = useMemo(() => (nodeId: string) => childrenMap.has(nodeId), [childrenMap]);
  const isExpanded = useMemo(() => (nodeId: string) => expanded.has(nodeId), [expanded]);

  return {
    nodes,
    visibleNodes,
    expanded,
    toggle,
    expandAll,
    collapseAll,
    expandNext,
    hasChildren,
    isExpanded,
  };
}
