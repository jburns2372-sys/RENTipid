"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCriticalSecrets = exports.getSecret = void 0;
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const identity_1 = require("@azure/identity");
const keyVaultName = process.env.KEY_VAULT_NAME;
const kvUri = keyVaultName ? `https://${keyVaultName}.vault.azure.net` : '';
let secretClient = null;
if (kvUri) {
    try {
        // DefaultAzureCredential automatically handles Managed Identity in Azure Container Apps
        const credential = new identity_1.DefaultAzureCredential();
        secretClient = new keyvault_secrets_1.SecretClient(kvUri, credential);
        console.log('Azure Key Vault SecretClient initialized.');
    }
    catch (err) {
        console.error('Failed to initialize Azure Key Vault SecretClient:', err);
    }
}
/**
 * Retrieves a secret securely at runtime.
 * If the application is running locally (no KEY_VAULT_NAME), it falls back to process.env.
 */
const getSecret = async (secretName) => {
    // 1. Fallback for Local Development
    if (!secretClient) {
        const localSecret = process.env[secretName];
        if (!localSecret) {
            throw new Error(`Secret ${secretName} not found in local environment variables.`);
        }
        return localSecret;
    }
    // 2. Production: Fetch strictly from Key Vault
    try {
        // Key Vault names use hyphens, environment variables often use underscores
        const kvSecretName = secretName.replace(/_/g, '-');
        const secret = await secretClient.getSecret(kvSecretName);
        if (!secret.value) {
            throw new Error(`Secret ${kvSecretName} is empty in Key Vault.`);
        }
        return secret.value;
    }
    catch (error) {
        console.error(`Failed to fetch secret ${secretName} from Key Vault.`, error);
        throw error;
    }
};
exports.getSecret = getSecret;
/**
 * Helper to fetch all critical application secrets during app startup.
 */
const loadCriticalSecrets = async () => {
    // Example of pre-loading critical secrets during container boot
    const dbUrl = await (0, exports.getSecret)('DATABASE_URL');
    const nextAuthSecret = await (0, exports.getSecret)('NEXTAUTH_SECRET');
    const paymongoSecret = await (0, exports.getSecret)('PAYMONGO_WEBHOOK_SECRET');
    return { dbUrl, nextAuthSecret, paymongoSecret };
};
exports.loadCriticalSecrets = loadCriticalSecrets;
