const fs = require('fs');
const path = require('path');

const infraDir = path.join(__dirname, '..', 'infrastructure');
const modulesDir = path.join(infraDir, 'modules');
const envsDir = path.join(infraDir, 'environments');

// Create directories
['database', 'storage', 'messaging', 'compute', 'security', 'observability'].forEach(mod => {
  fs.mkdirSync(path.join(modulesDir, mod), { recursive: true });
});

['dev', 'staging', 'prod'].forEach(env => {
  fs.mkdirSync(path.join(envsDir, env), { recursive: true });
});

// Common Tags
const commonTags = [
  '  tags = {',
  '    Application        = "Rentipid"',
  '    Environment        = var.environment',
  '    Owner              = "PlatformTeam"',
  '    CostCenter         = "IT"',
  '    DataClassification = "Confidential"',
  '    Criticality        = "High"',
  '    ManagedBy          = "Terraform"',
  '  }'
].join('\\n');

// 1. Module: Database
fs.writeFileSync(path.join(modulesDir, 'database', 'main.tf'), [
  'resource "azurerm_postgresql_flexible_server" "db" {',
  '  name                   = "psql-rentipid-${var.environment}"',
  '  resource_group_name    = var.resource_group_name',
  '  location               = var.location',
  '  version                = "16"',
  '  administrator_login    = var.db_admin',
  '  administrator_password = var.db_password',
  '  storage_mb             = var.storage_mb',
  '  sku_name               = var.sku_name',
  '',
  commonTags,
  '}'
].join('\\n'));

// 2. Module: Compute
fs.writeFileSync(path.join(modulesDir, 'compute', 'main.tf'), [
  'resource "azurerm_container_registry" "acr" {',
  '  name                = "acrrentipid${var.environment}"',
  '  resource_group_name = var.resource_group_name',
  '  location            = var.location',
  '  sku                 = "Standard"',
  '  admin_enabled       = true',
  commonTags,
  '}',
  '',
  'resource "azurerm_container_app_environment" "env" {',
  '  name                       = "cae-rentipid-${var.environment}"',
  '  location                   = var.location',
  '  resource_group_name        = var.resource_group_name',
  '  log_analytics_workspace_id = var.log_analytics_workspace_id',
  commonTags,
  '}',
  '',
  'resource "azurerm_container_app" "api" {',
  '  name                         = "ca-api-rentipid-${var.environment}"',
  '  container_app_environment_id = azurerm_container_app_environment.env.id',
  '  resource_group_name          = var.resource_group_name',
  '  revision_mode                = "Single"',
  '  template {',
  '    container {',
  '      name   = "api"',
  '      image  = "${azurerm_container_registry.acr.login_server}/rentipid-api:latest"',
  '      cpu    = 0.5',
  '      memory = "1Gi"',
  '    }',
  '  }',
  '  ingress {',
  '    external_enabled = true',
  '    target_port      = 3000',
  '  }',
  commonTags,
  '}'
].join('\\n'));

// 3. Module: Storage
fs.writeFileSync(path.join(modulesDir, 'storage', 'main.tf'), [
  'resource "azurerm_storage_account" "sa" {',
  '  name                     = "sarentipid${var.environment}"',
  '  resource_group_name      = var.resource_group_name',
  '  location                 = var.location',
  '  account_tier             = "Standard"',
  '  account_replication_type = var.environment == "prod" ? "GRS" : "LRS"',
  commonTags,
  '}',
  '',
  'resource "azurerm_storage_container" "kyc" {',
  '  name                  = "kyc-documents"',
  '  storage_account_name  = azurerm_storage_account.sa.name',
  '  container_access_type = "private"',
  '}',
  '',
  'resource "azurerm_storage_container" "listings" {',
  '  name                  = "listing-media"',
  '  storage_account_name  = azurerm_storage_account.sa.name',
  '  container_access_type = "private"',
  '}'
].join('\\n'));

// 4. Create Environments
['dev', 'staging', 'prod'].forEach(env => {
  fs.writeFileSync(path.join(envsDir, env, 'main.tf'), [
    'terraform {',
    '  required_providers {',
    '    azurerm = {',
    '      source  = "hashicorp/azurerm"',
    '      version = "~> 3.0"',
    '    }',
    '  }',
    '}',
    '',
    'provider "azurerm" {',
    '  features {}',
    '}',
    '',
    'resource "azurerm_resource_group" "rg" {',
    '  name     = "rg-rentipid-${var.environment}"',
    '  location = var.location',
    '}',
    '',
    'module "database" {',
    '  source              = "../../modules/database"',
    '  environment         = var.environment',
    '  location            = azurerm_resource_group.rg.location',
    '  resource_group_name = azurerm_resource_group.rg.name',
    '  db_admin            = var.db_admin',
    '  db_password         = var.db_password',
    '  sku_name            = var.environment == "prod" ? "GP_Standard_D2s_v3" : "B_Standard_B1ms"',
    '  storage_mb          = 32768',
    '}',
    '',
    'module "storage" {',
    '  source              = "../../modules/storage"',
    '  environment         = var.environment',
    '  location            = azurerm_resource_group.rg.location',
    '  resource_group_name = azurerm_resource_group.rg.name',
    '}',
    '',
    'module "compute" {',
    '  source                       = "../../modules/compute"',
    '  environment                  = var.environment',
    '  location                     = azurerm_resource_group.rg.location',
    '  resource_group_name          = azurerm_resource_group.rg.name',
    '  log_analytics_workspace_id   = "log-dummy-id"',
    '}'
  ].join('\\n'));

  fs.writeFileSync(path.join(envsDir, env, 'variables.tf'), [
    'variable "environment" {',
    '  default = "' + env + '"',
    '}',
    '',
    'variable "location" {',
    '  default = "Southeast Asia"',
    '}',
    '',
    'variable "db_admin" {',
    '  type = string',
    '}',
    '',
    'variable "db_password" {',
    '  type      = string',
    '  sensitive = true',
    '}'
  ].join('\\n'));
});

console.log("Phase 3 Terraform infrastructure scaffolded.");
