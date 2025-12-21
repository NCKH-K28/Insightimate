import { PlanNode, PlanTree, ProjectDraft } from '../schemas';

export function getHierarchy(typeId: string, contexts: ProjectDraft): number {
  const type = contexts.issueTypes.find((t) => t.id === typeId);
  return type ? type.hierarchy : -1;
}

export function findEligibleNodes(
  plan: PlanTree,
  targetHierarchy: number,
  contexts: ProjectDraft,
): { node: PlanNode; path: string }[] {
  const eligible: { node: PlanNode; path: string }[] = [];

  function traverse(node: PlanNode, path: string) {
    const h = getHierarchy(node.typeId, contexts);
    // Eligible if hierarchy > targetHierarchy AND has no children
    if (h > targetHierarchy && (!node.children || node.children.length === 0)) {
      eligible.push({ node, path });
    }

    if (node.children) {
      node.children.forEach((child) => traverse(child, path + ' > ' + child.summary));
    }
  }

  if (plan.root) {
    // Logic for root nodes ordering?
    // "PlanTree.root" is an array. We traverse them in order.
    plan.root.forEach((node) => traverse(node, node.summary));
  }

  return eligible;
}

// Helper to count distinct available hierarchies
export function countDistinctHierarchies(contexts: ProjectDraft): number {
  return new Set(contexts.issueTypes.map((t) => t.hierarchy)).size;
}
