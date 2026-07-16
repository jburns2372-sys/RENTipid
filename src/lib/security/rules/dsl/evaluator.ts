import { RuleNode, ComparisonNode, LogicalNode } from "./schema";

export function evaluateRuleDsl(node: RuleNode, eventData: Record<string, any>): boolean {
  if ("AND" in node && node.AND) {
    return node.AND.every(child => evaluateRuleDsl(child, eventData));
  }
  if ("OR" in node && node.OR) {
    return node.OR.some(child => evaluateRuleDsl(child, eventData));
  }
  if ("NOT" in node && node.NOT) {
    return !evaluateRuleDsl(node.NOT, eventData);
  }

  // It's a ComparisonNode
  const comp = node as ComparisonNode;
  const sourceValue = eventData[comp.field];

  // Null source event fields must not cause DSL validation rejection, and return false
  if (sourceValue === null || sourceValue === undefined) {
    return false;
  }

  switch (comp.operator) {
    case "EQUALS":
      return sourceValue === comp.value;
    case "NOT_EQUALS":
      return sourceValue !== comp.value;
    case "CONTAINS":
      if (typeof sourceValue !== "string") return false;
      return sourceValue.includes(comp.value as string);
    case "IN":
      if (!Array.isArray(comp.value)) return false;
      return (comp.value as any[]).includes(sourceValue);
    default:
      return false;
  }
}
