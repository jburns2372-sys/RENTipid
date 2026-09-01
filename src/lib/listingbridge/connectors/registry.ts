import type { ListingBridgeConnector } from './types';
import {
  listingBridgeConnectorCapabilityIds,
  listingBridgeDeploymentEnvironments,
  listingBridgeHealthSnapshotSchema,
  parseListingBridgeConnectorDescriptor,
  toPublicConnectorDescriptor,
  type ListingBridgeConnectorCapabilityId,
  type ListingBridgeConnectorDescriptor,
  type ListingBridgeDeploymentEnvironment,
  type ListingBridgeHealthSnapshot,
  type ListingBridgePublicConnectorDescriptor,
} from './descriptor';
import {
  ListingBridgeFeatureFlagEvaluator,
  type ListingBridgeFeatureEvaluation,
} from './feature-flags';

export interface ListingBridgeConnectorRegistration {
  readonly connector: ListingBridgeConnector;
  readonly descriptor: ListingBridgeConnectorDescriptor;
}

export interface ListingBridgeAvailabilityContext {
  readonly environment: ListingBridgeDeploymentEnvironment;
  readonly requiredCapabilities?: readonly ListingBridgeConnectorCapabilityId[];
}

export interface ListingBridgeConnectorAvailability {
  readonly connectorId: string;
  readonly available: boolean;
  readonly environment: ListingBridgeDeploymentEnvironment;
  readonly featureEvaluation: ListingBridgeFeatureEvaluation;
  readonly blockedReasons: readonly string[];
}

export interface ListingBridgeConnectorRegistryOptions {
  readonly featureEvaluator?: ListingBridgeFeatureFlagEvaluator;
}

function hasCapability(
  descriptor: ListingBridgeConnectorDescriptor,
  capability: ListingBridgeConnectorCapabilityId,
): boolean {
  return descriptor.capabilities.includes(capability);
}

function assertSupportedCapability(capability: ListingBridgeConnectorCapabilityId): void {
  if (!(listingBridgeConnectorCapabilityIds as readonly string[]).includes(capability)) {
    throw new Error(`Unsupported ListingBridge connector capability '${capability}'`);
  }
}

function assertSupportedEnvironment(environment: ListingBridgeDeploymentEnvironment): void {
  if (!(listingBridgeDeploymentEnvironments as readonly string[]).includes(environment)) {
    throw new Error(`Unsupported ListingBridge environment '${environment}'`);
  }
}

function assertConnectorCompatibility(registration: ListingBridgeConnectorRegistration): void {
  const { connector, descriptor } = registration;

  if (connector.config.id !== descriptor.id) {
    throw new Error(`Connector config id '${connector.config.id}' does not match descriptor id '${descriptor.id}'`);
  }

  if (connector.config.tier !== descriptor.tier) {
    throw new Error(`Connector '${descriptor.id}' tier does not match descriptor tier`);
  }

  const contractCapabilities = connector.getCapabilities();
  const expectedCapabilities: Array<[ListingBridgeConnectorCapabilityId, boolean]> = [
    ['MEDIA', contractCapabilities.supportsMedia],
    ['AVAILABILITY', contractCapabilities.supportsAvailability],
  ];

  for (const [capability, enabled] of expectedCapabilities) {
    if (enabled !== hasCapability(descriptor, capability)) {
      throw new Error(`Connector '${descriptor.id}' capability mismatch for ${capability}`);
    }
  }

  const descriptorRequiresAuthorization = descriptor.authorization.type !== 'NONE'
    || descriptor.authorization.requiresProviderRightsConfirmation
    || descriptor.authorization.credentialReferenceRequired;
  if (contractCapabilities.requiresAuthorization !== descriptorRequiresAuthorization) {
    throw new Error(`Connector '${descriptor.id}' authorization requirement does not match descriptor`);
  }
}

function evaluateStaticAvailability(
  descriptor: ListingBridgeConnectorDescriptor,
  environment: ListingBridgeDeploymentEnvironment,
): readonly string[] {
  const blockedReasons: string[] = [];
  const environmentState = descriptor.environments[environment].state;

  if (!descriptor.enabled) blockedReasons.push('CONNECTOR_DISABLED');
  if (descriptor.featureStatus === 'DISABLED') blockedReasons.push('FEATURE_DISABLED');
  if (descriptor.featureStatus === 'INTERNAL_ONLY' && environment === 'PRODUCTION') blockedReasons.push('INTERNAL_ONLY');
  if (environmentState !== 'APPROVED') blockedReasons.push(`ENVIRONMENT_${environmentState}`);
  if (descriptor.compliance.status !== 'APPROVED') blockedReasons.push(`COMPLIANCE_${descriptor.compliance.status}`);
  if (['UNKNOWN', 'UNHEALTHY', 'DISABLED'].includes(descriptor.health.state)) {
    blockedReasons.push(`HEALTH_${descriptor.health.state}`);
  }

  return Object.freeze(blockedReasons);
}

export class ListingBridgeConnectorRegistry {
  private readonly registrations: ReadonlyMap<string, ListingBridgeConnectorRegistration>;
  private readonly featureEvaluator: ListingBridgeFeatureFlagEvaluator;

  constructor(
    registrations: readonly ListingBridgeConnectorRegistration[] = [],
    options: ListingBridgeConnectorRegistryOptions = {},
  ) {
    this.featureEvaluator = options.featureEvaluator ?? new ListingBridgeFeatureFlagEvaluator();
    const next = new Map<string, ListingBridgeConnectorRegistration>();

    for (const registration of registrations) {
      const parsed = parseListingBridgeConnectorDescriptor(registration.descriptor);
      if (next.has(parsed.id)) throw new Error(`Duplicate ListingBridge connector id '${parsed.id}'`);
      const normalized = Object.freeze({ connector: registration.connector, descriptor: parsed });
      assertConnectorCompatibility(normalized);
      next.set(parsed.id, normalized);
    }

    this.registrations = next;
  }

  registerConnector(registration: ListingBridgeConnectorRegistration): ListingBridgeConnectorRegistry {
    const parsed = parseListingBridgeConnectorDescriptor(registration.descriptor);
    if (this.registrations.has(parsed.id)) throw new Error(`Duplicate ListingBridge connector id '${parsed.id}'`);

    return new ListingBridgeConnectorRegistry(
      [...this.registrations.values(), { connector: registration.connector, descriptor: parsed }],
      { featureEvaluator: this.featureEvaluator },
    );
  }

  getConnectorById(connectorId: string): ListingBridgeConnector | null {
    return this.registrations.get(connectorId)?.connector ?? null;
  }

  getDescriptorById(connectorId: string): ListingBridgePublicConnectorDescriptor | null {
    const descriptor = this.registrations.get(connectorId)?.descriptor;
    return descriptor ? toPublicConnectorDescriptor(descriptor) : null;
  }

  listRegisteredConnectors(): readonly ListingBridgePublicConnectorDescriptor[] {
    return Object.freeze(
      [...this.registrations.values()]
        .map(registration => toPublicConnectorDescriptor(registration.descriptor))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  filterByCapability(capability: ListingBridgeConnectorCapabilityId): readonly ListingBridgePublicConnectorDescriptor[] {
    assertSupportedCapability(capability);
    return Object.freeze(this.listRegisteredConnectors().filter(descriptor => descriptor.capabilities.includes(capability)));
  }

  filterByEnvironment(environment: ListingBridgeDeploymentEnvironment): readonly ListingBridgePublicConnectorDescriptor[] {
    assertSupportedEnvironment(environment);
    return Object.freeze(
      this.listRegisteredConnectors().filter(descriptor => descriptor.environments[environment].state === 'APPROVED'),
    );
  }

  async evaluateAvailability(
    connectorId: string,
    context: ListingBridgeAvailabilityContext,
  ): Promise<ListingBridgeConnectorAvailability> {
    assertSupportedEnvironment(context.environment);
    const registration = this.registrations.get(connectorId);
    if (!registration) {
      const featureEvaluation = Object.freeze({
        enabled: false,
        requiredFlags: Object.freeze([]),
        flagStates: Object.freeze({}) as Record<string, never>,
        blockedBy: Object.freeze([]),
      }) as unknown as ListingBridgeFeatureEvaluation;

      return Object.freeze({
        connectorId,
        available: false,
        environment: context.environment,
        featureEvaluation,
        blockedReasons: Object.freeze(['CONNECTOR_NOT_REGISTERED']),
      });
    }

    const requiredCapabilities = context.requiredCapabilities ?? registration.descriptor.capabilities;
    const missingCapabilities = requiredCapabilities
      .filter(capability => !registration.descriptor.capabilities.includes(capability))
      .map(capability => `CAPABILITY_UNSUPPORTED_${capability}`);
    const featureEvaluation = await this.featureEvaluator.evaluate(registration.descriptor, requiredCapabilities);
    const blockedReasons = [
      ...evaluateStaticAvailability(registration.descriptor, context.environment),
      ...missingCapabilities,
      ...featureEvaluation.blockedBy.map(flag => `FEATURE_FLAG_${flag}`),
    ];

    return Object.freeze({
      connectorId,
      available: blockedReasons.length === 0,
      environment: context.environment,
      featureEvaluation,
      blockedReasons: Object.freeze(blockedReasons),
    });
  }

  async getAvailableConnector(
    connectorId: string,
    context: ListingBridgeAvailabilityContext,
  ): Promise<ListingBridgeConnector | null> {
    const availability = await this.evaluateAvailability(connectorId, context);
    return availability.available ? this.getConnectorById(connectorId) : null;
  }

  async listEnabledConnectors(
    context: ListingBridgeAvailabilityContext,
  ): Promise<readonly ListingBridgePublicConnectorDescriptor[]> {
    const enabled: ListingBridgePublicConnectorDescriptor[] = [];

    for (const registration of this.registrations.values()) {
      const availability = await this.evaluateAvailability(registration.descriptor.id, context);
      if (availability.available) enabled.push(toPublicConnectorDescriptor(registration.descriptor));
    }

    return Object.freeze(enabled.sort((left, right) => left.id.localeCompare(right.id)));
  }

  updateHealth(connectorId: string, health: ListingBridgeHealthSnapshot): ListingBridgeConnectorRegistry {
    const parsedHealth = listingBridgeHealthSnapshotSchema.parse(health);
    const registration = this.registrations.get(connectorId);
    if (!registration) throw new Error(`ListingBridge connector '${connectorId}' is not registered`);

    return new ListingBridgeConnectorRegistry(
      [...this.registrations.values()].map(existing => existing.descriptor.id === connectorId
        ? { connector: existing.connector, descriptor: { ...existing.descriptor, health: parsedHealth } }
        : existing),
      { featureEvaluator: this.featureEvaluator },
    );
  }
}

export function createListingBridgeConnectorRegistry(
  registrations: readonly ListingBridgeConnectorRegistration[] = [],
  options: ListingBridgeConnectorRegistryOptions = {},
): ListingBridgeConnectorRegistry {
  return new ListingBridgeConnectorRegistry(registrations, options);
}
