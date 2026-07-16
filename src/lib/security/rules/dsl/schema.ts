import { z } from "zod";
import { SecurityDomain, SecurityEventClassification, SecuritySeverity } from "@prisma/client";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const StringFields = [
  "event_code",
  "actor_user_id",
  "target_user_id",
  "target_resource_id",
  "action_attempted",
  "action_result",
] as const;

export const DomainField = "security_domain";
export const ClassificationField = "event_classification";
export const SeverityField = "severity";

// ============================================================================
// COMPARISON SCHEMAS
// ============================================================================

const MaxStringLength = 256;
const MaxInValues = 50;

// Text Field Comparisons
const StringComparisonSchema = z.object({
  field: z.enum(StringFields),
  operator: z.enum(["EQUALS", "NOT_EQUALS", "CONTAINS"]),
  value: z.string().max(MaxStringLength),
}).strict();

const StringInComparisonSchema = z.object({
  field: z.enum(StringFields),
  operator: z.literal("IN"),
  value: z.array(z.string().max(MaxStringLength)).min(1).max(MaxInValues),
}).strict();

// Security Domain Field Comparisons
const DomainComparisonSchema = z.object({
  field: z.literal(DomainField),
  operator: z.enum(["EQUALS", "NOT_EQUALS"]),
  value: z.nativeEnum(SecurityDomain),
}).strict();

const DomainInComparisonSchema = z.object({
  field: z.literal(DomainField),
  operator: z.literal("IN"),
  value: z.array(z.nativeEnum(SecurityDomain)).min(1).max(MaxInValues),
}).strict();

// Event Classification Field Comparisons
const ClassificationComparisonSchema = z.object({
  field: z.literal(ClassificationField),
  operator: z.enum(["EQUALS", "NOT_EQUALS"]),
  value: z.nativeEnum(SecurityEventClassification),
}).strict();

const ClassificationInComparisonSchema = z.object({
  field: z.literal(ClassificationField),
  operator: z.literal("IN"),
  value: z.array(z.nativeEnum(SecurityEventClassification)).min(1).max(MaxInValues),
}).strict();

// Severity Field Comparisons
const SeverityComparisonSchema = z.object({
  field: z.literal(SeverityField),
  operator: z.enum(["EQUALS", "NOT_EQUALS"]),
  value: z.nativeEnum(SecuritySeverity),
}).strict();

const SeverityInComparisonSchema = z.object({
  field: z.literal(SeverityField),
  operator: z.literal("IN"),
  value: z.array(z.nativeEnum(SecuritySeverity)).min(1).max(MaxInValues),
}).strict();

const ComparisonNodeSchema = z.union([
  StringComparisonSchema,
  StringInComparisonSchema,
  DomainComparisonSchema,
  DomainInComparisonSchema,
  ClassificationComparisonSchema,
  ClassificationInComparisonSchema,
  SeverityComparisonSchema,
  SeverityInComparisonSchema,
]);

// ============================================================================
// RECURSIVE RULE DSL SCHEMA
// ============================================================================

export type ComparisonNode = z.infer<typeof ComparisonNodeSchema>;

export type LogicalNode = {
  AND?: RuleNode[];
  OR?: RuleNode[];
  NOT?: RuleNode;
};

export type RuleNode = ComparisonNode | LogicalNode;

// Safe z.lazy recursive DSL definition
export const RuleNodeSchema: z.ZodType<RuleNode> = z.lazy(() =>
  z.union([
    ComparisonNodeSchema,
    z.object({ AND: z.array(RuleNodeSchema).min(1) }).strict(),
    z.object({ OR: z.array(RuleNodeSchema).min(1) }).strict(),
    z.object({ NOT: RuleNodeSchema }).strict(),
  ])
);

export const RuleDslV1Schema = RuleNodeSchema;
