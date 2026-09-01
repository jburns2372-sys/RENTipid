import {
  redactListingBridgeSecurityValue,
  redactListingBridgeSecurityDetails,
} from '../security/errors';
import type { ListingBridgeOperationalEvent } from './events';

export interface StructuredLogEntry {
  readonly timestamp: string;
  readonly level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  readonly message: string;
  readonly module: 'ListingBridge';
  readonly eventType?: string;
  readonly importJobId?: string;
  readonly connectorId?: string;
  readonly actorUserId?: string;
  readonly correlationId?: string;
  readonly stage?: string;
  readonly durationMs?: number;
  readonly failureCategory?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export class ListingBridgeStructuredLogger {
  private static instance = new ListingBridgeStructuredLogger();

  static getInstance(): ListingBridgeStructuredLogger {
    return this.instance;
  }

  logEvent(event: ListingBridgeOperationalEvent): void {
    const level =
      event.resultClass === 'FAILURE'
        ? 'ERROR'
        : event.resultClass === 'WARNING' || event.resultClass === 'BLOCKED'
          ? 'WARN'
          : 'INFO';

    const entry: StructuredLogEntry = {
      timestamp: event.timestamp || new Date().toISOString(),
      level,
      message: `[ListingBridge] ${event.eventType} - ${event.resultClass}`,
      module: 'ListingBridge',
      eventType: event.eventType,
      importJobId: event.importJobId,
      connectorId: event.connectorId,
      actorUserId: event.actorUserId,
      correlationId: event.correlationId,
      stage: event.stage,
      durationMs: event.durationMs,
      failureCategory: event.failureCategory,
      details: event.safeMetadata ? redactListingBridgeSecurityDetails(event.safeMetadata) : undefined,
    };

    this.emitLog(entry);
  }

  info(message: string, context?: Readonly<Record<string, unknown>>): void {
    this.emitLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: redactListingBridgeSecurityValue(message),
      module: 'ListingBridge',
      details: context ? redactListingBridgeSecurityDetails(context) : undefined,
    });
  }

  warn(message: string, context?: Readonly<Record<string, unknown>>): void {
    this.emitLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: redactListingBridgeSecurityValue(message),
      module: 'ListingBridge',
      details: context ? redactListingBridgeSecurityDetails(context) : undefined,
    });
  }

  error(message: string, error?: unknown, context?: Readonly<Record<string, unknown>>): void {
    const errorDetails: Record<string, unknown> = {
      ...(context ?? {}),
      errorMessage: error instanceof Error ? redactListingBridgeSecurityValue(error.message) : String(error),
      errorCode: (error as { code?: string })?.code,
    };

    this.emitLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: redactListingBridgeSecurityValue(message),
      module: 'ListingBridge',
      details: redactListingBridgeSecurityDetails(errorDetails),
    });
  }

  private emitLog(entry: StructuredLogEntry): void {
    if (process.env.NODE_ENV === 'test') {
      return; // Suppress verbose logging in tests
    }
    const serialized = JSON.stringify(entry);
    if (entry.level === 'ERROR') {
      console.error(serialized);
    } else if (entry.level === 'WARN') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }
}
