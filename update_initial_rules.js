const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'lib', 'security', 'rules', 'rule-initialization.service.ts');
let content = fs.readFileSync(file, 'utf8');

const newRules = 
  {
    rule_id: "API-RATE-ABUSE-01",
    version: 1,
    name: "API Rate Abuse",
    description: "Detects repeated material rate-limit violations correlated by source, policy, and route.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 80,
    threshold_count: 5,
    window_seconds: 900,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.CORRELATION_KEY,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "API_RATE_LIMIT_EXCEEDED" }
      ]
    }
  },
  {
    rule_id: "API-AUTHORIZATION-PROBE-01",
    version: 1,
    name: "API Authorization Probing",
    description: "Detects repeated protected API denials.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "IDENTITY_AND_ACCESS",
    result_classification: "POLICY_VIOLATION",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 85,
    threshold_count: 10,
    window_seconds: 300,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.CORRELATION_KEY,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "API_AUTHORIZATION_DENIED" }
      ]
    }
  },
  {
    rule_id: "API-RESOURCE-ENUMERATION-01",
    version: 1,
    name: "API Resource Enumeration",
    description: "UNVERIFIED rule for API resource enumeration.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 50,
    threshold_count: 20,
    window_seconds: 60,
    cooldown_seconds: 900,
    max_evidence_events: 20,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "API_RESOURCE_ENUMERATION_SIGNAL" }
      ]
    }
  },
  {
    rule_id: "WEB-CSRF-FAILURE-01",
    version: 1,
    name: "Web CSRF Failure",
    description: "UNVERIFIED rule for CSRF failures.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.HIGH,
    base_confidence_score: 90,
    threshold_count: 5,
    window_seconds: 300,
    cooldown_seconds: 900,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "WEB_CSRF_VALIDATION_FAILED" }
      ]
    }
  },
  {
    rule_id: "BOT-SCRAPING-01",
    version: 1,
    name: "Bot Scraping",
    description: "UNVERIFIED rule for bot scraping.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 50,
    threshold_count: 50,
    window_seconds: 300,
    cooldown_seconds: 3600,
    max_evidence_events: 20,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "BOT_SCRAPING_SIGNAL" }
      ]
    }
  },
  {
    rule_id: "BOT-BOOKING-ABUSE-01",
    version: 1,
    name: "Bot Booking Abuse",
    description: "UNVERIFIED and DEFERRED rule for bot booking abuse.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.HIGH,
    base_confidence_score: 95,
    threshold_count: 5,
    window_seconds: 60,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "BOT_BOOKING_AUTOMATION_SIGNAL" }
      ]
    }
  }
;

content = content.replace('];\n\nexport type InitializationResult', ',\n' + newRules + '];\n\nexport type InitializationResult');
fs.writeFileSync(file, content);
