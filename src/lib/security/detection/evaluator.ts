import { DetectionRule, DetectionRegistry, ResponseClass, EventSourceType } from './registry';

interface SecurityEventPayload {
  sourceType: string;
  eventType: string;
  actorId?: string;
  resourceId?: string;
  ipAddress?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

interface DetectionState {
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  lastAlertedAt: number;
}

// In-memory store for synthetic test purposes, since we can't spin up Redis in this bounded phase
// In a real implementation this would be backed by Redis or DB.
const stateStore = new Map<string, DetectionState>();

export class DetectionEvaluator {
  private rules: DetectionRule[];

  constructor(customRules?: DetectionRule[]) {
    this.rules = customRules || DetectionRegistry;
  }

  public evaluateEvent(event: SecurityEventPayload): { triggered: boolean, rule?: DetectionRule, action?: ResponseClass } {
    const applicableRules = this.rules.filter(r => r.ENABLED && r.SOURCE_TYPES.includes(event.sourceType as EventSourceType));

    for (const rule of applicableRules) {
      if (this.matchesRule(rule, event)) {
        const dedupKey = this.generateDedupKey(rule, event);
        const state = this.updateState(dedupKey, event.timestamp, rule.TIME_WINDOW);

        if (state.count >= rule.THRESHOLD) {
          if (event.timestamp - state.lastAlertedAt > rule.COOLDOWN) {
            state.lastAlertedAt = event.timestamp;
            stateStore.set(dedupKey, state);
            return {
              triggered: true,
              rule,
              action: rule.RESPONSE_CLASS
            };
          }
        }
      }
    }

    return { triggered: false };
  }

  private matchesRule(rule: DetectionRule, event: SecurityEventPayload): boolean {
    if (rule.EVENT_TYPE === event.eventType) {
      return true;
    }
    // Handle synthetic mapping for specific AI tools if needed
    if (rule.RULE_ID === 'AI_HIGH_RISK_ACTION_ATTEMPT' && event.eventType === 'AI_TOOL_CALL') {
       if (event.payload?.tool === 'refund' || event.payload?.tool === 'escrow_release') {
         return true;
       }
    }
    return false;
  }

  private generateDedupKey(rule: DetectionRule, event: SecurityEventPayload): string {
    const parts = [rule.RULE_ID];
    if (event.actorId) parts.push(event.actorId);
    if (event.ipAddress) parts.push(event.ipAddress);
    return parts.join(':');
  }

  private updateState(key: string, timestamp: number, timeWindow: number): DetectionState {
    const existing = stateStore.get(key);
    if (!existing) {
      const newState = { count: 1, firstOccurrence: timestamp, lastOccurrence: timestamp, lastAlertedAt: 0 };
      stateStore.set(key, newState);
      return newState;
    }

    if (timestamp - existing.firstOccurrence > timeWindow) {
      // Reset window
      existing.count = 1;
      existing.firstOccurrence = timestamp;
      existing.lastOccurrence = timestamp;
    } else {
      existing.count++;
      existing.lastOccurrence = timestamp;
    }

    stateStore.set(key, existing);
    return existing;
  }

  public resetState() {
    stateStore.clear();
  }
}
