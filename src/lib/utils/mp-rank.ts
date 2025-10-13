/**
 * MP-Rank - Materialized Path + LexRank Hybrid System
 * Complete hierarchical data management with precise ordering
 * Date: 2025-08-20 16:49:46
 *
 * Combines the power of:
 * - Materialized Path: Efficient hierarchical queries
 * - LexRank: Precise fractional ranking within siblings
 */

import Decimal from 'decimal.js';

/** ===== TYPES AND INTERFACES ===== */

export type NodeId = string;
export type PathArray = NodeId[];
export type RankValue = string | number | Decimal;

export interface MPRankNode<T = unknown> {
  id: NodeId;
  path: PathArray;
  rank: number;
  parentId: NodeId | null;
  depth: number;
  data?: T;
}

export interface FlatNode<T = unknown> {
  id: NodeId;
  parentId: NodeId | null;
  data?: T;
}

export interface MPRankOptions {
  /** Maximum depth allowed (default: 50) */
  maxDepth?: number;
  /** Case sensitive node IDs (default: true) */
  caseSensitive?: boolean;
  /** Validate node IDs (default: true) */
  validateIds?: boolean;
  /** Precision for rank calculations (default: 20) */
  rankPrecision?: number;
  /** Initial rank value (default: 1) */
  initialRank?: RankValue;
  /** Step size for generating sequential ranks (default: 1) */
  stepSize?: RankValue;
  /** Minimum distance between ranks (default: 0.000001) */
  minDistance?: RankValue;
}

export interface BuildOptions<T> {
  /** Sort key for initial ordering */
  sortKey?: (node: FlatNode<T>) => string | number;
  /** Rank seed configuration */
  rankSeed?: { start?: RankValue; step?: RankValue };
}

export interface QueryOptions {
  /** Include the node itself in results */
  includeSelf?: boolean;
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Minimum depth to include */
  minDepth?: number;
  /** Sort results by rank */
  sortByRank?: boolean;
}

export interface AddNodeOptions {
  /** Position for insertion */
  position?: 'first' | 'last' | RankValue;
  /** Insert before this sibling ID */
  beforeId?: NodeId;
  /** Insert after this sibling ID */
  afterId?: NodeId;
}

export interface MoveOptions {
  /** Allow moving to descendant (dangerous, default: false) */
  allowDescendantMove?: boolean;
  /** Validate before move (default: true) */
  validate?: boolean;
  /** New rank for moved node */
  newRank?: RankValue;
  /** Position relative to siblings */
  position?: 'first' | 'last';
  /** Insert before this sibling */
  beforeId?: NodeId;
  /** Insert after this sibling */
  afterId?: NodeId;
}

export interface ReorderOptions {
  /** Target position */
  position?: number;
  /** Insert before this sibling ID */
  beforeId?: NodeId;
  /** Insert after this sibling ID */
  afterId?: NodeId;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TreeStats {
  totalNodes: number;
  maxDepth: number;
  rootCount: number;
  leafCount: number;
  averageDepth: number;
  depthDistribution: Record<number, number>;
  rankStatsByLevel: Record<
    number,
    {
      min: number;
      max: number;
      average: number;
      gaps: number;
    }
  >;
}

export interface SerializationOptions {
  /** Path separator for string serialization (default: '/') */
  separator?: string;
  /** Include root separator (default: true) */
  includeRoot?: boolean;
}

/** ===== CORE MP-RANK CLASS ===== */

export class MPRank<T = unknown> {
  private readonly maxDepth: number;
  private readonly caseSensitive: boolean;
  private readonly validateIds: boolean;
  private readonly rankPrecision: number;
  private readonly initialRank: Decimal;
  private readonly stepSize: Decimal;
  private readonly minDistance: Decimal;

  constructor(options: MPRankOptions = {}) {
    this.maxDepth = options.maxDepth ?? 50;
    this.caseSensitive = options.caseSensitive ?? true;
    this.validateIds = options.validateIds ?? true;
    this.rankPrecision = options.rankPrecision ?? 20;
    this.initialRank = new Decimal(options.initialRank ?? 1);
    this.stepSize = new Decimal(options.stepSize ?? 1);
    this.minDistance = new Decimal(options.minDistance ?? 0.000001);

    this.validateOptions();
  }

  /** ===== PRIVATE UTILITY METHODS ===== */

  /**
   * Validate constructor options
   */
  private validateOptions(): void {
    if (this.maxDepth <= 0) {
      throw new Error('Max depth must be positive');
    }
    if (this.rankPrecision <= 0) {
      throw new Error('Rank precision must be positive');
    }
  }

  /**
   * Normalize node ID for comparison
   */
  private normalizeId(id: NodeId): string {
    return this.caseSensitive ? id : id.toLowerCase();
  }

  /**
   * Validate node ID
   */
  private validateNodeId(id: NodeId, context = 'node ID'): void {
    if (!this.validateIds) return;

    if (!id || typeof id !== 'string') {
      throw new Error(`${context} must be a non-empty string`);
    }
    if (id.trim() !== id) {
      throw new Error(`${context} cannot have leading/trailing whitespace`);
    }
    if (id.includes('/') || id.includes('\\')) {
      throw new Error(`${context} cannot contain path separators`);
    }
  }

  /**
   * Validate path array
   */
  private validatePath(path: PathArray, context = 'path'): void {
    if (!Array.isArray(path)) {
      throw new Error(`${context} must be an array`);
    }
    if (path.length === 0) {
      throw new Error(`${context} cannot be empty`);
    }
    if (path.length > this.maxDepth) {
      throw new Error(`${context} depth ${path.length} exceeds maximum ${this.maxDepth}`);
    }

    path.forEach((component, index) => {
      this.validateNodeId(component, `${context} component at index ${index}`);
    });
  }

  /**
   * Convert rank value to Decimal with precision
   */
  private toDecimal(value: RankValue): Decimal {
    if (value instanceof Decimal) {
      return new Decimal(value.toString()).toDP(this.rankPrecision);
    }
    return new Decimal(value).toDP(this.rankPrecision);
  }

  /**
   * Convert Decimal to number for return values
   */
  private toNumber(decimal: Decimal): number {
    return decimal.toNumber();
  }

  /**
   * Ensure minimum distance between ranks
   */
  private ensureMinDistance(rank1: Decimal, rank2: Decimal): boolean {
    return rank1.sub(rank2).abs().gte(this.minDistance);
  }

  /** ===== PATH OPERATIONS ===== */

  /**
   * Create root path
   */
  public createRootPath(nodeId: NodeId): PathArray {
    this.validateNodeId(nodeId);
    return [nodeId];
  }

  /**
   * Create child path
   */
  public createChildPath(parentPath: PathArray, nodeId: NodeId): PathArray {
    if (!parentPath || parentPath.length === 0) {
      throw new Error('Parent path is required and cannot be empty');
    }
    this.validatePath(parentPath, 'parent path');
    this.validateNodeId(nodeId);
    return [...parentPath, nodeId];
  }

  /**
   * Get parent path
   */
  public getParent(path: PathArray): PathArray | null {
    this.validatePath(path);
    if (path.length <= 1) return null;
    return path.slice(0, -1);
  }

  /**
   * Get path depth
   */
  public getDepth(path: PathArray): number {
    this.validatePath(path);
    return path.length;
  }

  /**
   * Check if two paths are equal
   */
  public pathEquals(path1: PathArray, path2: PathArray): boolean {
    if (path1.length !== path2.length) return false;

    for (let i = 0; i < path1.length; i++) {
      const id1 = this.normalizeId(path1[i]);
      const id2 = this.normalizeId(path2[i]);
      if (id1 !== id2) return false;
    }

    return true;
  }

  /**
   * Check if ancestorPath is ancestor of descendantPath
   */
  public isAncestor(ancestorPath: PathArray, descendantPath: PathArray): boolean {
    if (ancestorPath.length >= descendantPath.length) return false;

    for (let i = 0; i < ancestorPath.length; i++) {
      const ancestorId = this.normalizeId(ancestorPath[i]);
      const descendantId = this.normalizeId(descendantPath[i]);
      if (ancestorId !== descendantId) return false;
    }

    return true;
  }

  /**
   * Check if descendantPath is descendant of ancestorPath
   */
  public isDescendant(descendantPath: PathArray, ancestorPath: PathArray): boolean {
    return this.isAncestor(ancestorPath, descendantPath);
  }

  /**
   * Check if paths are siblings
   */
  public isSibling(path1: PathArray, path2: PathArray): boolean {
    if (this.pathEquals(path1, path2)) return false;

    const parent1 = this.getParent(path1);
    const parent2 = this.getParent(path2);

    if (!parent1 || !parent2) return false;
    return this.pathEquals(parent1, parent2);
  }

  /** ===== RANK OPERATIONS ===== */

  /**
   * Calculate rank between two ranks
   */
  public betweenRank(startRank?: RankValue | null, endRank?: RankValue | null): number {
    const start = startRank ? this.toDecimal(startRank) : null;
    const end = endRank ? this.toDecimal(endRank) : null;

    if (start && end) {
      if (start.gte(end)) {
        throw new Error('startRank must be less than endRank');
      }
      const middle = start.add(end).div(2);
      if (!this.ensureMinDistance(middle, start) || !this.ensureMinDistance(end, middle)) {
        throw new Error('Cannot create rank between given values - insufficient space');
      }
      return this.toNumber(middle);
    }

    if (start && !end) {
      return this.toNumber(start.add(this.stepSize));
    }

    if (!start && end) {
      return this.toNumber(end.sub(this.stepSize));
    }

    return this.toNumber(this.initialRank);
  }

  /**
   * Get next rank after given rank
   */
  public nextRank(lastRank?: RankValue | null): number {
    if (!lastRank) return this.toNumber(this.initialRank);
    return this.toNumber(this.toDecimal(lastRank).add(this.stepSize));
  }

  /**
   * Sort siblings by rank
   */
  public sortSiblings(siblings: MPRankNode<T>[]): MPRankNode<T>[] {
    return [...siblings].sort((a, b) => {
      const rankDiff = a.rank - b.rank;
      return rankDiff !== 0 ? rankDiff : a.id.localeCompare(b.id);
    });
  }

  /** ===== TREE BUILDING ===== */

  /**
   * Build MP-Rank tree from flat nodes
   */
  public build(flatNodes: FlatNode<T>[], options: BuildOptions<T> = {}): MPRankNode<T>[] {
    // Validate and clean input data
    const validNodes = flatNodes.filter((node) => node.id != null);
    const idSet = new Set(validNodes.map((node) => node.id));

    // Clean parentIds - set to null if parent doesn't exist
    const cleanedNodes = validNodes.map((node) => ({
      ...node,
      parentId: node.parentId && idSet.has(node.parentId) ? node.parentId : null,
    }));

    const nodeMap = new Map<NodeId, FlatNode<T>>();
    cleanedNodes.forEach((n) => nodeMap.set(this.normalizeId(n.id), n));

    const pathCache = new Map<NodeId, PathArray>();
    const visiting = new Set<NodeId>();

    // Build path for each node
    const buildPath = (nodeId: NodeId): PathArray => {
      const normalizedId = this.normalizeId(nodeId);

      if (pathCache.has(normalizedId)) {
        return pathCache.get(normalizedId)!;
      }

      if (visiting.has(normalizedId)) {
        throw new Error(`Cycle detected involving node: ${nodeId}`);
      }

      const node = nodeMap.get(normalizedId);
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      visiting.add(normalizedId);

      let path: PathArray;
      if (!node.parentId) {
        path = this.createRootPath(node.id);
      } else {
        const parentPath = buildPath(node.parentId);
        path = this.createChildPath(parentPath, node.id);
      }

      visiting.delete(normalizedId);
      pathCache.set(normalizedId, path);

      return path;
    };

    // Group by parent and assign ranks
    const groups = new Map<string, FlatNode<T>[]>();
    for (const node of cleanedNodes) {
      const parentKey = node.parentId || '__ROOT__';
      if (!groups.has(parentKey)) groups.set(parentKey, []);
      groups.get(parentKey)!.push(node);
    }

    // Rank assignment
    const start = this.toDecimal(options.rankSeed?.start ?? this.initialRank);
    const step = this.toDecimal(options.rankSeed?.step ?? this.stepSize);
    const ranked = new Map<NodeId, Decimal>();

    for (const [parentKey, siblings] of groups) {
      const sorted = [...siblings].sort((a, b) => {
        if (options.sortKey) {
          const ka = options.sortKey(a);
          const kb = options.sortKey(b);
          if (ka < kb) return -1;
          if (ka > kb) return 1;
        }
        return 0;
      });

      let cursor = start;
      for (const node of sorted) {
        ranked.set(this.normalizeId(node.id), cursor);
        cursor = cursor.add(step);
      }
    }

    // Build final result
    const result: MPRankNode<T>[] = [];
    for (const node of cleanedNodes) {
      try {
        const path = buildPath(node.id);
        const depth = this.getDepth(path);
        const parent = this.getParent(path);
        const parentId = parent ? parent[parent.length - 1] : null;

        if (depth > this.maxDepth) {
          throw new Error(
            `Maximum depth exceeded for node ${node.id}: ${depth} > ${this.maxDepth}`,
          );
        }

        result.push({
          id: node.id,
          path: [...path], // Defensive copy
          rank: this.toNumber(ranked.get(this.normalizeId(node.id)) ?? start),
          parentId,
          depth,
          data: node.data,
        });
      } catch (error) {
        throw new Error(
          `Failed to build node ${node.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return this.sortTree(result);
  }

  /** ===== TREE QUERIES ===== */

  /**
   * Get direct children of a node
   */
  public getChildren(
    nodes: MPRankNode<T>[],
    parentPath: PathArray,
    options: QueryOptions = {},
  ): MPRankNode<T>[] {
    const { sortByRank = true } = options;

    const children = nodes.filter((node) => {
      if (node.path.length !== parentPath.length + 1) return false;
      return this.isDescendant(node.path, parentPath);
    });

    return sortByRank ? this.sortSiblings(children) : children;
  }

  /**
   * Get all descendants of a node
   */
  public getDescendants(
    nodes: MPRankNode<T>[],
    ancestorPath: PathArray,
    options: QueryOptions = {},
  ): MPRankNode<T>[] {
    const { includeSelf = false, maxDepth, minDepth = 0, sortByRank = false } = options;
    const ancestorDepth = this.getDepth(ancestorPath);

    let result = nodes.filter((node) => {
      if (includeSelf && this.pathEquals(node.path, ancestorPath)) return true;
      if (!this.isDescendant(node.path, ancestorPath)) return false;

      const relativeDepth = node.depth - ancestorDepth;
      if (relativeDepth < minDepth) return false;
      if (maxDepth !== undefined && relativeDepth > maxDepth) return false;

      return true;
    });

    if (sortByRank) {
      // Sort by path first, then by rank within siblings
      result = result.sort((a, b) => {
        // First by depth
        if (a.depth !== b.depth) return a.depth - b.depth;

        // Then by parent path
        const aParent = this.getParent(a.path);
        const bParent = this.getParent(b.path);
        if (aParent && bParent && !this.pathEquals(aParent, bParent)) {
          return this.comparePaths(aParent, bParent);
        }

        // Finally by rank within siblings
        return a.rank - b.rank;
      });
    }

    return result;
  }

  /**
   * Get all ancestors of a node
   */
  public getAncestors(
    nodes: MPRankNode<T>[],
    descendantPath: PathArray,
    options: QueryOptions = {},
  ): MPRankNode<T>[] {
    const { includeSelf = false } = options;

    return nodes
      .filter((node) => {
        if (includeSelf && this.pathEquals(node.path, descendantPath)) return true;
        return this.isAncestor(node.path, descendantPath);
      })
      .sort((a, b) => a.depth - b.depth);
  }

  /**
   * Get siblings of a node
   */
  public getSiblings(
    nodes: MPRankNode<T>[],
    path: PathArray,
    includeSelf = false,
  ): MPRankNode<T>[] {
    const parentPath = this.getParent(path);
    if (!parentPath) {
      return includeSelf ? nodes.filter((n) => this.pathEquals(n.path, path)) : [];
    }

    const siblings = this.getChildren(nodes, parentPath);
    return includeSelf ? siblings : siblings.filter((node) => !this.pathEquals(node.path, path));
  }

  /**
   * Find node by path
   */
  public findByPath(nodes: MPRankNode<T>[], path: PathArray): MPRankNode<T> | null {
    return nodes.find((node) => this.pathEquals(node.path, path)) || null;
  }

  /**
   * Find nodes by ID
   */
  public findById(nodes: MPRankNode<T>[], id: NodeId): MPRankNode<T>[] {
    const normalizedId = this.normalizeId(id);
    return nodes.filter((node) => this.normalizeId(node.id) === normalizedId);
  }

  /**
   * Get root nodes
   */
  public getRoots(nodes: MPRankNode<T>[]): MPRankNode<T>[] {
    return this.sortSiblings(nodes.filter((node) => node.depth === 1));
  }

  /**
   * Get leaf nodes
   */
  public getLeaves(nodes: MPRankNode<T>[]): MPRankNode<T>[] {
    const allPaths = nodes.map((n) => n.path);
    return nodes.filter(
      (node) =>
        !allPaths.some((p) => this.isDescendant(p, node.path) && !this.pathEquals(p, node.path)),
    );
  }

  /** ===== TREE MODIFICATIONS ===== */

  /**
   * Add a new node
   */
  public addNode(
    nodes: MPRankNode<T>[],
    newNode: FlatNode<T>,
    parentPath?: PathArray,
    options: AddNodeOptions = {},
  ): MPRankNode<T>[] {
    this.validateNodeId(newNode.id);

    // Check for duplicate ID
    if (this.findById(nodes, newNode.id).length > 0) {
      throw new Error(`Node with ID ${newNode.id} already exists`);
    }

    let path: PathArray;
    let parentId: NodeId | null = null;

    if (parentPath) {
      this.validatePath(parentPath, 'parent path');

      // Validate parent exists
      const parent = this.findByPath(nodes, parentPath);
      if (!parent) {
        throw new Error(`Parent path not found: ${this.serializePath(parentPath)}`);
      }

      path = this.createChildPath(parentPath, newNode.id);
      parentId = parent.id;
    } else {
      // Root node
      path = this.createRootPath(newNode.id);
    }

    const depth = this.getDepth(path);
    if (depth > this.maxDepth) {
      throw new Error(`Maximum depth exceeded: ${depth} > ${this.maxDepth}`);
    }

    // Calculate rank
    const siblings = parentPath ? this.getChildren(nodes, parentPath) : this.getRoots(nodes);
    let rank: number;

    const { position = 'last', beforeId, afterId } = options;

    if (beforeId || afterId) {
      const beforeNode = beforeId ? siblings.find((s) => s.id === beforeId) : null;
      const afterNode = afterId ? siblings.find((s) => s.id === afterId) : null;

      rank = this.betweenRank(afterNode?.rank, beforeNode?.rank);
    } else if (position === 'first') {
      const firstSibling = siblings.length > 0 ? siblings[0] : null;
      rank = firstSibling
        ? this.toNumber(this.toDecimal(firstSibling.rank).sub(this.stepSize))
        : this.toNumber(this.initialRank);
    } else if (position === 'last') {
      const lastSibling = siblings.length > 0 ? siblings[siblings.length - 1] : null;
      rank = this.nextRank(lastSibling?.rank);
    } else if (
      typeof position === 'number' ||
      typeof position === 'string' ||
      position instanceof Decimal
    ) {
      rank = this.toNumber(this.toDecimal(position));
    } else {
      const lastSibling = siblings.length > 0 ? siblings[siblings.length - 1] : null;
      rank = this.nextRank(lastSibling?.rank);
    }

    const mpRankNode: MPRankNode<T> = {
      id: newNode.id,
      path: [...path],
      rank,
      parentId,
      depth,
      data: newNode.data,
    };

    return this.sortTree([...nodes, mpRankNode]);
  }

  /**
   * Remove a node and all its descendants
   */
  public removeNode(nodes: MPRankNode<T>[], targetPath: PathArray): MPRankNode<T>[] {
    const descendants = this.getDescendants(nodes, targetPath, { includeSelf: true });
    const descendantPaths = new Set(descendants.map((n) => this.serializePath(n.path)));

    return nodes.filter((node) => !descendantPaths.has(this.serializePath(node.path)));
  }

  /**
   * Move a node to a new parent
   */
  public moveNode(
    nodes: MPRankNode<T>[],
    sourcePath: PathArray,
    newParentPath: PathArray | null,
    options: MoveOptions = {},
  ): MPRankNode<T>[] {
    const { allowDescendantMove = false, validate = true } = options;

    this.validatePath(sourcePath, 'source path');
    if (newParentPath) {
      this.validatePath(newParentPath, 'new parent path');
    }

    // Find source node
    const sourceNode = this.findByPath(nodes, sourcePath);
    if (!sourceNode) {
      throw new Error(`Source node not found: ${this.serializePath(sourcePath)}`);
    }

    // Validate destination
    if (newParentPath) {
      const newParent = this.findByPath(nodes, newParentPath);
      if (!newParent) {
        throw new Error(`New parent not found: ${this.serializePath(newParentPath)}`);
      }

      // Prevent moving to descendant
      if (!allowDescendantMove && this.isDescendant(newParentPath, sourcePath)) {
        throw new Error('Cannot move node to its own descendant');
      }
    }

    // Calculate new path and rank
    const newPath = newParentPath
      ? this.createChildPath(newParentPath, sourceNode.id)
      : this.createRootPath(sourceNode.id);

    const newDepth = this.getDepth(newPath);
    if (newDepth > this.maxDepth) {
      throw new Error(`Move would exceed maximum depth: ${newDepth} > ${this.maxDepth}`);
    }

    // Calculate new rank
    const newSiblings = newParentPath
      ? this.getChildren(nodes, newParentPath)
      : this.getRoots(nodes);
    let newRank: number;

    if (options.newRank !== undefined) {
      newRank = this.toNumber(this.toDecimal(options.newRank));
    } else if (options.beforeId || options.afterId) {
      const beforeNode = options.beforeId
        ? newSiblings.find((s) => s.id === options.beforeId)
        : null;
      const afterNode = options.afterId ? newSiblings.find((s) => s.id === options.afterId) : null;
      newRank = this.betweenRank(afterNode?.rank, beforeNode?.rank);
    } else if (options.position === 'first') {
      const firstSibling = newSiblings.length > 0 ? newSiblings[0] : null;
      newRank = firstSibling
        ? this.toNumber(this.toDecimal(firstSibling.rank).sub(this.stepSize))
        : this.toNumber(this.initialRank);
    } else {
      // Default to last
      const lastSibling = newSiblings.length > 0 ? newSiblings[newSiblings.length - 1] : null;
      newRank = this.nextRank(lastSibling?.rank);
    }

    // Get all affected nodes (source and descendants)
    const affectedNodes = this.getDescendants(nodes, sourcePath, { includeSelf: true });
    const unaffectedNodes = nodes.filter(
      (node) => !affectedNodes.some((affected) => this.pathEquals(affected.path, node.path)),
    );

    // Update paths for affected nodes
    const updatedNodes: MPRankNode<T>[] = affectedNodes.map((node) => {
      let updatedPath: PathArray;

      if (this.pathEquals(node.path, sourcePath)) {
        // This is the moved node
        updatedPath = [...newPath];
      } else {
        // This is a descendant - update its path
        const relativePath = node.path.slice(sourcePath.length);
        updatedPath = [...newPath, ...relativePath];
      }

      const updatedDepth = this.getDepth(updatedPath);
      const updatedParent = this.getParent(updatedPath);
      const updatedParentId = updatedParent ? updatedParent[updatedParent.length - 1] : null;

      return {
        ...node,
        path: updatedPath,
        depth: updatedDepth,
        parentId: updatedParentId,
        rank: this.pathEquals(node.path, sourcePath) ? newRank : node.rank,
      };
    });

    const result = [...unaffectedNodes, ...updatedNodes];

    if (validate) {
      const validation = this.validateTree(result);
      if (!validation.valid) {
        throw new Error(`Move validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return this.sortTree(result);
  }

  /**
   * Reorder a node among its siblings
   */
  public reorderNode(
    nodes: MPRankNode<T>[],
    targetPath: PathArray,
    options: ReorderOptions = {},
  ): MPRankNode<T>[] {
    const targetNode = this.findByPath(nodes, targetPath);
    if (!targetNode) {
      throw new Error(`Target node not found: ${this.serializePath(targetPath)}`);
    }

    const parentPath = this.getParent(targetPath);
    const siblings = parentPath ? this.getChildren(nodes, parentPath) : this.getRoots(nodes);
    const otherSiblings = siblings.filter((s) => s.id !== targetNode.id);

    let newRank: number;

    if (options.beforeId || options.afterId) {
      const beforeNode = options.beforeId
        ? otherSiblings.find((s) => s.id === options.beforeId)
        : null;
      const afterNode = options.afterId
        ? otherSiblings.find((s) => s.id === options.afterId)
        : null;
      newRank = this.betweenRank(afterNode?.rank, beforeNode?.rank);
    } else if (options.position !== undefined) {
      if (options.position <= 0) {
        const firstSibling = otherSiblings.length > 0 ? otherSiblings[0] : null;
        newRank = firstSibling
          ? this.toNumber(this.toDecimal(firstSibling.rank).sub(this.stepSize))
          : this.toNumber(this.initialRank);
      } else if (options.position >= otherSiblings.length) {
        const lastSibling =
          otherSiblings.length > 0 ? otherSiblings[otherSiblings.length - 1] : null;
        newRank = this.nextRank(lastSibling?.rank);
      } else {
        const beforeNode = otherSiblings[options.position - 1];
        const afterNode = otherSiblings[options.position];
        newRank = this.betweenRank(beforeNode?.rank, afterNode?.rank);
      }
    } else {
      throw new Error('Either position, beforeId, or afterId must be specified');
    }

    return nodes.map((node) =>
      this.pathEquals(node.path, targetPath) ? { ...node, rank: newRank } : node,
    );
  }

  /** ===== UTILITIES ===== */

  /**
   * Compare paths lexicographically
   */
  public comparePaths(path1: PathArray, path2: PathArray): number {
    const minLength = Math.min(path1.length, path2.length);

    for (let i = 0; i < minLength; i++) {
      const id1 = this.normalizeId(path1[i]);
      const id2 = this.normalizeId(path2[i]);
      const comparison = id1.localeCompare(id2);
      if (comparison !== 0) return comparison;
    }

    return path1.length - path2.length;
  }

  /**
   * Sort tree by path and rank
   */
  public sortTree(nodes: MPRankNode<T>[]): MPRankNode<T>[] {
    return [...nodes].sort((a, b) => {
      // First by depth
      if (a.depth !== b.depth) return a.depth - b.depth;

      // Then by path comparison up to common ancestor
      const pathComparison = this.comparePaths(a.path, b.path);
      if (pathComparison !== 0) return pathComparison;

      // Finally by rank for siblings
      if (this.isSibling(a.path, b.path) || this.pathEquals(a.path, b.path)) {
        const rankDiff = a.rank - b.rank;
        return rankDiff !== 0 ? rankDiff : a.id.localeCompare(b.id);
      }

      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Serialize path to string
   */
  public serializePath(path: PathArray, options: SerializationOptions = {}): string {
    const { separator = '/', includeRoot = true } = options;
    this.validatePath(path);

    const pathString = path.join(separator);
    return includeRoot ? `${separator}${pathString}` : pathString;
  }

  /**
   * Deserialize string to path
   */
  public deserializePath(pathString: string, options: SerializationOptions = {}): PathArray {
    const { separator = '/', includeRoot = true } = options;

    if (!pathString || typeof pathString !== 'string') {
      throw new Error('Path string must be a non-empty string');
    }

    let cleanPath = pathString;
    if (includeRoot && pathString.startsWith(separator)) {
      cleanPath = pathString.substring(separator.length);
    }

    const components = cleanPath ? cleanPath.split(separator).filter(Boolean) : [];

    if (components.length === 0) {
      throw new Error('Cannot deserialize empty path');
    }

    const path = [...components];
    this.validatePath(path, 'deserialized path');
    return path;
  }

  /**
   * Validate tree structure
   */
  public validateTree(nodes: MPRankNode<T>[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const pathStrings = new Set<string>();
    const idSet = new Set<string>();

    for (const node of nodes) {
      // Check for duplicate paths
      const pathString = this.serializePath(node.path);
      const normalizedPathString = this.caseSensitive ? pathString : pathString.toLowerCase();
      if (pathStrings.has(normalizedPathString)) {
        errors.push(`Duplicate path: ${pathString}`);
      }
      pathStrings.add(normalizedPathString);

      // Check for duplicate IDs
      const normalizedId = this.normalizeId(node.id);
      if (idSet.has(normalizedId)) {
        errors.push(`Duplicate ID: ${node.id}`);
      }
      idSet.add(normalizedId);

      // Validate path
      try {
        this.validatePath(node.path);
      } catch (error) {
        errors.push(
          `Invalid path for node ${node.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      // Validate depth consistency
      const calculatedDepth = this.getDepth(node.path);
      if (node.depth !== calculatedDepth) {
        errors.push(
          `Depth mismatch for ${pathString}: stored=${node.depth}, calculated=${calculatedDepth}`,
        );
      }

      // Validate parent relationship
      if (node.parentId) {
        const parentPath = this.getParent(node.path);
        const parentNode = parentPath
          ? nodes.find((n) => this.pathEquals(n.path, parentPath))
          : null;

        if (!parentNode) {
          errors.push(`Parent node not found for ${pathString}`);
        } else if (parentNode.id !== node.parentId) {
          errors.push(
            `Parent ID mismatch for ${pathString}: expected=${parentNode.id}, actual=${node.parentId}`,
          );
        }
      } else if (node.depth !== 1) {
        errors.push(`Root node ${pathString} should have depth 1, but has depth ${node.depth}`);
      }
    }

    // Check rank ordering within siblings
    const siblingGroups = new Map<string, MPRankNode<T>[]>();
    for (const node of nodes) {
      const parentKey = this.getParent(node.path)?.join('/') || '__ROOT__';
      if (!siblingGroups.has(parentKey)) siblingGroups.set(parentKey, []);
      siblingGroups.get(parentKey)!.push(node);
    }

    for (const [parentKey, siblings] of siblingGroups) {
      if (siblings.length <= 1) continue;

      const sorted = [...siblings].sort((a, b) => a.rank - b.rank);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].rank >= sorted[i + 1].rank) {
          warnings.push(
            `Rank ordering issue in ${parentKey}: ${sorted[i].id} (${sorted[i].rank}) >= ${
              sorted[i + 1].id
            } (${sorted[i + 1].rank})`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get tree statistics with rank analysis
   */
  public getStats(nodes: MPRankNode<T>[]): TreeStats {
    const depths = nodes.map((n) => n.depth);
    const depthDistribution: Record<number, number> = {};
    const rankStatsByLevel: Record<
      number,
      {
        min: number;
        max: number;
        average: number;
        gaps: number;
      }
    > = {};

    depths.forEach((depth) => {
      depthDistribution[depth] = (depthDistribution[depth] || 0) + 1;
    });

    // Calculate rank stats by level
    for (const depth of Object.keys(depthDistribution).map(Number)) {
      const nodesAtLevel = nodes.filter((n) => n.depth === depth);
      const ranks = nodesAtLevel.map((n) => n.rank).sort((a, b) => a - b);

      if (ranks.length > 0) {
        let gaps = 0;
        for (let i = 1; i < ranks.length; i++) {
          if (ranks[i] - ranks[i - 1] > this.toNumber(this.stepSize) * 2) {
            gaps++;
          }
        }

        rankStatsByLevel[depth] = {
          min: Math.min(...ranks),
          max: Math.max(...ranks),
          average: ranks.reduce((a, b) => a + b, 0) / ranks.length,
          gaps,
        };
      }
    }

    return {
      totalNodes: nodes.length,
      maxDepth: Math.max(...depths, 0),
      rootCount: nodes.filter((n) => n.depth === 1).length,
      leafCount: this.getLeaves(nodes).length,
      averageDepth: depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0,
      depthDistribution,
      rankStatsByLevel,
    };
  }

  /**
   * Normalize ranks to prevent overflow
   */
  public normalizeRanks(nodes: MPRankNode<T>[], newStart?: RankValue): MPRankNode<T>[] {
    const start = this.toDecimal(newStart ?? this.initialRank);

    // Group by parent
    const siblingGroups = new Map<string, MPRankNode<T>[]>();
    for (const node of nodes) {
      const parentKey = this.getParent(node.path)?.join('/') || '__ROOT__';
      if (!siblingGroups.has(parentKey)) siblingGroups.set(parentKey, []);
      siblingGroups.get(parentKey)!.push(node);
    }

    // Normalize ranks within each sibling group
    const normalizedNodes = new Map<string, number>();

    for (const [parentKey, siblings] of siblingGroups) {
      const sorted = this.sortSiblings(siblings);
      let cursor = start;

      for (const sibling of sorted) {
        normalizedNodes.set(this.serializePath(sibling.path), this.toNumber(cursor));
        cursor = cursor.add(this.stepSize);
      }
    }

    return nodes.map((node) => ({
      ...node,
      rank: normalizedNodes.get(this.serializePath(node.path)) ?? node.rank,
    }));
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<MPRankOptions> {
    return {
      maxDepth: this.maxDepth,
      caseSensitive: this.caseSensitive,
      validateIds: this.validateIds,
      rankPrecision: this.rankPrecision,
      initialRank: this.toNumber(this.initialRank),
      stepSize: this.toNumber(this.stepSize),
      minDistance: this.toNumber(this.minDistance),
    };
  }
}

/** ===== FACTORY METHODS ===== */

export namespace MPRank {
  /**
   * Create default instance
   */
  export function create<T = unknown>(options?: MPRankOptions): MPRank<T> {
    return new MPRank<T>(options);
  }

  /**
   * Create instance for task management
   */
  export function tasks<T = unknown>(): MPRank<T> {
    return new MPRank<T>({
      caseSensitive: true,
      maxDepth: 10,
      rankPrecision: 15,
      initialRank: 1,
      stepSize: 1,
      minDistance: 0.001,
    });
  }

  /**
   * Create instance for menu systems
   */
  export function menu<T = unknown>(): MPRank<T> {
    return new MPRank<T>({
      caseSensitive: false,
      maxDepth: 5,
      rankPrecision: 10,
      initialRank: 10,
      stepSize: 10,
      minDistance: 0.1,
    });
  }

  /**
   * Create instance for file systems
   */
  export function filesystem<T = unknown>(): MPRank<T> {
    return new MPRank<T>({
      caseSensitive: false,
      maxDepth: 50,
      rankPrecision: 20,
      initialRank: 100,
      stepSize: 100,
      minDistance: 1,
    });
  }

  /**
   * Create instance for organizational hierarchies
   */
  export function organization<T = unknown>(): MPRank<T> {
    return new MPRank<T>({
      caseSensitive: true,
      maxDepth: 8,
      rankPrecision: 25,
      initialRank: 1000,
      stepSize: 1000,
      minDistance: 10,
    });
  }
}

/** ===== CONVENIENCE FUNCTIONS ===== */

const defaultMPRank = new MPRank<unknown>();

/**
 * Quick tree building
 */
export function buildTree<T = unknown>(
  flatNodes: FlatNode<T>[],
  options?: BuildOptions<T>,
): MPRankNode<T>[] {
  const mpRank = new MPRank<T>();
  return mpRank.build(flatNodes, options);
}

/**
 * Quick node addition
 */
export function addNode<T = unknown>(
  nodes: MPRankNode<T>[],
  newNode: FlatNode<T>,
  parentPath?: PathArray,
  options?: AddNodeOptions,
): MPRankNode<T>[] {
  const mpRank = new MPRank<T>();
  return mpRank.addNode(nodes, newNode, parentPath, options);
}

/**
 * Quick path serialization
 */
export function serializePath(path: PathArray, separator = '/'): string {
  return defaultMPRank.serializePath(path, { separator });
}

/**
 * Quick path deserialization
 */
export function deserializePath(pathString: string, separator = '/'): PathArray {
  return defaultMPRank.deserializePath(pathString, { separator });
}

/**
 * Quick validation
 */
export function validateTree<T = unknown>(nodes: MPRankNode<T>[]): ValidationResult {
  const mpRank = new MPRank<T>();
  return mpRank.validateTree(nodes);
}

export default MPRank;
