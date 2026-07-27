terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_resource_group" "rg" {
  name = var.existing_resource_group_name
}

data "azurerm_log_analytics_workspace" "existing" {
  name                = var.existing_log_analytics_workspace_name
  resource_group_name = var.existing_resource_group_name
}

module "database" {
  source                          = "../../modules/database"
  environment                     = var.environment
  location                        = data.azurerm_resource_group.rg.location
  resource_group_name             = data.azurerm_resource_group.rg.name
  db_admin                        = var.db_admin
  db_password                     = var.db_password
  sku_name                        = var.environment == "prod" ? "GP_Standard_D2s_v3" : "B_Standard_B1ms"
  storage_mb                      = 32768
  existing_postgresql_server_name = var.existing_postgresql_server_name
}

module "storage" {
  source              = "../../modules/storage"
  environment         = var.environment
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
}

module "compute" {
  source                                  = "../../modules/compute"
  environment                             = var.environment
  location                                = data.azurerm_resource_group.rg.location
  resource_group_name                     = data.azurerm_resource_group.rg.name
  log_analytics_workspace_id              = data.azurerm_log_analytics_workspace.existing.id
  existing_container_registry_name        = var.existing_container_registry_name
  existing_container_app_environment_name = var.existing_container_app_environment_name
}
