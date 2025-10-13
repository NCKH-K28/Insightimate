/** ===== TYPES AND INTERFACES ===== */

export type NodeId = string;
export type PathArray = NodeId[];

export interface MaterializedNode<T = unknown> {
  id: NodeId;
  path: PathArray;
  parentId: NodeId | null;
  depth: number;
  data?: T;
}

export interface FlatNode<T = unknown> {
  id: NodeId;
  parentId: NodeId | null;
  data?: T;
}

export interface PathOptions {
  /** Maximum depth allowed (default: 50) */
  maxDepth?: number;
  /** Case sensitive node IDs (default: true) */
  caseSensitive?: boolean;
  /** Validate node IDs (default: true) */
  validateIds?: boolean;
}

export interface QueryOptions {
  /** Include the node itself in results */
  includeSelf?: boolean;
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Minimum depth to include */
  minDepth?: number;
}

export interface MoveOptions {
  /** Allow moving to descendant (dangerous, default: false) */
  allowDescendantMove?: boolean;
  /** Validate before move (default: true) */
  validate?: boolean;
}

export interface PathValidation {
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
}

export interface SerializationOptions {
  /** Separator for string serialization (default: '/') */
  separator?: string;
  /** Include root separator in serialization (default: true) */
  includeRoot?: boolean;
}

/** ===== CORE MATERIALIZED PATH CLASS ===== */

export class MaterializedPath<T = unknown> {
  private readonly maxDepth: number;
  private readonly caseSensitive: boolean;
  private readonly validateIds: boolean;

  constructor(options: PathOptions = {}) {
    this.maxDepth = options.maxDepth ?? 50;
    this.caseSensitive = options.caseSensitive ?? true;
    this.validateIds = options.validateIds ?? true;

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
   * Create path array from parent path and node ID
   */
  private createPath(parentPath: PathArray | null, nodeId: NodeId): PathArray {
    this.validateNodeId(nodeId);

    if (!parentPath || parentPath.length === 0) {
      return [nodeId];
    }

    return [...parentPath, nodeId];
  }

  /** ===== PATH CONSTRUCTION ===== */

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
    return this.createPath(parentPath, nodeId);
  }

  /**
   * Join path components
   */
  public joinPath(...components: NodeId[]): PathArray {
    if (components.length === 0) {
      throw new Error('At least one component is required');
    }

    components.forEach((comp, index) => this.validateNodeId(comp, `component at index ${index}`));

    return [...components];
  }

  /**
   * Clone path array (defensive copy)
   */
  public clonePath(path: PathArray): PathArray {
    this.validatePath(path);
    return [...path];
  }

  /** ===== PATH ANALYSIS ===== */

  /**
   * Get all path components
   */
  public getComponents(path: PathArray): NodeId[] {
    this.validatePath(path);
    return [...path];
  }

  /**
   * Get last component (leaf node ID)
   */
  public getLeaf(path: PathArray): NodeId {
    this.validatePath(path);
    return path[path.length - 1];
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
   * Get root component
   */
  public getRoot(path: PathArray): NodeId {
    this.validatePath(path);
    return path[0];
  }

  /**
   * Get path depth (1-based)
   */
  public getDepth(path: PathArray): number {
    this.validatePath(path);
    return path.length;
  }

  /**
   * Check if path is root
   */
  public isRoot(path: PathArray): boolean {
    return this.getDepth(path) === 1;
  }

  /**
   * Check if path is leaf
   */
  public isLeaf(path: PathArray, allPaths: PathArray[]): boolean {
    return !allPaths.some((p) => this.isDescendant(p, path) && !this.pathEquals(p, path));
  }

  /** ===== PATH COMPARISON ===== */

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

  /** ===== PATH RELATIONSHIPS ===== */

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
   * Check if parentPath is direct parent of childPath
   */
  public isDirectParent(parentPath: PathArray, childPath: PathArray): boolean {
    return childPath.length === parentPath.length + 1 && this.isAncestor(parentPath, childPath);
  }

  /**
   * Check if childPath is direct child of parentPath
   */
  public isDirectChild(childPath: PathArray, parentPath: PathArray): boolean {
    return this.isDirectParent(parentPath, childPath);
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

  /**
   * Get common ancestor path
   */
  public getCommonAncestor(path1: PathArray, path2: PathArray): PathArray | null {
    const commonComponents: NodeId[] = [];
    const minLength = Math.min(path1.length, path2.length);

    for (let i = 0; i < minLength; i++) {
      const id1 = this.normalizeId(path1[i]);
      const id2 = this.normalizeId(path2[i]);

      if (id1 === id2) {
        commonComponents.push(path1[i]); // Keep original case
      } else {
        break;
      }
    }

    return commonComponents.length > 0 ? commonComponents : null;
  }

  /**
   * Calculate distance between paths
   */
  public getDistance(path1: PathArray, path2: PathArray): number {
    const common = this.getCommonAncestor(path1, path2);
    if (!common) return -1; // No common ancestor

    const depth1 = path1.length;
    const depth2 = path2.length;
    const commonDepth = common.length;

    return depth1 - commonDepth + (depth2 - commonDepth);
  }

  /**
   * Get relative path from ancestor to descendant
   */
  public getRelativePath(ancestorPath: PathArray, descendantPath: PathArray): PathArray | null {
    if (!this.isAncestor(ancestorPath, descendantPath)) return null;
    return descendantPath.slice(ancestorPath.length);
  }

  /** ===== TREE BUILDING ===== */

  /**
   * Build materialized paths from flat node structure
   */
  public build(flatNodes: FlatNode<T>[]): MaterializedNode<T>[] {
    const result: MaterializedNode<T>[] = [];
    const nodeMap = new Map<NodeId, FlatNode<T>>();
    const pathCache = new Map<NodeId, PathArray>();
    const visiting = new Set<NodeId>();

    // Validate and build node map
    for (const node of flatNodes) {
      this.validateNodeId(node.id, `node ID for node ${node.id}`);

      if (nodeMap.has(this.normalizeId(node.id))) {
        throw new Error(`Duplicate node ID: ${node.id}`);
      }

      nodeMap.set(this.normalizeId(node.id), node);
    }

    // Clean parent references
    const cleanedNodes = flatNodes.map((node) => ({
      ...node,
      parentId:
        node.parentId && nodeMap.has(this.normalizeId(node.parentId)) ? node.parentId : null,
    }));

    // Build paths recursively with cycle detection
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
        // Root node
        path = this.createRootPath(node.id);
      } else {
        // Child node
        const parentPath = buildPath(node.parentId);
        path = this.createChildPath(parentPath, node.id);
      }

      visiting.delete(normalizedId);
      pathCache.set(normalizedId, path);

      return path;
    };

    // Process all nodes
    for (const node of cleanedNodes) {
      try {
        const path = buildPath(node.id);
        const depth = this.getDepth(path);

        if (depth > this.maxDepth) {
          throw new Error(
            `Maximum depth exceeded for node ${node.id}: ${depth} > ${this.maxDepth}`,
          );
        }

        result.push({
          id: node.id,
          path: this.clonePath(path), // Defensive copy
          parentId: node.parentId,
          depth,
          data: node.data,
        });
      } catch (error) {
        throw new Error(
          `Failed to build path for node ${node.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    // Sort by path
    return result.sort((a, b) => this.comparePaths(a.path, b.path));
  }

  /** ===== TREE QUERIES ===== */

  /**
   * Get all descendants of a path
   */
  public getDescendants(
    nodes: MaterializedNode<T>[],
    ancestorPath: PathArray,
    options: QueryOptions = {},
  ): MaterializedNode<T>[] {
    const { includeSelf = false, maxDepth, minDepth = 0 } = options;
    const ancestorDepth = this.getDepth(ancestorPath);

    return nodes.filter((node) => {
      if (includeSelf && this.pathEquals(node.path, ancestorPath)) return true;
      if (!this.isDescendant(node.path, ancestorPath)) return false;

      const relativeDepth = node.depth - ancestorDepth;
      if (relativeDepth < minDepth) return false;
      if (maxDepth !== undefined && relativeDepth > maxDepth) return false;

      return true;
    });
  }

  /**
   * Get all ancestors of a path
   */
  public getAncestors(
    nodes: MaterializedNode<T>[],
    descendantPath: PathArray,
    options: QueryOptions = {},
  ): MaterializedNode<T>[] {
    const { includeSelf = false } = options;

    return nodes
      .filter((node) => {
        if (includeSelf && this.pathEquals(node.path, descendantPath)) return true;
        return this.isAncestor(node.path, descendantPath);
      })
      .sort((a, b) => a.depth - b.depth);
  }

  /**
   * Get direct children of a path
   */
  public getChildren(nodes: MaterializedNode<T>[], parentPath: PathArray): MaterializedNode<T>[] {
    return nodes.filter((node) => this.isDirectChild(node.path, parentPath));
  }

  /**
   * Get parent node
   */
  public getParentNode(
    nodes: MaterializedNode<T>[],
    childPath: PathArray,
  ): MaterializedNode<T> | null {
    const parentPath = this.getParent(childPath);
    if (!parentPath) return null;

    return nodes.find((node) => this.pathEquals(node.path, parentPath)) || null;
  }

  /**
   * Get siblings of a path
   */
  public getSiblings(
    nodes: MaterializedNode<T>[],
    path: PathArray,
    includeSelf = false,
  ): MaterializedNode<T>[] {
    const parentPath = this.getParent(path);
    if (!parentPath) {
      return includeSelf ? nodes.filter((n) => this.pathEquals(n.path, path)) : [];
    }

    const siblings = this.getChildren(nodes, parentPath);
    return includeSelf ? siblings : siblings.filter((node) => !this.pathEquals(node.path, path));
  }

  /**
   * Get root nodes
   */
  public getRoots(nodes: MaterializedNode<T>[]): MaterializedNode<T>[] {
    return nodes.filter((node) => this.isRoot(node.path));
  }

  /**
   * Get leaf nodes
   */
  public getLeaves(nodes: MaterializedNode<T>[]): MaterializedNode<T>[] {
    const allPaths = nodes.map((n) => n.path);
    return nodes.filter((node) => this.isLeaf(node.path, allPaths));
  }

  /**
   * Get nodes at specific depth
   */
  public getNodesAtDepth(nodes: MaterializedNode<T>[], depth: number): MaterializedNode<T>[] {
    return nodes.filter((node) => node.depth === depth);
  }

  /**
   * Find node by path
   */
  public findByPath(nodes: MaterializedNode<T>[], path: PathArray): MaterializedNode<T> | null {
    return nodes.find((node) => this.pathEquals(node.path, path)) || null;
  }

  /**
   * Find nodes by ID
   */
  public findById(nodes: MaterializedNode<T>[], id: NodeId): MaterializedNode<T>[] {
    const normalizedId = this.normalizeId(id);
    return nodes.filter((node) => this.normalizeId(node.id) === normalizedId);
  }

  /**
   * Find nodes by path prefix
   */
  public findByPrefix(nodes: MaterializedNode<T>[], prefix: PathArray): MaterializedNode<T>[] {
    return nodes.filter((node) => {
      if (node.path.length < prefix.length) return false;

      for (let i = 0; i < prefix.length; i++) {
        const nodeId = this.normalizeId(node.path[i]);
        const prefixId = this.normalizeId(prefix[i]);
        if (nodeId !== prefixId) return false;
      }

      return true;
    });
  }

  /** ===== TREE MODIFICATIONS ===== */

  /**
   * Add a new node
   */
  public addNode(
    nodes: MaterializedNode<T>[],
    newNode: FlatNode<T>,
    parentPath?: PathArray,
  ): MaterializedNode<T>[] {
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

    const materializedNode: MaterializedNode<T> = {
      id: newNode.id,
      path: this.clonePath(path),
      parentId,
      depth,
      data: newNode.data,
    };

    const result = [...nodes, materializedNode];
    return result.sort((a, b) => this.comparePaths(a.path, b.path));
  }

  /**
   * Remove a node and all its descendants
   */
  public removeNode(nodes: MaterializedNode<T>[], targetPath: PathArray): MaterializedNode<T>[] {
    const descendants = this.getDescendants(nodes, targetPath, { includeSelf: true });
    const descendantPaths = new Set(descendants.map((n) => this.serializePath(n.path)));

    return nodes.filter((node) => !descendantPaths.has(this.serializePath(node.path)));
  }

  /**
   * Move a node to a new parent
   */
  public moveNode(
    nodes: MaterializedNode<T>[],
    sourcePath: PathArray,
    newParentPath: PathArray | null,
    options: MoveOptions = {},
  ): MaterializedNode<T>[] {
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

    // Calculate new path
    const newPath = newParentPath
      ? this.createChildPath(newParentPath, sourceNode.id)
      : this.createRootPath(sourceNode.id);

    const newDepth = this.getDepth(newPath);
    if (newDepth > this.maxDepth) {
      throw new Error(`Move would exceed maximum depth: ${newDepth} > ${this.maxDepth}`);
    }

    // Get all affected nodes (source and descendants)
    const affectedNodes = this.getDescendants(nodes, sourcePath, { includeSelf: true });
    const unaffectedNodes = nodes.filter(
      (node) => !affectedNodes.some((affected) => this.pathEquals(affected.path, node.path)),
    );

    // Update paths for affected nodes
    const updatedNodes: MaterializedNode<T>[] = affectedNodes.map((node) => {
      let updatedPath: PathArray;

      if (this.pathEquals(node.path, sourcePath)) {
        // This is the moved node
        updatedPath = this.clonePath(newPath);
      } else {
        // This is a descendant - update its path
        const relativePath = this.getRelativePath(sourcePath, node.path);
        if (!relativePath) {
          throw new Error(`Failed to calculate relative path for descendant`);
        }
        updatedPath = [...newPath, ...relativePath];
      }

      const updatedDepth = this.getDepth(updatedPath);

      return {
        ...node,
        path: updatedPath,
        depth: updatedDepth,
        parentId: this.pathEquals(node.path, sourcePath)
          ? newParentPath
            ? this.getLeaf(newParentPath)
            : null
          : node.parentId,
      };
    });

    const result = [...unaffectedNodes, ...updatedNodes];

    if (validate) {
      const validation = this.validateTree(result);
      if (!validation.valid) {
        throw new Error(`Move validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return result.sort((a, b) => this.comparePaths(a.path, b.path));
  }

  /** ===== SERIALIZATION ===== */

  /**
   * Serialize path array to string
   */
  public serializePath(path: PathArray, options: SerializationOptions = {}): string {
    const { separator = '/', includeRoot = true } = options;
    this.validatePath(path);

    const pathString = path.join(separator);
    return includeRoot ? `${separator}${pathString}` : pathString;
  }

  /**
   * Deserialize string to path array
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

  /** ===== VALIDATION ===== */

  /**
   * Validate a single path
   */
  public validatePathArray(path: PathArray): PathValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validatePath(path);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Path validation error');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire tree structure
   */
  public validateTree(nodes: MaterializedNode<T>[]): PathValidation {
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

      // Validate individual path
      const pathValidation = this.validatePathArray(node.path);
      errors.push(...pathValidation.errors);
      warnings.push(...(pathValidation.warnings || []));

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
      } else {
        // Root node should have depth 1
        if (node.depth !== 1) {
          errors.push(`Root node ${pathString} should have depth 1, but has depth ${node.depth}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /** ===== UTILITIES ===== */

  /**
   * Get tree statistics
   */
  public getStats(nodes: MaterializedNode<T>[]): TreeStats {
    const allPaths = nodes.map((n) => n.path);
    const depths = nodes.map((n) => n.depth);
    const depthDistribution: Record<number, number> = {};

    depths.forEach((depth) => {
      depthDistribution[depth] = (depthDistribution[depth] || 0) + 1;
    });

    return {
      totalNodes: nodes.length,
      maxDepth: Math.max(...depths, 0),
      rootCount: this.getRoots(nodes).length,
      leafCount: this.getLeaves(nodes).length,
      averageDepth: depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0,
      depthDistribution,
    };
  }

  /**
   * Convert tree to flat representation
   */
  public flatten(nodes: MaterializedNode<T>[]): FlatNode<T>[] {
    return nodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      data: node.data,
    }));
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<PathOptions> {
    return {
      maxDepth: this.maxDepth,
      caseSensitive: this.caseSensitive,
      validateIds: this.validateIds,
    };
  }

  /**
   * Create new instance with different config
   */
  public withConfig(options: Partial<PathOptions>): MaterializedPath<T> {
    return new MaterializedPath<T>({
      ...this.getConfig(),
      ...options,
    });
  }
}

/** ===== FACTORY METHODS ===== */

export namespace MaterializedPath {
  /**
   * Create default instance
   */
  export function create<T = unknown>(options?: PathOptions): MaterializedPath<T> {
    return new MaterializedPath<T>(options);
  }

  /**
   * Create instance for file system paths
   */
  export function filesystem<T = unknown>(): MaterializedPath<T> {
    return new MaterializedPath<T>({
      caseSensitive: false,
      maxDepth: 100,
      validateIds: true,
    });
  }

  /**
   * Create instance for organizational hierarchies
   */
  export function organizational<T = unknown>(): MaterializedPath<T> {
    return new MaterializedPath<T>({
      caseSensitive: true,
      maxDepth: 20,
      validateIds: true,
    });
  }

  /**
   * Create instance with relaxed validation
   */
  export function flexible<T = unknown>(): MaterializedPath<T> {
    return new MaterializedPath<T>({
      caseSensitive: false,
      maxDepth: 100,
      validateIds: false,
    });
  }
}

/** ===== CONVENIENCE FUNCTIONS ===== */

// Default instance for quick operations
const defaultPath = new MaterializedPath<unknown>();

/**
 * Quick path building
 */
export function buildPath(...components: NodeId[]): PathArray {
  return defaultPath.joinPath(...components);
}

/**
 * Quick ancestor check
 */
export function isAncestor(ancestorPath: PathArray, descendantPath: PathArray): boolean {
  return defaultPath.isAncestor(ancestorPath, descendantPath);
}

/**
 * Quick tree building
 */
export function buildTree<T = unknown>(flatNodes: FlatNode<T>[]): MaterializedNode<T>[] {
  const pathInstance = new MaterializedPath<T>();
  return pathInstance.build(flatNodes);
}

/**
 * Quick path validation
 */
export function validatePath(path: PathArray): PathValidation {
  return defaultPath.validatePathArray(path);
}

/**
 * Quick path serialization
 */
export function serializePath(path: PathArray, separator = '/'): string {
  return defaultPath.serializePath(path, { separator });
}

/**
 * Quick path deserialization
 */
export function deserializePath(pathString: string, separator = '/'): PathArray {
  return defaultPath.deserializePath(pathString, { separator });
}

export default MaterializedPath;
