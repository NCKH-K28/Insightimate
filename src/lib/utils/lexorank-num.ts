/* eslint-disable @typescript-eslint/no-namespace */

import Decimal from 'decimal.js';

/** ===== TYPES AND INTERFACES ===== */

export type RankValue = string | number | Decimal;

export interface LexRankOptions {
  /** Precision for Decimal calculations (default: 20) */
  precision?: number;
  /** Initial rank value (default: 1) */
  initialRank?: RankValue;
  /** Step size for generating sequential ranks (default: 1) */
  stepSize?: RankValue;
  /** Minimum distance between ranks to prevent collision (default: 0.000001) */
  minDistance?: RankValue;
}

export interface RankRange {
  start?: number | null;
  end?: number | null;
}

export interface RankValidation {
  valid: boolean;
  errors: string[];
}

/** ===== CORE LEXRANK CLASS ===== */

export class LexRank {
  private readonly precision: number;
  private readonly initialRank: Decimal;
  private readonly stepSize: Decimal;
  private readonly minDistance: Decimal;

  constructor(options: LexRankOptions = {}) {
    this.precision = options.precision ?? 20;
    this.initialRank = new Decimal(options.initialRank ?? 1);
    this.stepSize = new Decimal(options.stepSize ?? 1);
    this.minDistance = new Decimal(options.minDistance ?? 0.000001);
  }

  /** ===== PRIVATE UTILITY METHODS ===== */

  /**
   * Convert any rank value to Decimal with instance precision
   */
  // FIXME: move to public range
  public toDecimal(value: RankValue): Decimal {
    if (value instanceof Decimal) {
      return new Decimal(value.toString()).toDP(this.precision);
    }
    return new Decimal(value).toDP(this.precision);
  }

  /**
   * Convert Decimal to number for return values
   */
  private toNumber(decimal: Decimal): number {
    return decimal.toNumber();
  }

  /**
   * Validate that a rank value is valid
   */
  private validateRank(rank: RankValue, context = 'rank'): void {
    try {
      const decimal = this.toDecimal(rank);
      if (!decimal.isFinite()) {
        throw new Error(`${context} must be a finite number`);
      }
      if (decimal.isNaN()) {
        throw new Error(`${context} cannot be NaN`);
      }
    } catch (error) {
      throw new Error(
        `Invalid ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Ensure minimum distance between two ranks
   */
  private ensureMinDistance(rank1: Decimal, rank2: Decimal): boolean {
    return rank1.sub(rank2).abs().gte(this.minDistance);
  }

  /** ===== BASIC RANK GENERATION ===== */

  /**
   * Generate the first rank in a sequence
   */
  public first(): number {
    return this.toNumber(this.initialRank);
  }

  /**
   * Get the initial rank value
   */
  public initial(): number {
    return this.toNumber(this.initialRank);
  }

  /**
   * Generate the next rank in a sequence
   */
  public next(rank: RankValue): number {
    this.validateRank(rank, 'rank');
    const decimal = this.toDecimal(rank);
    return this.toNumber(decimal.add(this.stepSize));
  }

  /**
   * Generate the previous rank in a sequence
   */
  public prev(rank: RankValue): number {
    this.validateRank(rank, 'rank');
    const decimal = this.toDecimal(rank);
    return this.toNumber(decimal.sub(this.stepSize));
  }

  /**
   * Generate a rank between two ranks
   */
  public between(startRank: RankValue, endRank: RankValue): number {
    this.validateRank(startRank, 'startRank');
    this.validateRank(endRank, 'endRank');

    const start = this.toDecimal(startRank);
    const end = this.toDecimal(endRank);

    if (start.gte(end)) {
      throw new Error('startRank must be less than endRank');
    }

    const middle = start.add(end).div(2);

    // ✅ FIX: Kiểm tra space hợp lý hơn
    const spaceFromStart = middle.sub(start);
    const spaceFromEnd = end.sub(middle);

    if (spaceFromStart.lt(this.minDistance) || spaceFromEnd.lt(this.minDistance)) {
      throw new Error('Cannot create rank between given values - insufficient space');
    }

    return this.toNumber(middle);
  }

  /**
   * Generate a rank after a given rank
   */
  public after(rank: RankValue): number {
    this.validateRank(rank, 'rank');
    const decimal = this.toDecimal(rank);
    return this.toNumber(decimal.add(this.stepSize));
  }

  /**
   * Generate a rank before a given rank
   */
  public before(rank: RankValue): number {
    this.validateRank(rank, 'rank');
    const decimal = this.toDecimal(rank);
    return this.toNumber(decimal.sub(this.stepSize));
  }

  /**
   * Generate a rank in a range with fallback logic
   */
  public inRange(range: RankRange): number {
    const { start, end } = range;

    // Both bounds provided
    if (start !== null && start !== undefined && end !== null && end !== undefined) {
      return this.between(start, end);
    }

    // Only start bound
    if (start !== null && start !== undefined && (end === null || end === undefined)) {
      return this.after(start);
    }

    // Only end bound
    if ((start === null || start === undefined) && end !== null && end !== undefined) {
      return this.before(end);
    }

    // No bounds - return initial rank
    return this.first();
  }

  /** ===== SEQUENCE GENERATION ===== */

  /**
   * Generate a sequence of ranks
   */
  public sequence(count: number, startRank?: RankValue): number[] {
    if (count <= 0) return [];
    if (count === 1) return [startRank ? this.toNumber(this.toDecimal(startRank)) : this.first()];

    const start = startRank ? this.toDecimal(startRank) : this.initialRank;
    const ranks: number[] = [];

    for (let i = 0; i < count; i++) {
      ranks.push(this.toNumber(start.add(this.stepSize.mul(i))));
    }

    return ranks;
  }

  /**
   * Generate ranks between two bounds with equal spacing
   */
  public distribute(count: number, startRank: RankValue, endRank: RankValue): number[] {
    if (count <= 0) return [];
    if (count === 1) return [this.between(startRank, endRank)];

    this.validateRank(startRank, 'startRank');
    this.validateRank(endRank, 'endRank');

    const start = this.toDecimal(startRank);
    const end = this.toDecimal(endRank);

    if (start.gte(end)) {
      throw new Error('startRank must be less than endRank');
    }

    // ✅ FIX: Kiểm tra space đủ cho distribution
    const totalSpace = end.sub(start);
    const neededSpace = this.minDistance.mul(count + 1);

    if (totalSpace.lt(neededSpace)) {
      throw new Error('Insufficient space for distribution');
    }

    const interval = totalSpace.div(count + 1);
    const ranks: number[] = [];

    for (let i = 1; i <= count; i++) {
      ranks.push(this.toNumber(start.add(interval.mul(i))));
    }

    return ranks;
  }

  /**
   * Generate multiple ranks between consecutive pairs
   */
  public fill(ranks: RankValue[], insertCount = 1): number[] {
    if (ranks.length < 2) {
      throw new Error('Need at least 2 ranks to fill between');
    }

    const result: number[] = [];
    const sortedRanks = [...ranks].map((r) => this.toDecimal(r)).sort((a, b) => a.comparedTo(b));

    result.push(this.toNumber(sortedRanks[0]));

    for (let i = 0; i < sortedRanks.length - 1; i++) {
      const current = sortedRanks[i];
      const next = sortedRanks[i + 1];

      try {
        // Add distributed ranks between current and next
        const betweenRanks = this.distribute(insertCount, current, next);
        result.push(...betweenRanks);
      } catch (error) {
        // ✅ FIX: Nếu không đủ space, skip insertion
        console.warn(
          `Cannot fill between ${current} and ${next}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      result.push(this.toNumber(next));
    }

    return result;
  }

  /** ===== RANK ANALYSIS AND UTILITIES ===== */

  /**
   * Get the minimum rank from an array
   */
  public min(ranks: RankValue[]): number | null {
    if (ranks.length === 0) return null;
    const decimals = ranks.map((r) => this.toDecimal(r));
    const minDecimal = decimals.reduce((min, current) => (current.lt(min) ? current : min));
    return this.toNumber(minDecimal);
  }

  /**
   * Get the maximum rank from an array
   */
  public max(ranks: RankValue[]): number | null {
    if (ranks.length === 0) return null;
    const decimals = ranks.map((r) => this.toDecimal(r));
    const maxDecimal = decimals.reduce((max, current) => (current.gt(max) ? current : max));
    return this.toNumber(maxDecimal);
  }

  /**
   * Get range of ranks
   */
  public getRange(ranks: RankValue[]): RankRange {
    return {
      start: this.min(ranks),
      end: this.max(ranks),
    };
  }

  /**
   * Sort ranks in ascending order
   */
  public sort(ranks: RankValue[]): number[] {
    return ranks
      .map((r) => this.toDecimal(r))
      .sort((a, b) => a.comparedTo(b))
      .map((d) => this.toNumber(d));
  }

  /**
   * Check if ranks are in valid order (for sorted array)
   */
  public validate(ranks: RankValue[], assumeSorted = false): RankValidation {
    const errors: string[] = [];

    // ✅ FIX: Sort trước khi validate nếu cần
    const decimals = assumeSorted
      ? ranks.map((r) => this.toDecimal(r))
      : ranks.map((r) => this.toDecimal(r)).sort((a, b) => a.comparedTo(b));

    for (let i = 0; i < decimals.length - 1; i++) {
      const current = decimals[i];
      const next = decimals[i + 1];

      if (current.gte(next)) {
        errors.push(
          `Rank at index ${i} (${current.toString()}) is not less than rank at index ${
            i + 1
          } (${next.toString()})`,
        );
      }

      if (!this.ensureMinDistance(next, current)) {
        errors.push(`Insufficient distance between ranks at indices ${i} and ${i + 1}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalize ranks to prevent overflow/underflow
   */
  public normalize(ranks: RankValue[], newStart?: RankValue): number[] {
    if (ranks.length === 0) return [];

    const sorted = this.sort(ranks);
    const start = newStart ? this.toDecimal(newStart) : this.initialRank;

    return sorted.map((_, index) => this.toNumber(start.add(this.stepSize.mul(index))));
  }

  /**
   * Remove duplicate ranks and normalize
   */
  public deduplicate(ranks: RankValue[]): number[] {
    const uniqueDecimals = new Map<string, Decimal>();

    for (const rank of ranks) {
      const decimal = this.toDecimal(rank);
      const key = decimal.toFixed(); // ✅ FIX: Dùng toFixed() thay vì toString()
      if (!uniqueDecimals.has(key)) {
        uniqueDecimals.set(key, decimal);
      }
    }

    return Array.from(uniqueDecimals.values())
      .sort((a, b) => a.comparedTo(b))
      .map((d) => this.toNumber(d));
  }

  /** ===== INSERTION AND POSITIONING ===== */

  /**
   * Insert a rank at a specific position in a sorted array
   */
  public insertAt(ranks: RankValue[], position: number): number {
    const sorted = this.sort(ranks);

    if (position <= 0) {
      // Insert at beginning
      return sorted.length > 0 ? this.before(sorted[0]) : this.first();
    }

    if (position >= sorted.length) {
      // Insert at end
      return sorted.length > 0 ? this.after(sorted[sorted.length - 1]) : this.first();
    }

    // Insert between existing ranks
    return this.between(sorted[position - 1], sorted[position]);
  }

  /**
   * ✅ FIX: Logic hoàn toàn mới cho insertBefore
   */
  public insertBefore(ranks: RankValue[], targetRank: RankValue): number {
    this.validateRank(targetRank, 'targetRank');

    const sorted = this.sort(ranks);
    const target = this.toDecimal(targetRank);

    // Tìm vị trí của target hoặc vị trí nó sẽ được insert
    let insertIndex = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      if (this.toDecimal(sorted[i]).gte(target)) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === 0) {
      // Insert trước phần tử đầu tiên
      return this.before(sorted[0]);
    } else {
      // Insert giữa insertIndex-1 và insertIndex
      const prevRank = sorted[insertIndex - 1];
      const nextRank = insertIndex < sorted.length ? sorted[insertIndex] : null;

      if (nextRank === null) {
        return this.after(prevRank);
      } else {
        return this.between(prevRank, nextRank);
      }
    }
  }

  /**
   * ✅ FIX: Logic hoàn toàn mới cho insertAfter
   */
  public insertAfter(ranks: RankValue[], targetRank: RankValue): number {
    this.validateRank(targetRank, 'targetRank');

    const sorted = this.sort(ranks);
    const target = this.toDecimal(targetRank);

    // Tìm vị trí sau target
    let insertIndex = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      if (this.toDecimal(sorted[i]).gt(target)) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === sorted.length) {
      // Insert sau phần tử cuối
      return this.after(sorted[sorted.length - 1]);
    } else {
      // Insert giữa insertIndex-1 và insertIndex
      const prevRank = insertIndex > 0 ? sorted[insertIndex - 1] : null;
      const nextRank = sorted[insertIndex];

      if (prevRank === null) {
        return this.before(nextRank);
      } else {
        return this.between(prevRank, nextRank);
      }
    }
  }

  /** ===== COMPARISON UTILITIES ===== */

  /**
   * Compare two ranks
   */
  public compare(rank1: RankValue, rank2: RankValue): -1 | 0 | 1 {
    const a = this.toDecimal(rank1);
    const b = this.toDecimal(rank2);
    return a.comparedTo(b) as -1 | 0 | 1;
  }

  /**
   * Check if two ranks are equal
   */
  public equals(rank1: RankValue, rank2: RankValue): boolean {
    return this.compare(rank1, rank2) === 0;
  }

  /**
   * Check if rank1 is less than rank2
   */
  public lessThan(rank1: RankValue, rank2: RankValue): boolean {
    return this.compare(rank1, rank2) === -1;
  }

  /**
   * Check if rank1 is greater than rank2
   */
  public greaterThan(rank1: RankValue, rank2: RankValue): boolean {
    return this.compare(rank1, rank2) === 1;
  }

  /**
   * Find closest rank in array to target
   */
  public findClosest(ranks: RankValue[], target: RankValue): number | null {
    if (ranks.length === 0) return null;

    const targetDecimal = this.toDecimal(target);
    let closest = this.toDecimal(ranks[0]);
    let minDistance = targetDecimal.sub(closest).abs();

    for (const rank of ranks.slice(1)) {
      const decimal = this.toDecimal(rank);
      const distance = targetDecimal.sub(decimal).abs();

      if (distance.lt(minDistance)) {
        minDistance = distance;
        closest = decimal;
      }
    }

    return this.toNumber(closest);
  }

  /** ===== CONFIGURATION ===== */

  /**
   * Get current configuration
   */
  public getConfig(): Required<LexRankOptions> {
    return {
      precision: this.precision,
      initialRank: this.toNumber(this.initialRank),
      stepSize: this.toNumber(this.stepSize),
      minDistance: this.toNumber(this.minDistance),
    };
  }

  /**
   * Create a new instance with modified config
   */
  public withConfig(options: Partial<LexRankOptions>): LexRank {
    return new LexRank({
      ...this.getConfig(),
      ...options,
    });
  }
}

/** ===== STATIC FACTORY METHODS ===== */

export namespace LexRank {
  /**
   * Create a LexRank instance with default settings
   */
  export function create(options?: LexRankOptions): LexRank {
    return new LexRank(options);
  }

  /**
   * Create a LexRank instance optimized for dense sequences
   */
  export function dense(options?: Partial<LexRankOptions>): LexRank {
    return new LexRank({
      precision: 30,
      initialRank: 1,
      stepSize: 1,
      minDistance: 0.0000000001,
      ...options,
    });
  }

  /**
   * Create a LexRank instance optimized for sparse sequences
   */
  export function sparse(options?: Partial<LexRankOptions>): LexRank {
    return new LexRank({
      precision: 20,
      initialRank: 1000,
      stepSize: 1000,
      minDistance: 0.001,
      ...options,
    });
  }

  /**
   * Create a LexRank instance for fractional rankings
   */
  export function fractional(options?: Partial<LexRankOptions>): LexRank {
    return new LexRank({
      precision: 50,
      initialRank: 0.5,
      stepSize: 0.5,
      minDistance: 0.00000000001,
      ...options,
    });
  }

  /**
   * Create a LexRank instance for integer-like rankings
   */
  export function integer(options?: Partial<LexRankOptions>): LexRank {
    return new LexRank({
      precision: 15,
      initialRank: 1,
      stepSize: 1,
      minDistance: 0.5,
      ...options,
    });
  }
}

/** ===== CONVENIENCE FUNCTIONS ===== */

// Create default instance for quick operations
const defaultLexRank = new LexRank();

/**
 * Create a quick rank between two values
 */

export const toDecimal = (value: RankValue): Decimal => {
  return defaultLexRank.toDecimal(value);
};

export function between(start: RankValue, end: RankValue): number {
  return defaultLexRank.between(start, end);
}

/**
 * Create a quick sequence of ranks
 */
export function sequence(count: number, start: RankValue = 1): number[] {
  return defaultLexRank.sequence(count, start);
}

/**
 * Sort ranks quickly
 */
export function sort(ranks: RankValue[]): number[] {
  return defaultLexRank.sort(ranks);
}

/**
 * Get rank after another rank
 */
export function after(rank: RankValue): number {
  return defaultLexRank.after(rank);
}

/**
 * Get rank before another rank
 */
export function before(rank: RankValue): number {
  return defaultLexRank.before(rank);
}

/**
 * Get first rank
 */
export function first(): number {
  return defaultLexRank.first();
}

/**
 * Insert rank at position
 */
export function insertAt(ranks: RankValue[], position: number): number {
  return defaultLexRank.insertAt(ranks, position);
}

/** ===== EXPORT DEFAULT INSTANCE ===== */

export default LexRank;
