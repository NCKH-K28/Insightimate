/** ===== TYPES AND INTERFACES ===== */

export type NodeId = string;
export type PathString = string;

export interface MaterializedNode<T = unknown> {
  id: NodeId;
  path: PathString;
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
  /** Path separator (default: '/') */
  separator?: string;
  /** Include root separator (default: true) */
  includeRoot?: boolean;
  /** Maximum depth allowed (default: 50) */
  maxDepth?: number;
  /** Case sensitive paths (default: true) */
  caseSensitive?: boolean;
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

/** ===== CORE MATERIALIZED PATH CLASS ===== */

export class MaterializedPath<T = unknown> {
  private readonly separator: string;
  private readonly includeRoot: boolean;
  private readonly maxDepth: number;
  private readonly caseSensitive: boolean;

  constructor(options: PathOptions = {}) {
    this.separator = options.separator ?? '/';
    this.includeRoot = options.includeRoot ?? true;
    this.maxDepth = options.maxDepth ?? 50;
    this.caseSensitive = options.caseSensitive ?? true;

    this.validateOptions();
  }

  /** ===== PRIVATE UTILITY METHODS ===== */

  /**
   * Validate constructor options
   */
  private validateOptions(): void {
    if (this.separator.length === 0) {
      throw new Error('Separator cannot be empty');
    }
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
    if (!id || typeof id !== 'string') {
      throw new Error(`${context} must be a non-empty string`);
    }
    if (id.includes(this.separator)) {
      throw new Error(`${context} cannot contain separator "${this.separator}"`);
    }
    if (id.trim() !== id) {
      throw new Error(`${context} cannot have leading/trailing whitespace`);
    }
  }

  /**
   * Build path string from parent path and node ID
   */
  private buildPath(parentPath: PathString | null, nodeId: NodeId): PathString {
    this.validateNodeId(nodeId);

    if (!parentPath) {
      return this.includeRoot ? `${this.separator}${nodeId}` : nodeId;
    }

    return `${parentPath}${this.separator}${nodeId}`;
  }

  /**
   * Parse path into components
   */
  private parsePath(path: PathString): NodeId[] {
    if (!path) return [];

    let cleanPath = path;
    if (this.includeRoot && path.startsWith(this.separator)) {
      cleanPath = path.substring(this.separator.length);
    }

    return cleanPath ? cleanPath.split(this.separator).filter(Boolean) : [];
  }

  /**
   * Get parent path from a given path
   */
  private getParentPath(path: PathString): PathString | null {
    const components = this.parsePath(path);
    if (components.length <= 1) return null;

    const parentComponents = components.slice(0, -1);
    return this.includeRoot
      ? `${this.separator}${parentComponents.join(this.separator)}`
      : parentComponents.join(this.separator);
  }

  /**
   * Calculate depth from path
   */
  private calculateDepth(path: PathString): number {
    return this.parsePath(path).length;
  }

  /** ===== PATH CONSTRUCTION ===== */

  /**
   * Create root path
   */
  public createRootPath(nodeId: NodeId): PathString {
    this.validateNodeId(nodeId);
    return this.includeRoot ? `${this.separator}${nodeId}` : nodeId;
  }

  /**
   * Create child path
   */
  public createChildPath(parentPath: PathString, nodeId: NodeId): PathString {
    if (!parentPath) {
      throw new Error('Parent path is required');
    }
    return this.buildPath(parentPath, nodeId);
  }

  /**
   * Join path components
   */
  public joinPath(...components: NodeId[]): PathString {
    if (components.length === 0) {
      throw new Error('At least one component is required');
    }

    components.forEach((comp, index) => this.validateNodeId(comp, `component at index ${index}`));

    const joined = components.join(this.separator);
    return this.includeRoot ? `${this.separator}${joined}` : joined;
  }

  /** ===== PATH ANALYSIS ===== */

  /**
   * Get all path components
   */
  public getComponents(path: PathString): NodeId[] {
    return this.parsePath(path);
  }

  /**
   * Get last component (leaf node ID)
   */
  public getLeaf(path: PathString): NodeId | null {
    const components = this.parsePath(path);
    return components.length > 0 ? components[components.length - 1] : null;
  }

  /**
   * Get parent path
   */
  public getParent(path: PathString): PathString | null {
    return this.getParentPath(path);
  }

  /**
   * Get root component
   */
  public getRoot(path: PathString): NodeId | null {
    const components = this.parsePath(path);
    return components.length > 0 ? components[0] : null;
  }

  /**
   * Get path depth (0-based)
   */
  public getDepth(path: PathString): number {
    return this.calculateDepth(path);
  }

  /**
   * Check if path is root
   */
  public isRoot(path: PathString): boolean {
    return this.getDepth(path) === 1;
  }

  /**
   * Check if path is leaf (no way to determine without tree context)
   */
  public isLeaf(path: PathString, allPaths: PathString[]): boolean {
    return !allPaths.some((p) => this.isDescendant(p, path) && p !== path);
  }

  /** ===== PATH RELATIONSHIPS ===== */

  /**
   * Check if path1 is ancestor of path2
   */
  public isAncestor(ancestorPath: PathString, descendantPath: PathString): boolean {
    if (ancestorPath === descendantPath) return false;

    const ancestorComponents = this.parsePath(ancestorPath);
    const descendantComponents = this.parsePath(descendantPath);

    if (ancestorComponents.length >= descendantComponents.length) return false;

    for (let i = 0; i < ancestorComponents.length; i++) {
      const ancestorComp = this.normalizeId(ancestorComponents[i]);
      const descendantComp = this.normalizeId(descendantComponents[i]);
      if (ancestorComp !== descendantComp) return false;
    }

    return true;
  }

  /**
   * Check if path1 is descendant of path2
   */
  public isDescendant(descendantPath: PathString, ancestorPath: PathString): boolean {
    return this.isAncestor(ancestorPath, descendantPath);
  }

  /**
   * Check if path1 is direct parent of path2
   */
  public isDirectParent(parentPath: PathString, childPath: PathString): boolean {
    const parentComponents = this.parsePath(parentPath);
    const childComponents = this.parsePath(childPath);

    return (
      childComponents.length === parentComponents.length + 1 &&
      this.isAncestor(parentPath, childPath)
    );
  }

  /**
   * Check if path1 is direct child of path2
   */
  public isDirectChild(childPath: PathString, parentPath: PathString): boolean {
    return this.isDirectParent(parentPath, childPath);
  }

  /**
   * Check if paths are siblings
   */
  public isSibling(path1: PathString, path2: PathString): boolean {
    if (path1 === path2) return false;

    const parent1 = this.getParent(path1);
    const parent2 = this.getParent(path2);

    return parent1 !== null && parent2 !== null && parent1 === parent2;
  }

  /**
   * Get common ancestor path
   */
  public getCommonAncestor(path1: PathString, path2: PathString): PathString | null {
    const components1 = this.parsePath(path1);
    const components2 = this.parsePath(path2);

    const commonComponents: NodeId[] = [];
    const minLength = Math.min(components1.length, components2.length);

    for (let i = 0; i < minLength; i++) {
      const comp1 = this.normalizeId(components1[i]);
      const comp2 = this.normalizeId(components2[i]);

      if (comp1 === comp2) {
        commonComponents.push(components1[i]); // Keep original case
      } else {
        break;
      }
    }

    if (commonComponents.length === 0) return null;

    return this.includeRoot
      ? `${this.separator}${commonComponents.join(this.separator)}`
      : commonComponents.join(this.separator);
  }

  /**
   * Calculate distance between paths
   */
  public getDistance(path1: PathString, path2: PathString): number {
    const common = this.getCommonAncestor(path1, path2);
    if (!common) return -1; // No common ancestor

    const depth1 = this.getDepth(path1);
    const depth2 = this.getDepth(path2);
    const commonDepth = this.getDepth(common);

    return depth1 - commonDepth + (depth2 - commonDepth);
  }

  /** ===== TREE BUILDING ===== */

  /**
   * Build materialized paths from flat node structure
   * ✅ FIX: Proper generic type handling
   */
  public build(flatNodes: FlatNode<T>[]): MaterializedNode<T>[] {
    const result: MaterializedNode<T>[] = [];
    const nodeMap = new Map<NodeId, FlatNode<T>>();
    const pathCache = new Map<NodeId, PathString>();
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
    const buildPath = (nodeId: NodeId): PathString => {
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

      let path: PathString;
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
        const depth = this.calculateDepth(path);

        if (depth > this.maxDepth) {
          throw new Error(
            `Maximum depth exceeded for node ${node.id}: ${depth} > ${this.maxDepth}`,
          );
        }

        result.push({
          id: node.id,
          path,
          parentId: node.parentId,
          depth,
          data: node.data, // ✅ FIX: This maintains the T type
        });
      } catch (error) {
        throw new Error(
          `Failed to build path for node ${node.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return result.sort((a, b) => a.path.localeCompare(b.path));
  }

  /** ===== TREE QUERIES ===== */

  /**
   * Get all descendants of a path
   * ✅ FIX: Proper return type
   */
  public getDescendants(
    nodes: MaterializedNode<T>[],
    ancestorPath: PathString,
    options: QueryOptions = {},
  ): MaterializedNode<T>[] {
    const { includeSelf = false, maxDepth, minDepth = 0 } = options;
    const ancestorDepth = this.getDepth(ancestorPath);

    return nodes.filter((node) => {
      if (includeSelf && node.path === ancestorPath) return true;
      if (!this.isDescendant(node.path, ancestorPath)) return false;

      const relativeDepth = node.depth - ancestorDepth;
      if (relativeDepth < minDepth) return false;
      if (maxDepth !== undefined && relativeDepth > maxDepth) return false;

      return true;
    });
  }

  /**
   * Get all ancestors of a path
   * ✅ FIX: Proper return type
   */
  public getAncestors(
    nodes: MaterializedNode<T>[],
    descendantPath: PathString,
    options: QueryOptions = {},
  ): MaterializedNode<T>[] {
    const { includeSelf = false } = options;

    return nodes
      .filter((node) => {
        if (includeSelf && node.path === descendantPath) return true;
        return this.isAncestor(node.path, descendantPath);
      })
      .sort((a, b) => a.depth - b.depth);
  }

  /**
   * Get direct children of a path
   * ✅ FIX: Proper return type
   */
  public getChildren(nodes: MaterializedNode<T>[], parentPath: PathString): MaterializedNode<T>[] {
    return nodes.filter((node) => this.isDirectChild(node.path, parentPath));
  }

  /**
   * Get parent node
   * ✅ FIX: Proper return type
   */
  public getParentNode(
    nodes: MaterializedNode<T>[],
    childPath: PathString,
  ): MaterializedNode<T> | null {
    const parentPath = this.getParent(childPath);
    if (!parentPath) return null;

    return nodes.find((node) => node.path === parentPath) || null;
  }

  /**
   * Get siblings of a path
   * ✅ FIX: Proper return type
   */
  public getSiblings(
    nodes: MaterializedNode<T>[],
    path: PathString,
    includeSelf = false,
  ): MaterializedNode<T>[] {
    const parentPath = this.getParent(path);
    if (!parentPath) return includeSelf ? nodes.filter((n) => n.path === path) : [];

    const siblings = this.getChildren(nodes, parentPath);
    return includeSelf ? siblings : siblings.filter((node) => node.path !== path);
  }

  /**
   * Get root nodes
   * ✅ FIX: Proper return type
   */
  public getRoots(nodes: MaterializedNode<T>[]): MaterializedNode<T>[] {
    return nodes.filter((node) => this.isRoot(node.path));
  }

  /**
   * Get leaf nodes
   * ✅ FIX: Proper return type
   */
  public getLeaves(nodes: MaterializedNode<T>[]): MaterializedNode<T>[] {
    const allPaths = nodes.map((n) => n.path);
    return nodes.filter((node) => this.isLeaf(node.path, allPaths));
  }

  /**
   * Get nodes at specific depth
   * ✅ FIX: Proper return type
   */
  public getNodesAtDepth(nodes: MaterializedNode<T>[], depth: number): MaterializedNode<T>[] {
    return nodes.filter((node) => node.depth === depth);
  }

  /**
   * Find node by path
   * ✅ FIX: Proper return type
   */
  public findByPath(nodes: MaterializedNode<T>[], path: PathString): MaterializedNode<T> | null {
    return nodes.find((node) => node.path === path) || null;
  }

  /**
   * Find nodes by ID
   * ✅ FIX: Proper return type
   */
  public findById(nodes: MaterializedNode<T>[], id: NodeId): MaterializedNode<T>[] {
    const normalizedId = this.normalizeId(id);
    return nodes.filter((node) => this.normalizeId(node.id) === normalizedId);
  }

  /** ===== TREE MODIFICATIONS ===== */

  /**
   * Add a new node
   * ✅ FIX: Proper return type and input handling
   */
  public addNode(
    nodes: MaterializedNode<T>[],
    newNode: FlatNode<T>,
    parentPath?: PathString,
  ): MaterializedNode<T>[] {
    this.validateNodeId(newNode.id);

    // Check for duplicate ID
    if (this.findById(nodes, newNode.id).length > 0) {
      throw new Error(`Node with ID ${newNode.id} already exists`);
    }

    let path: PathString;
    let parentId: NodeId | null = null;

    if (parentPath) {
      // Validate parent exists
      const parent = this.findByPath(nodes, parentPath);
      if (!parent) {
        throw new Error(`Parent path not found: ${parentPath}`);
      }

      path = this.createChildPath(parentPath, newNode.id);
      parentId = parent.id;
    } else {
      // Root node
      path = this.createRootPath(newNode.id);
    }

    const depth = this.calculateDepth(path);
    if (depth > this.maxDepth) {
      throw new Error(`Maximum depth exceeded: ${depth} > ${this.maxDepth}`);
    }

    const materializedNode: MaterializedNode<T> = {
      id: newNode.id,
      path,
      parentId,
      depth,
      data: newNode.data, // ✅ FIX: Maintains T type
    };

    return [...nodes, materializedNode].sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Remove a node and all its descendants
   * ✅ FIX: Proper return type
   */
  public removeNode(nodes: MaterializedNode<T>[], targetPath: PathString): MaterializedNode<T>[] {
    const descendants = this.getDescendants(nodes, targetPath, { includeSelf: true });
    const descendantPaths = new Set(descendants.map((n) => n.path));

    return nodes.filter((node) => !descendantPaths.has(node.path));
  }

  /**
   * Move a node to a new parent
   * ✅ FIX: Proper return type and type preservation
   */
  public moveNode(
    nodes: MaterializedNode<T>[],
    sourcePath: PathString,
    newParentPath: PathString | null,
    options: MoveOptions = {},
  ): MaterializedNode<T>[] {
    const { allowDescendantMove = false, validate = true } = options;

    // Find source node
    const sourceNode = this.findByPath(nodes, sourcePath);
    if (!sourceNode) {
      throw new Error(`Source node not found: ${sourcePath}`);
    }

    // Validate destination
    if (newParentPath) {
      const newParent = this.findByPath(nodes, newParentPath);
      if (!newParent) {
        throw new Error(`New parent not found: ${newParentPath}`);
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

    const newDepth = this.calculateDepth(newPath);
    if (newDepth > this.maxDepth) {
      throw new Error(`Move would exceed maximum depth: ${newDepth} > ${this.maxDepth}`);
    }

    // Get all affected nodes (source and descendants)
    const affectedNodes = this.getDescendants(nodes, sourcePath, { includeSelf: true });
    const unaffectedNodes = nodes.filter(
      (node) => !affectedNodes.some((affected) => affected.path === node.path),
    );

    // Update paths for affected nodes
    const updatedNodes: MaterializedNode<T>[] = affectedNodes.map((node) => {
      let updatedPath: PathString;

      if (node.path === sourcePath) {
        // This is the moved node
        updatedPath = newPath;
      } else {
        // This is a descendant - update its path
        const relativePath = node.path.substring(sourcePath.length);
        updatedPath = `${newPath}${relativePath}`;
      }

      const updatedDepth = this.calculateDepth(updatedPath);

      return {
        ...node, // ✅ FIX: Preserve all properties including data: T
        path: updatedPath,
        depth: updatedDepth,
        parentId:
          node.path === sourcePath
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

    return result.sort((a, b) => a.path.localeCompare(b.path));
  }

  /** ===== VALIDATION ===== */

  /**
   * Validate a single path
   */
  public validatePath(path: PathString): PathValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const components = this.parsePath(path);

      if (components.length === 0) {
        errors.push('Path cannot be empty');
        return { valid: false, errors, warnings };
      }

      // Validate each component
      components.forEach((component, index) => {
        try {
          this.validateNodeId(component, `component at index ${index}`);
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'Invalid component');
        }
      });

      // Check depth
      if (components.length > this.maxDepth) {
        errors.push(`Path depth ${components.length} exceeds maximum ${this.maxDepth}`);
      }

      // Check for suspicious patterns
      if (components.some((comp) => comp.includes('..'))) {
        warnings.push('Path contains ".." which might be unintentional');
      }
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
   * ✅ FIX: Proper input type
   */
  public validateTree(nodes: MaterializedNode<T>[]): PathValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const pathSet = new Set<string>();
    const idSet = new Set<string>();

    for (const node of nodes) {
      // Check for duplicate paths
      const normalizedPath = this.caseSensitive ? node.path : node.path.toLowerCase();
      if (pathSet.has(normalizedPath)) {
        errors.push(`Duplicate path: ${node.path}`);
      }
      pathSet.add(normalizedPath);

      // Check for duplicate IDs
      const normalizedId = this.normalizeId(node.id);
      if (idSet.has(normalizedId)) {
        errors.push(`Duplicate ID: ${node.id}`);
      }
      idSet.add(normalizedId);

      // Validate individual path
      const pathValidation = this.validatePath(node.path);
      errors.push(...pathValidation.errors);
      warnings.push(...(pathValidation.warnings || []));

      // Validate depth consistency
      const calculatedDepth = this.calculateDepth(node.path);
      if (node.depth !== calculatedDepth) {
        errors.push(
          `Depth mismatch for ${node.path}: stored=${node.depth}, calculated=${calculatedDepth}`,
        );
      }

      // Validate parent relationship
      if (node.parentId) {
        const parentPath = this.getParent(node.path);
        const parentNode = nodes.find((n) => n.path === parentPath);

        if (!parentNode) {
          errors.push(`Parent node not found for ${node.path}`);
        } else if (parentNode.id !== node.parentId) {
          errors.push(
            `Parent ID mismatch for ${node.path}: expected=${parentNode.id}, actual=${node.parentId}`,
          );
        }
      } else {
        // Root node should not have parent in path
        if (this.getParent(node.path)) {
          errors.push(`Root node ${node.path} has parent in path but parentId is null`);
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
   * ✅ FIX: Proper input type and return type
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
   * ✅ FIX: Proper input and return types
   */
  public flatten(nodes: MaterializedNode<T>[]): FlatNode<T>[] {
    return nodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      data: node.data, // ✅ FIX: Maintains T type
    }));
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<PathOptions> {
    return {
      separator: this.separator,
      includeRoot: this.includeRoot,
      maxDepth: this.maxDepth,
      caseSensitive: this.caseSensitive,
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
   * ✅ FIX: Proper generic parameter
   */
  export function create<T = unknown>(options?: PathOptions): MaterializedPath<T> {
    return new MaterializedPath<T>(options);
  }

  /**
   * Create instance for file system paths
   * ✅ FIX: Proper generic parameter
   */
  export function filesystem<T = unknown>(): MaterializedPath<T> {
    return new MaterializedPath<T>({
      separator: '/',
      includeRoot: true,
      caseSensitive: false,
      maxDepth: 100,
    });
  }

  /**
   * Create instance for URL paths
   * ✅ FIX: Proper generic parameter
   */
  export function url<T = unknown>(): MaterializedPath<T> {
    return new MaterializedPath<T>({
      separator: '/',
      includeRoot: true,
      caseSensitive: true,
      maxDepth: 50,
    });
  }

  /**
   * Create instance for hierarchical IDs
   * ✅ FIX: Proper generic parameter
   */
  export function hierarchical<T = unknown>(): MaterializedPath<T> {
    return new MaterializedPath<T>({
      separator: '.',
      includeRoot: false,
      caseSensitive: true,
      maxDepth: 20,
    });
  }
}

/** ===== CONVENIENCE FUNCTIONS ===== */

// ✅ FIX: Create default instance without generic to handle unknown type
const defaultPath = new MaterializedPath<unknown>();

/**
 * Quick path building
 */
export function buildPath(...components: NodeId[]): PathString {
  return defaultPath.joinPath(...components);
}

/**
 * Quick ancestor check
 */
export function isAncestor(ancestorPath: PathString, descendantPath: PathString): boolean {
  return defaultPath.isAncestor(ancestorPath, descendantPath);
}

/**
 * Quick tree building
 * ✅ FIX: Proper generic handling
 */
export function buildTree<T = unknown>(flatNodes: FlatNode<T>[]): MaterializedNode<T>[] {
  const pathInstance = new MaterializedPath<T>();
  return pathInstance.build(flatNodes);
}

/**
 * Quick path validation
 */
export function validatePath(path: PathString): PathValidation {
  return defaultPath.validatePath(path);
}

export default MaterializedPath;
