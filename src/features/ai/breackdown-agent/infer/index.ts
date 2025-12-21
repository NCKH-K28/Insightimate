import { ProjectDraft } from '../schemas';

export function inferTargetHierarchy(prompt: string, contexts: ProjectDraft): number {
  // 1. Available hierarchies sorted DESC (Highest level first, e.g. 2 (Epic), 1 (Story), 0 (Subtask))
  // The user prompt said: "hierarchy is descending by level; 0 is the lowest level."
  // Wait, if hierarchy is descending by level:
  // Usually hierarchy 2 > hierarchy 1 > hierarchy 0.
  // So Hmax = max value. Hmin = min value.
  // "higher-level (closer to Hmax)"
  // "deeper (closer to Hmin)"
  const availableHierarchies = Array.from(
    new Set(contexts.issueTypes.map((t) => t.hierarchy)),
  ).sort((a, b) => b - a);

  if (availableHierarchies.length === 0) {
    return 0; // Fallback
  }

  const Hmax = availableHierarchies[0];
  const Hmin = availableHierarchies[availableHierarchies.length - 1];

  const lowerPrompt = prompt.toLowerCase();

  // 2. Cue-based signals
  const highLevelCues = ['high-level', 'overview', 'brief', 'epic only'];
  const detailCues = ['detailed', 'implementation', 'step-by-step', 'sub-task', 'subtask'];

  for (const cue of highLevelCues) {
    if (lowerPrompt.includes(cue)) return Hmax;
  }
  for (const cue of detailCues) {
    if (lowerPrompt.includes(cue)) return Hmin;
  }

  // 3. Heuristic complexity score
  // score = f(promptLength, bulletCount, commaCount, numberedListCount)
  const bulletCount = (prompt.match(/^[-*]\s/gm) || []).length; // simple bullet detection
  const commaCount = (prompt.match(/,/g) || []).length;
  const numberedListCount = (prompt.match(/^\d+\.\s/gm) || []).length;
  const length = prompt.length;

  const score = length * 0.05 + bulletCount * 10 + commaCount * 1 + numberedListCount * 10;

  // Map score to bucket
  // We want low score -> index 0 (Hmax)
  // high score -> index last (Hmin)
  // Let's define specific thresholds.
  // If we have N levels, we can define N buckets.
  // e.g., 0-50 -> index 0
  // 50-100 -> index 1
  // ...
  const bucketSize = 60; // Tuning parameter
  const rawIndex = Math.floor(score / bucketSize);
  const clampedIndex = Math.min(rawIndex, availableHierarchies.length - 1);

  return availableHierarchies[clampedIndex];
}
