import { createHash } from 'crypto';
import { Issue } from '../schemas';

export function canonical(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

export function generateStableKey(typeId: string, summary: string, parentPath: string): string {
  return `${typeId}|${canonical(summary)}|${parentPath}`;
}

export function deterministicId(stableKey: string): string {
  const hash = createHash('sha256').update(stableKey).digest('hex');
  // Convert hex to BigInt to encode as base36 for compactness/cuid-like appearance
  const bigInt = BigInt('0x' + hash);
  const base36 = bigInt.toString(36);
  // Ensure we return a consistent length, e.g., 24 chars + prefix
  // If base36 is shorter than 24 (unlikely for sha256), pad it?
  // SHA256 is 256 bits. 2^256 approx 1.1e77. 36^24 approx 2.2e37.
  // So base36 of sha256 is much longer than 24 chars.
  // We can safely slice.
  // Prefix with 'd' for deterministic or 'c' for cuid-like.
  return 'd' + base36.slice(0, 24);
}

export function getParentPath(
  _parentId: string | null,
  _issues: Issue[],
  // Wait, calculating parentPath for an arbitrary node in PlanTree is harder
  // because PlanTree doesn't have IDs yet.
  // The prompt says: "parentPath = canonical(parent.summary) joined from root to parent using ' > '"
  // So we need the chain of summaries.
): string {
  // Implementation will happen in the flatten step where we traverse
  return '';
}
