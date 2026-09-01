export interface MappingConflict {
  readonly fieldName: string;
  readonly reasonCode: string;
  readonly description: string;
  readonly conflictingValues: Record<string, unknown>;
}

export interface ConflictDetectionInput {
  readonly maxGuests?: number;
  readonly bedrooms?: number;
  readonly beds?: number;
  readonly quantity?: number;
  readonly minDuration?: number;
  readonly maxDuration?: number;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly condition?: string;
  readonly categorySlug?: string;
}

const VALID_CONDITIONS = new Set(['New', 'Like New', 'Good', 'Fair', 'Used']);

export class MappingConflictDetector {
  detectConflicts(input: ConflictDetectionInput): readonly MappingConflict[] {
    const conflicts: MappingConflict[] = [];

    // Min duration > Max duration
    if (
      input.minDuration !== undefined
      && input.maxDuration !== undefined
      && input.minDuration > input.maxDuration
    ) {
      conflicts.push({
        fieldName: 'rules.duration',
        reasonCode: 'CONFLICT_MIN_GREATER_THAN_MAX_DURATION',
        description: `Minimum duration (${input.minDuration}) cannot exceed maximum duration (${input.maxDuration})`,
        conflictingValues: { minDuration: input.minDuration, maxDuration: input.maxDuration },
      });
    }

    // Coordinates out of bounds
    if (input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) {
      conflicts.push({
        fieldName: 'location.latitude',
        reasonCode: 'CONFLICT_LATITUDE_OUT_OF_RANGE',
        description: `Latitude ${input.latitude} is outside valid range [-90, 90]`,
        conflictingValues: { latitude: input.latitude },
      });
    }

    if (input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) {
      conflicts.push({
        fieldName: 'location.longitude',
        reasonCode: 'CONFLICT_LONGITUDE_OUT_OF_RANGE',
        description: `Longitude ${input.longitude} is outside valid range [-180, 180]`,
        conflictingValues: { longitude: input.longitude },
      });
    }

    // Condition validity check
    if (input.condition !== undefined && !VALID_CONDITIONS.has(input.condition)) {
      conflicts.push({
        fieldName: 'property.condition',
        reasonCode: 'CONFLICT_INVALID_CONDITION_VALUE',
        description: `Condition '${input.condition}' is not a valid RENTipid condition`,
        conflictingValues: { condition: input.condition },
      });
    }

    // Capacity logic check (e.g. quantity < 1, maxGuests < 1)
    if (input.quantity !== undefined && input.quantity < 1) {
      conflicts.push({
        fieldName: 'capacity.quantity',
        reasonCode: 'CONFLICT_INVALID_QUANTITY',
        description: `Quantity (${input.quantity}) must be at least 1`,
        conflictingValues: { quantity: input.quantity },
      });
    }

    if (input.maxGuests !== undefined && input.maxGuests < 1) {
      conflicts.push({
        fieldName: 'capacity.maxGuests',
        reasonCode: 'CONFLICT_INVALID_MAX_GUESTS',
        description: `Max guests (${input.maxGuests}) must be at least 1`,
        conflictingValues: { maxGuests: input.maxGuests },
      });
    }

    return Object.freeze(conflicts);
  }
}
