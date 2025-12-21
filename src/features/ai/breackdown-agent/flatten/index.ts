import { PlanTree, PlanNode, Issue, ProjectDraft } from '../schemas';
import { canonical, generateStableKey, deterministicId } from '../ids';

export function flattenPlanTree(plan: PlanTree, contexts: ProjectDraft): Issue[] {
  const issues: Issue[] = [];
  const defaultStatusId = contexts.defaultStatusId;
  const defaultPriorityId = contexts.defaultPriorityId;

  // Create a map for quick type lookup
  const typeMap = new Map(contexts.issueTypes.map((t) => [t.id, t]));

  function traverse(node: PlanNode, parentId: string | null, pathSummaries: string[]) {
    const canonicalSummary = canonical(node.summary);
    // parentPath = canonical(parent.summary) joined from root to parent using " > "
    // pathSummaries contains the summaries of the ancestors.
    const parentPath = pathSummaries.join(' > ');

    const type = typeMap.get(node.typeId);
    if (!type) {
      // In a robust system we might fallback or error.
      // Prompt says: "On error ... return JSON only: { error: ... }"
      // So throwing here is consistent with failing the request; top level catch will handle it.
      throw new Error(`Issue Type ID '${node.typeId}' not found in provided contexts.`);
    }

    const stableKey = generateStableKey(node.typeId, canonicalSummary, parentPath);
    const id = deterministicId(stableKey);

    const issue: Issue = {
      id,
      parentId,
      type: type,
      typeId: type.id,
      summary: canonicalSummary,
      description: canonical(node.description),
      storyPoints: node.storyPoints,
      statusId: defaultStatusId,
      priorityId: defaultPriorityId,
    };
    issues.push(issue);

    // Downstream code MUST preserve agent-provided children order exactly.
    if (node.children && node.children.length > 0) {
      const newPath = [...pathSummaries, canonicalSummary];
      for (const child of node.children) {
        traverse(child, id, newPath);
      }
    }
  }

  if (plan.root) {
    for (const rootNode of plan.root) {
      traverse(rootNode, null, []);
    }
  }

  return issues;
}
