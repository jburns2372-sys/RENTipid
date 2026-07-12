const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// Create directories
fs.mkdirSync(path.join(appsApiDir, 'src', 'utils'), { recursive: true });

// 1. secrets.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'utils', 'secrets.ts'), [
  "import { SecretClient } from '@azure/keyvault-secrets';",
  "import { DefaultAzureCredential } from '@azure/identity';",
  "",
  "const keyVaultName = process.env.KEY_VAULT_NAME;",
  "const kvUri = keyVaultName ? `https://${keyVaultName}.vault.azure.net` : '';",
  "",
  "let secretClient: SecretClient | null = null;",
  "",
  "if (kvUri) {",
  "  try {",
  "    // DefaultAzureCredential automatically handles Managed Identity in Azure Container Apps",
  "    const credential = new DefaultAzureCredential();",
  "    secretClient = new SecretClient(kvUri, credential);",
  "    console.log('Azure Key Vault SecretClient initialized.');",
  "  } catch (err) {",
  "    console.error('Failed to initialize Azure Key Vault SecretClient:', err);",
  "  }",
  "}",
  "",
  "/**",
  " * Retrieves a secret securely at runtime.",
  " * If the application is running locally (no KEY_VAULT_NAME), it falls back to process.env.",
  " */",
  "export const getSecret = async (secretName: string): Promise<string> => {",
  "  // 1. Fallback for Local Development",
  "  if (!secretClient) {",
  "    const localSecret = process.env[secretName];",
  "    if (!localSecret) {",
  "      throw new Error(`Secret ${secretName} not found in local environment variables.`);",
  "    }",
  "    return localSecret;",
  "  }",
  "",
  "  // 2. Production: Fetch strictly from Key Vault",
  "  try {",
  "    // Key Vault names use hyphens, environment variables often use underscores",
  "    const kvSecretName = secretName.replace(/_/g, '-');",
  "    const secret = await secretClient.getSecret(kvSecretName);",
  "    ",
  "    if (!secret.value) {",
  "      throw new Error(`Secret ${kvSecretName} is empty in Key Vault.`);",
  "    }",
  "    return secret.value;",
  "  } catch (error) {",
  "    console.error(`Failed to fetch secret ${secretName} from Key Vault.`, error);",
  "    throw error;",
  "  }",
  "};",
  "",
  "/**",
  " * Helper to fetch all critical application secrets during app startup.",
  " */",
  "export const loadCriticalSecrets = async () => {",
  "  // Example of pre-loading critical secrets during container boot",
  "  const dbUrl = await getSecret('DATABASE_URL');",
  "  const nextAuthSecret = await getSecret('NEXTAUTH_SECRET');",
  "  const paymongoSecret = await getSecret('PAYMONGO_WEBHOOK_SECRET');",
  "",
  "  return { dbUrl, nextAuthSecret, paymongoSecret };",
  "};"
].join('\\n'));

// 2. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['@azure/identity'] = '^4.4.1';
  pkg.dependencies['@azure/keyvault-secrets'] = '^4.8.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log("Phase 11 Secrets Management scaffolded.");
