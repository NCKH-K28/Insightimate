import Decimal from 'decimal.js';

/** Public types */
export type Id = string;
export type RankType = number | string | Decimal;
export type Node<T = unknown> = {
  id: Id;
  path: Id[];
  rank: RankType | null;
  parentId: Id | null;
  data: T;
};
export type Row<T = unknown> = { id: Id; parentId: Id | null; data: T };

/** Options */
export type BuildOpts<T = unknown, RowType extends Row<T> = Row<T>> = {
  sortKey?: (node: RowType) => string | number;
  rankSeed?: { start?: Decimal.Value; step?: Decimal.Value };
};
export type LevelOpts = { maxDepth?: number; minDepth?: number; includeMax?: boolean };
export type AddNodeOpts = { position?: 'first' | 'last' | RankType; beforeId?: Id; afterId?: Id };

/** ===== Internal Funcs ===== */
// Helper function to normalize RankType to Decimal for comparison
function normalizeRank(rank: RankType | null): Decimal {
  if (rank === null) return new Decimal(0);
  if (rank instanceof Decimal) return rank;
  return new Decimal(rank);
}

// Helper function to compare two RankType values
function compareRanks(a: RankType | null, b: RankType | null): number {
  const aDecimal = normalizeRank(a);
  const bDecimal = normalizeRank(b);
  return aDecimal.comparedTo(bDecimal);
}

/** ===== Utils ===== */
export function parentOf(path: Id[]): Id | null {
  return path.length > 1 ? path[path.length - 2] : null;
}

export function isAncestor(aPath: Id[], bPath: Id[]): boolean {
  if (aPath.length >= bPath.length) return false;
  for (let i = 0; i < aPath.length; i++) if (aPath[i] !== bPath[i]) return false;
  return true;
}

export function depth(path: Id[]): number {
  return path.length - 1;
}

export function compare<T = unknown, NodeType extends Node<T> = Node<T>>(
  a: NodeType,
  b: NodeType,
): number {
  const min = Math.min(a.path.length, b.path.length);
  for (let i = 0; i < min; i++) {
    if (a.path[i] !== b.path[i]) return a.path[i].localeCompare(b.path[i]);
  }
  if (a.path.length !== b.path.length) return a.path.length - b.path.length;
  if (a.parentId === b.parentId) {
    const r = compareRanks(a.rank, b.rank);
    return r !== 0 ? r : a.id.localeCompare(b.id);
  }
  return a.id.localeCompare(b.id);
}

export function betweenRank(
  before?: RankType | null,
  after?: RankType | null,
  fallback: RankType = new Decimal(1),
): Decimal {
  const beforeDecimal = before ? normalizeRank(before) : null;
  const afterDecimal = after ? normalizeRank(after) : null;

  if (beforeDecimal && afterDecimal) return beforeDecimal.add(afterDecimal).div(2);
  if (beforeDecimal && !afterDecimal) return beforeDecimal.add(1);
  if (!beforeDecimal && afterDecimal) return afterDecimal.sub(1);
  return normalizeRank(fallback);
}

export function nextRank(last?: RankType | null, step: Decimal.Value = 1): Decimal {
  return last ? normalizeRank(last).add(step) : new Decimal(1);
}

export function build<T = unknown, RowType extends Row<T> = Row<T>>(
  rows: RowType[],
  opts: BuildOpts<T> = {},
): Node<T>[] {
  // Validate and clean input data
  const validRows = rows.filter((row) => row.id != null);
  const idSet = new Set(validRows.map((row) => row.id));

  // Clean parentIds - set to null if parent doesn't exist
  const cleanedRows = validRows.map((row) => ({
    ...row,
    parentId: row.parentId && idSet.has(row.parentId) ? row.parentId : null,
  }));

  const idMap = new Map<Id, Row<T>>();
  cleanedRows.forEach((r) => idMap.set(r.id, r));

  const pathCache = new Map<Id, Id[]>();
  const visiting = new Set<Id>();

  function pathOf(id: Id): Id[] {
    if (pathCache.has(id)) return pathCache.get(id)!;

    // Handle case where id doesn't exist in idMap
    if (!idMap.has(id)) {
      console.warn(`Unknown id ${id}, treating as root node`);
      const path = [id];
      pathCache.set(id, path);
      return path;
    }

    if (visiting.has(id)) {
      console.warn(`Cycle detected at ${id}, breaking cycle by treating as root`);
      const path = [id];
      pathCache.set(id, path);
      return path;
    }

    visiting.add(id);
    const row = idMap.get(id)!;
    let path: Id[];

    if (row.parentId == null) {
      path = [row.id];
    } else {
      try {
        path = [...pathOf(row.parentId), row.id];
      } catch (error) {
        // If there's an error getting parent path, treat this as root
        console.warn(`Error building path for ${id}, treating as root:`, error);
        path = [row.id];
      }
    }

    visiting.delete(id);
    pathCache.set(id, path);
    return path;
  }

  // group by parentId
  const groups = new Map<Id | null, Row<T>[]>();
  for (const r of cleanedRows) {
    const key = r.parentId ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  // per parent, sort and assign ranks
  const start = new Decimal(opts.rankSeed?.start ?? 1);
  const step = new Decimal(opts.rankSeed?.step ?? 1);

  const ranked = new Map<Id, RankType>();
  for (const [parent, arr] of groups) {
    const sorted = [...arr].sort((a, b) => {
      if (opts.sortKey) {
        const ka = opts.sortKey(a);
        const kb = opts.sortKey(b);
        if (ka < kb) return -1;
        if (ka > kb) return 1;
      }
      return 0;
    });
    let cursor = start;
    for (const r of sorted) {
      ranked.set(r.id, cursor);
      cursor = cursor.add(step);
    }
  }

  return cleanedRows.map((r) => {
    const path = pathOf(r.id);
    const parentId = parentOf(path);
    return {
      id: r.id,
      path,
      parentId,
      rank: ranked.get(r.id) ?? start,
      data: r.data,
    };
  });
}

export function children<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  parentId: Id | null,
): NodeType[] {
  return nodes.filter((n) => n.parentId === parentId);
}

export function subtree<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  rootId: Id,
  includeRoot = true,
): NodeType[] {
  const root = nodes.find((n) => n.id === rootId);
  if (!root) return [];
  const res = nodes.filter(
    (n) =>
      n.path.length >= root.path.length &&
      n.path.slice(0, root.path.length).every((v, i) => v === root.path[i]),
  );
  return includeRoot ? res : res.filter((n) => n.id !== rootId);
}

export function ancestors<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  id: Id,
  includeSelf = false,
): NodeType[] {
  const node = nodes.find((n) => n.id === id);
  if (!node) return [];
  const ids = includeSelf ? node.path : node.path.slice(0, -1);
  const set = new Set(ids);
  return nodes.filter((n) => set.has(n.id)).sort((a, b) => a.path.length - b.path.length);
}

export function sortSiblings<T = unknown, NodeType extends Node<T> = Node<T>>(
  siblings: NodeType[],
): NodeType[] {
  return [...siblings].sort((a, b) => {
    const r = compareRanks(a.rank, b.rank);
    return r !== 0 ? r : a.id.localeCompare(b.id);
  });
}

export function visible<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  expanded: Set<Id>,
): NodeType[] {
  const childrenByParent = new Map<Id | null, NodeType[]>();
  for (const n of nodes) {
    if (!childrenByParent.has(n.parentId)) childrenByParent.set(n.parentId, []);
    childrenByParent.get(n.parentId)!.push(n);
  }
  for (const [p, arr] of childrenByParent) childrenByParent.set(p, sortSiblings(arr));

  const out: NodeType[] = [];
  function dfs(pid: Id | null) {
    for (const n of childrenByParent.get(pid) ?? []) {
      out.push(n);
      if (expanded.has(n.id)) dfs(n.id);
    }
  }
  dfs(null);
  return out;
}

// =================== Simplified expand/collapse ===================

export function expand<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  current?: Set<Id>,
  opts?: LevelOpts,
): Set<Id>;
export function expand<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  level: number,
): Set<Id>;
export function expand<T = unknown, NodeType extends Node<T> = Node<T>>(nodes: NodeType[]): Set<Id>;
export function expand<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  currentOrLevel?: Set<Id> | number,
  opts?: LevelOpts,
): Set<Id> {
  // expand() - expand all
  if (currentOrLevel === undefined) {
    const childrenByParent = new Map<Id | null, number>();
    for (const n of nodes)
      childrenByParent.set(n.parentId, (childrenByParent.get(n.parentId) ?? 0) + 1);
    const expanded = new Set<Id>();
    for (const n of nodes) if ((childrenByParent.get(n.id) ?? 0) > 0) expanded.add(n.id);
    return expanded;
  }

  // expand(level) - expand to level
  if (typeof currentOrLevel === 'number') {
    const level = currentOrLevel;
    const expanded = new Set<Id>();
    const childrenByParent = new Map<Id | null, number>();
    for (const n of nodes) {
      childrenByParent.set(n.parentId, (childrenByParent.get(n.parentId) ?? 0) + 1);
    }

    for (const n of nodes) {
      const nodeDepth = depth(n.path);
      const hasChildren = (childrenByParent.get(n.id) ?? 0) > 0;
      if (hasChildren && nodeDepth < level) {
        expanded.add(n.id);
      }
    }
    return expanded;
  }

  // expand(current, opts) - expand by level with options
  const current = currentOrLevel;
  const { maxDepth: max = Infinity, minDepth: min = 0, includeMax = true } = opts || {};
  const newExpanded = new Set(current);

  const childrenByParent = new Map<Id | null, number>();
  for (const n of nodes) {
    childrenByParent.set(n.parentId, (childrenByParent.get(n.parentId) ?? 0) + 1);
  }

  for (const n of nodes) {
    const nodeDepth = depth(n.path);
    const hasChildren = (childrenByParent.get(n.id) ?? 0) > 0;

    if (!hasChildren) continue;

    const inRange = nodeDepth >= min && (includeMax ? nodeDepth <= max : nodeDepth < max);
    if (inRange) newExpanded.add(n.id);
  }

  return newExpanded;
}

export function collapse<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  current: Set<Id>,
  opts?: LevelOpts,
): Set<Id>;
export function collapse<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  level: number,
): Set<Id>;
export function collapse<T = unknown, NodeType extends Node<T> = Node<T>>(): Set<Id>;
export function collapse<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes?: NodeType[],
  currentOrLevel?: Set<Id> | number,
  opts?: LevelOpts,
): Set<Id> {
  // collapse() - collapse all
  if (!nodes) return new Set();

  // collapse(level) - collapse to level
  if (typeof currentOrLevel === 'number') {
    const level = currentOrLevel;
    if (level < 0) return new Set();
    return expand(nodes, level);
  }

  // collapse(current, opts) - collapse by level with options
  const current = currentOrLevel!;
  const { maxDepth: max = Infinity, minDepth: min = 0, includeMax = true } = opts || {};
  const newExpanded = new Set(current);

  for (const n of nodes) {
    const nodeDepth = depth(n.path);
    const inRange = nodeDepth >= min && (includeMax ? nodeDepth <= max : nodeDepth < max);
    if (inRange && newExpanded.has(n.id)) {
      newExpanded.delete(n.id);
    }
  }

  return newExpanded;
}

export function toggle<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  current: Set<Id>,
  opts?: LevelOpts,
): Set<Id>;
export function toggle<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  current: Set<Id>,
): Set<Id>;
export function toggle<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  current: Set<Id>,
  opts?: LevelOpts,
): Set<Id> {
  // toggle() - toggle all
  if (!opts) {
    const all = expand(nodes);
    let allExpanded = true;
    for (const id of all)
      if (!current.has(id)) {
        allExpanded = false;
        break;
      }
    return allExpanded ? new Set() : all;
  }

  // toggle(current, opts) - toggle by level with options
  const { maxDepth: max = Infinity, minDepth: min = 0, includeMax = true } = opts;

  const childrenByParent = new Map<Id | null, number>();
  for (const n of nodes) {
    childrenByParent.set(n.parentId, (childrenByParent.get(n.parentId) ?? 0) + 1);
  }

  const targets = nodes.filter((n) => {
    const nodeDepth = depth(n.path);
    const hasChildren = (childrenByParent.get(n.id) ?? 0) > 0;
    const inRange = nodeDepth >= min && (includeMax ? nodeDepth <= max : nodeDepth < max);
    return hasChildren && inRange;
  });

  const allExpanded = targets.every((n) => current.has(n.id));
  return allExpanded ? collapse(nodes, current, opts) : expand(nodes, current, opts);
}

// =================== Node Operations ===================
export function addNode<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  newNode: Omit<NodeType, 'id' | 'path' | 'parentId' | 'rank' | 'data'> & { id: Id },
  parentId: Id | null = null,
  opts: AddNodeOpts = {},
): NodeType[] {
  const { position = 'last', beforeId, afterId } = opts;

  // Check if node already exists
  if (nodes.find((n) => n.id === newNode.id)) {
    console.warn(`Node with id ${newNode.id} already exists`);
    return nodes;
  }

  // Validate parent exists if specified
  if (parentId && !nodes.find((n) => n.id === parentId)) {
    console.warn(`Parent ${parentId} not found, creating as root node`);
    parentId = null;
  }

  // Get siblings to determine rank
  const siblings = nodes.filter((n) => n.parentId === parentId);
  let rank: RankType;

  if (beforeId || afterId) {
    // Position relative to specific siblings
    const beforeNode = beforeId ? siblings.find((s) => s.id === beforeId) : null;
    const afterNode = afterId ? siblings.find((s) => s.id === afterId) : null;

    const beforeRank = beforeNode?.rank ?? null;
    const afterRank = afterNode?.rank ?? null;

    rank = betweenRank(afterRank, beforeRank, new Decimal(1));
  } else if (position === 'first') {
    // Insert at beginning
    const firstSibling = siblings.reduce<Node<T> | null>(
      (first, s) => (first === null || compareRanks(s.rank, first.rank) < 0 ? s : first),
      null,
    );
    rank = firstSibling ? normalizeRank(firstSibling.rank).sub(1) : new Decimal(1);
  } else if (position === 'last') {
    // Insert at end (default)
    const lastSibling = siblings.reduce<Node<T> | null>(
      (last, s) => (last === null || compareRanks(s.rank, last.rank) > 0 ? s : last),
      null,
    );
    rank = nextRank(lastSibling?.rank);
  } else if (
    typeof position === 'number' ||
    typeof position === 'string' ||
    position instanceof Decimal
  ) {
    // Use specific rank
    rank = position;
  } else {
    // Fallback to last
    const lastSibling = siblings.reduce<Node<T> | null>(
      (last, s) => (last === null || compareRanks(s.rank, last.rank) > 0 ? s : last),
      null,
    );
    rank = nextRank(lastSibling?.rank);
  }

  // Build path
  let path: Id[];
  if (parentId) {
    const parent = nodes.find((n) => n.id === parentId);
    if (parent) {
      path = [...parent.path, newNode.id];
    } else {
      path = [newNode.id];
      parentId = null;
    }
  } else {
    path = [newNode.id];
  }

  const node: NodeType = { ...newNode, id: newNode.id, parentId, path, rank } as NodeType;

  return [...nodes, node];
}

export function delNode<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  nodeId: Id,
): NodeType[] {
  const nodeToDelete = nodes.find((n) => n.id === nodeId);
  if (!nodeToDelete) {
    console.warn(`Node ${nodeId} not found`);
    return nodes;
  }

  // Get all descendants using subtree function
  const toDelete = subtree(nodes, nodeId, true); // include root
  const deleteIds = new Set(toDelete.map((n) => n.id));

  // Filter out deleted nodes
  return nodes.filter((n) => !deleteIds.has(n.id));
}

// Delete chỉ node, promote children lên parent
export function delNodeOnly<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  nodeId: Id,
): NodeType[] {
  const nodeToDelete = nodes.find((n) => n.id === nodeId);
  if (!nodeToDelete) {
    console.warn(`Node ${nodeId} not found`);
    return nodes;
  }

  const newParentId = nodeToDelete.parentId;
  const newParentPath = newParentId ? (nodes.find((n) => n.id === newParentId)?.path ?? []) : [];

  return nodes
    .filter((n) => n.id !== nodeId) // Remove the target node
    .map((n) => {
      // Update children of deleted node
      if (n.parentId === nodeId) {
        return {
          ...n,
          parentId: newParentId,
          path: [...newParentPath, ...n.path.slice(nodeToDelete.path.length)],
        };
      }
      return n;
    });
}

export function reorder<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  nodeId: Id,
  opts: { beforeId?: Id | null; afterId?: Id | null } = {},
): NodeType[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return nodes;

  const siblings = nodes.filter((n) => n.parentId === node.parentId && n.id !== node.id);
  const before = opts.beforeId
    ? (siblings.find((s) => s.id === opts.beforeId)?.rank ?? null)
    : null;
  const after = opts.afterId ? (siblings.find((s) => s.id === opts.afterId)?.rank ?? null) : null;

  let newRank: RankType;
  if (!before && !after) {
    const last = siblings.reduce<RankType | null>(
      (acc, s) => (acc === null || compareRanks(s.rank, acc) > 0 ? s.rank : acc),
      null,
    );
    newRank = nextRank(last);
  } else {
    newRank = betweenRank(before ?? null, after ?? null, node.rank ?? new Decimal(1));
  }

  return nodes.map((n) => (n.id === nodeId ? { ...n, rank: newRank } : n)) as NodeType[];
}

export function move<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  nodeId: Id,
  newParentId: Id | null,
  newRank?: RankType,
): NodeType[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return nodes;

  if (newParentId && subtree(nodes, nodeId).some((n) => n.id === newParentId)) {
    throw new Error('Cannot move a node under its own descendant');
  }

  let newParentPath: Id[] = [];
  if (newParentId) {
    const p = nodes.find((n) => n.id === newParentId);
    if (!p) throw new Error(`Unknown newParentId ${newParentId}`);
    newParentPath = [...p.path];
  }

  if (!newRank) {
    const newSiblings = nodes.filter((n) => n.parentId === newParentId && n.id !== nodeId);
    const last = newSiblings.reduce<RankType | null>(
      (acc, s) => (acc === null || compareRanks(s.rank, acc) > 0 ? s.rank : acc),
      null,
    );
    newRank = nextRank(last);
  }

  const oldPath = node.path;
  const newPath = [...newParentPath, node.id];

  return nodes.map((n) => {
    if (n.path === oldPath || isAncestor(oldPath, n.path)) {
      const suffix = n.path.slice(oldPath.length);
      const updatedPath = [...newPath, ...suffix];
      const updatedParentId = parentOf(updatedPath);
      return {
        ...n,
        path: updatedPath,
        parentId: updatedParentId,
        rank: n.id === nodeId ? newRank! : n.rank,
      };
    }
    return n;
  }) as NodeType[];
}

export function next<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  current: Set<Id>,
): Set<Id> {
  const maxCurrent = Math.max(
    -1,
    ...Array.from(current).map((id) => {
      const node = nodes.find((n) => n.id === id);
      return node ? depth(node.path) : -1;
    }),
  );
  return expand(nodes, maxCurrent + 2);
}

export function maxDepth<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
): number {
  return nodes.reduce((max, n) => Math.max(max, depth(n.path)), 0);
}

export function nodesByLevel<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  level: number,
): NodeType[] {
  return nodes.filter((n) => depth(n.path) === level);
}

export function siblingsOf<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  id: Id,
): NodeType[] {
  const node = nodes.find((n) => n.id === id);
  if (!node) return [];
  return sortSiblings(nodes.filter((n) => n.parentId === node.parentId));
}

export function childMap<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
): Map<string, NodeType[]> {
  const map = new Map<string, NodeType[]>();
  for (const node of nodes) {
    const parentId = node.path.at(-2);
    if (!parentId) continue;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId)!.push(node);
  }
  return map;
}

export function childrenOf<T = unknown, NodeType extends Node<T> = Node<T>>(
  nodes: NodeType[],
  parentId: string,
): NodeType[] {
  const map = childMap(nodes);
  return map.get(parentId) ?? [];
}
