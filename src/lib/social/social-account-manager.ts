import { PrismaClient } from '@prisma/client';
import { SocialPlatform, SocialProviderRegistry, ProviderConnectionStatus, ProviderHealthStatus, ProviderCapability } from './social-platform-registry';
import { hasSocialPermission } from './social-permissions';

const prisma = new PrismaClient();

export class SocialAccountManager {
  static async listRegisteredProviders() {
    const adapters = SocialProviderRegistry.getAll();
    return adapters.map(a => ({
      platformId: a.platformId,
      capabilities: a.getCapabilities()
    }));
  }

  static async registerAccount(
    actorRole: string,
    payload: {
      platform: SocialPlatform;
      accountName: string;
      accountHandle: string;
      accountType: string;
    }
  ) {
    if (!hasSocialPermission(actorRole as any, 'social.accounts.manage')) {
      throw new Error('ACCESS_DENIED: Requires social.accounts.manage');
    }

    const adapter = SocialProviderRegistry.get(payload.platform);
    if (!adapter) throw new Error('PROVIDER_UNAVAILABLE');

    return await prisma.socialAccount.create({
      data: {
        platform: payload.platform,
        account_name: payload.accountName,
        account_handle: payload.accountHandle,
        account_type: payload.accountType,
        connection_status: 'NOT_CONFIGURED',
        health_status: 'UNKNOWN'
      }
    });
  }

  static async configureAccount(
    actorRole: string,
    accountId: string,
    credentialReference: string,
    scopes: string[]
  ) {
    if (!hasSocialPermission(actorRole as any, 'social.accounts.manage')) {
      throw new Error('ACCESS_DENIED: Requires social.accounts.manage');
    }

    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');

    const adapter = SocialProviderRegistry.get(account.platform as SocialPlatform);
    if (!adapter) throw new Error('PROVIDER_UNAVAILABLE');

    // Never store raw secrets in this model; credentialReference acts as a secure key pointer
    const updatedAccount = await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        connection_status: 'CONFIGURED',
        credential_reference: credentialReference,
        scopes: scopes.join(','),
        capabilities: JSON.stringify(adapter.getCapabilities())
      }
    });

    // In a real flow, we would trigger an AuditLog creation here.
    return updatedAccount;
  }

  static async validateAccountHealth(
    actorRole: string,
    accountId: string
  ) {
    if (!hasSocialPermission(actorRole as any, 'social.accounts.manage') && !hasSocialPermission(actorRole as any, 'social.view')) {
      throw new Error('ACCESS_DENIED: Requires social.view or social.accounts.manage');
    }

    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');

    if (account.connection_status === 'DISABLED') {
      throw new Error('ACCOUNT_DISABLED');
    }

    const adapter = SocialProviderRegistry.get(account.platform as SocialPlatform);
    const healthResult = await adapter.checkHealth(accountId);
    const isValid = await adapter.validateConnection(accountId);

    if (!isValid) {
      healthResult.status = 'AUTH_REQUIRED';
    }

    return await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        health_status: healthResult.status,
        last_validation_error: healthResult.message || null,
        last_sync_at: new Date()
      }
    });
  }

  static async setAccountEnabled(
    actorRole: string,
    accountId: string,
    enabled: boolean
  ) {
    if (!hasSocialPermission(actorRole as any, 'social.accounts.manage')) {
      throw new Error('ACCESS_DENIED: Requires social.accounts.manage');
    }

    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');

    const newStatus = enabled ? 'CONFIGURED' : 'DISABLED';

    return await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        connection_status: newStatus,
        health_status: enabled ? 'UNKNOWN' : 'DISABLED'
      }
    });
  }

  static async refreshAccountCredentials(
    actorRole: string,
    accountId: string
  ) {
    if (!hasSocialPermission(actorRole as any, 'social.accounts.manage')) {
      throw new Error('ACCESS_DENIED: Requires social.accounts.manage');
    }

    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');

    if (account.connection_status === 'DISABLED') {
      throw new Error('ACCOUNT_DISABLED');
    }

    const adapter = SocialProviderRegistry.get(account.platform as SocialPlatform);
    const refreshResult = await adapter.refreshCredentials(accountId);

    if (refreshResult.success) {
      return await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          health_status: 'HEALTHY',
          token_expires_at: refreshResult.newExpiry,
          last_sync_at: new Date()
        }
      });
    } else {
      return await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          health_status: 'AUTH_REQUIRED',
          last_validation_error: refreshResult.error || 'Refresh failed',
          last_sync_at: new Date()
        }
      });
    }
  }
}
