import { RuleDslV1Schema, RuleNode } from "./schema";

const MAX_DSL_BYTE_SIZE = 10 * 1024; // 10 KB
const MAX_TREE_DEPTH = 3;
const MAX_TOTAL_CONDITIONS = 10;

export type DslValidationResult = 
  | { valid: true; parsedNode: RuleNode }
  | { valid: false; privacySafeError: string };

function calculateUtf8ByteSize(obj: unknown): number {
  try {
    const jsonString = JSON.stringify(obj);
    return Buffer.byteLength(jsonString, "utf8");
  } catch {
    return Infinity; // Fail safe for circular or un-stringifiable objects
  }
}

function analyzeTree(node: RuleNode, currentDepth: number): { depth: number; conditionCount: number } {
  if (currentDepth > MAX_TREE_DEPTH) {
    return { depth: currentDepth, conditionCount: 0 };
  }

  if ("AND" in node && node.AND) {
    let maxChildDepth = 0;
    let totalConditions = 0;
    for (const child of node.AND) {
      const stats = analyzeTree(child, currentDepth + 1);
      if (stats.depth > maxChildDepth) maxChildDepth = stats.depth;
      totalConditions += stats.conditionCount;
    }
    return { depth: Math.max(currentDepth, maxChildDepth), conditionCount: totalConditions };
  }

  if ("OR" in node && node.OR) {
    let maxChildDepth = 0;
    let totalConditions = 0;
    for (const child of node.OR) {
      const stats = analyzeTree(child, currentDepth + 1);
      if (stats.depth > maxChildDepth) maxChildDepth = stats.depth;
      totalConditions += stats.conditionCount;
    }
    return { depth: Math.max(currentDepth, maxChildDepth), conditionCount: totalConditions };
  }

  if ("NOT" in node && node.NOT) {
    const stats = analyzeTree(node.NOT, currentDepth + 1);
    return { depth: Math.max(currentDepth, stats.depth), conditionCount: stats.conditionCount };
  }

  // Comparison node
  return { depth: currentDepth, conditionCount: 1 };
}

export function validateRuleDsl(dslInput: unknown): DslValidationResult {
  // 1. Check UTF-8 Byte Size
  const byteSize = calculateUtf8ByteSize(dslInput);
  if (byteSize > MAX_DSL_BYTE_SIZE) {
    return { valid: false, privacySafeError: "DSL_PAYLOAD_TOO_LARGE" };
  }

  // 2. Strict Zod Schema parsing
  const parseResult = RuleDslV1Schema.safeParse(dslInput);
  if (!parseResult.success) {
    return { valid: false, privacySafeError: "DSL_SCHEMA_VALIDATION_FAILED" };
  }

  const parsedNode = parseResult.data;

  // 3. Tree Depth and Condition Count
  const stats = analyzeTree(parsedNode, 1);
  
  if (stats.depth > MAX_TREE_DEPTH) {
    return { valid: false, privacySafeError: "DSL_MAX_DEPTH_EXCEEDED" };
  }

  if (stats.conditionCount > MAX_TOTAL_CONDITIONS) {
    return { valid: false, privacySafeError: "DSL_MAX_CONDITIONS_EXCEEDED" };
  }

  return { valid: true, parsedNode };
}
