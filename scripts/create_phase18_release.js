const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const githubWorkflowsDir = path.join(rootDir, '.github', 'workflows');
const docsDir = path.join(rootDir, 'docs', 'azure-migration');

// Create directories
fs.mkdirSync(githubWorkflowsDir, { recursive: true });

// 1. azure-deploy.yml
fs.writeFileSync(path.join(githubWorkflowsDir, 'azure-deploy.yml'), [
  "name: Deploy API to Azure Container Apps",
  "",
  "on:",
  "  push:",
  "    branches:",
  "      - main",
  "    paths:",
  "      - 'apps/api/**'",
  "      - '.github/workflows/azure-deploy.yml'",
  "",
  "env:",
  "  ACR_NAME: 'rentipidacr'",
  "  IMAGE_NAME: 'rentipid-api'",
  "  CONTAINER_APP_NAME: 'rentipid-api-app'",
  "  RESOURCE_GROUP: 'rg-rentipid-prod'",
  "",
  "jobs:",
  "  build-and-deploy:",
  "    runs-on: ubuntu-latest",
  "    permissions:",
  "      id-token: write # Required for Azure OIDC login",
  "      contents: read",
  "",
  "    steps:",
  "      - name: Checkout Repository",
  "        uses: actions/checkout@v3",
  "",
  "      - name: Azure Login",
  "        uses: azure/login@v1",
  "        with:",
  "          client-id: ${{ secrets.AZURE_CLIENT_ID }}",
  "          tenant-id: ${{ secrets.AZURE_TENANT_ID }}",
  "          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}",
  "",
  "      - name: Login to Azure Container Registry",
  "        run: |",
  "          az acr login --name ${{ env.ACR_NAME }}",
  "",
  "      - name: Build and Push Docker Image",
  "        run: |",
  "          cd apps/api",
  "          docker build -t ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }} .",
  "          docker push ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}",
  "",
  "      - name: Deploy to Azure Container Apps",
  "        uses: azure/container-apps-deploy-action@v1",
  "        with:",
  "          imageToDeploy: ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}",
  "          containerAppName: ${{ env.CONTAINER_APP_NAME }}",
  "          resourceGroup: ${{ env.RESOURCE_GROUP }}",
  "          registryUrl: ${{ env.ACR_NAME }}.azurecr.io"
].join('\\n'));

// 2. 18-production-release-runbook.md
fs.writeFileSync(path.join(docsDir, '18-production-release-runbook.md'), [
  "# Production Release & Rollback Runbook",
  "",
  "## Objective",
  "Defines the exact steps required to deploy the Azure Backend and how to roll it back safely in case of catastrophic failure.",
  "",
  "## Deployment (CI/CD)",
  "1. Merging to the `main` branch automatically triggers `.github/workflows/azure-deploy.yml`.",
  "2. The workflow builds the Docker image from `/apps/api` and pushes it to Azure Container Registry (ACR).",
  "3. Azure Container Apps automatically pulls the new image and spins up a new revision.",
  "",
  "## Emergency Rollback Strategy",
  "If the newly deployed revision contains a critical bug (e.g., PayMongo webhooks begin failing):",
  "",
  "### Option 1: Azure Portal (Fastest)",
  "1. Log into the Azure Portal.",
  "2. Navigate to the `rentipid-api-app` Container App.",
  "3. Click **Revisions** in the left menu.",
  "4. Locate the previous (stable) revision, which will be marked `Inactive` or `0% traffic`.",
  "5. Change the traffic weighting of the stable revision back to `100%`.",
  "6. Change the traffic weighting of the broken revision to `0%`.",
  "",
  "### Option 2: Azure CLI",
  "```bash",
  "# List available revisions",
  "az containerapp revision list -n rentipid-api-app -g rg-rentipid-prod -o table",
  "",
  "# Direct 100% of traffic back to the old known-good revision",
  "az containerapp ingress traffic set -n rentipid-api-app -g rg-rentipid-prod --revision-weight <OLD_REVISION_NAME>=100",
  "```",
  "",
  "## Database Rollback Warning",
  "If the broken deployment included a destructive Prisma Migration (`prisma migrate deploy`), rolling back the Container App revision **WILL NOT** roll back the database schema.",
  "To roll back a database schema:",
  "1. Connect to the Azure PostgreSQL instance.",
  "2. Restore from the automated Azure Point-in-Time Restore (PITR) backup taken right before the deployment."
].join('\\n'));

console.log("Phase 18 Production Release Process scaffolded.");
