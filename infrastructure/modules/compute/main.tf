data "azurerm_container_registry" "existing" {
  count               = var.existing_container_registry_name != "" ? 1 : 0
  name                = var.existing_container_registry_name
  resource_group_name = var.resource_group_name
}

resource "azurerm_container_registry" "acr" {
  count                         = var.existing_container_registry_name == "" ? 1 : 0
  name                          = "acrrentipid${var.environment}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku                           = "Standard"
  admin_enabled                 = false
  public_network_access_enabled = false
  tags = {
    Application        = "Rentipid"
    Environment        = var.environment
    Owner              = "PlatformTeam"
    CostCenter         = "IT"
    DataClassification = "Confidential"
    Criticality        = "High"
    ManagedBy          = "Terraform"
  }
}

data "azurerm_container_app_environment" "existing" {
  count               = var.existing_container_app_environment_name != "" ? 1 : 0
  name                = var.existing_container_app_environment_name
  resource_group_name = var.resource_group_name
}

resource "azurerm_container_app_environment" "env" {
  count                      = var.existing_container_app_environment_name == "" ? 1 : 0
  name                       = "cae-rentipid-${var.environment}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  tags = {
    Application        = "Rentipid"
    Environment        = var.environment
    Owner              = "PlatformTeam"
    CostCenter         = "IT"
    DataClassification = "Confidential"
    Criticality        = "High"
    ManagedBy          = "Terraform"
  }
}

resource "azurerm_container_app" "api" {
  name                         = "ca-api-rentipid-${var.environment}"
  container_app_environment_id = var.existing_container_app_environment_name != "" ? data.azurerm_container_app_environment.existing[0].id : azurerm_container_app_environment.env[0].id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  template {
    container {
      name   = "api"
      image  = "${var.existing_container_registry_name != "" ? data.azurerm_container_registry.existing[0].login_server : azurerm_container_registry.acr[0].login_server}/rentipid-api:latest"
      cpu    = 0.5
      memory = "1Gi"
    }
  }

  ingress {
    external_enabled           = true
    target_port                = 3000
    allow_insecure_connections = false
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = {
    Application        = "Rentipid"
    Environment        = var.environment
    Owner              = "PlatformTeam"
    CostCenter         = "IT"
    DataClassification = "Confidential"
    Criticality        = "High"
    ManagedBy          = "Terraform"
  }
}

resource "azurerm_role_assignment" "acr_pull" {
  principal_id                     = azurerm_container_app.api.identity[0].principal_id
  role_definition_name             = "AcrPull"
  scope                            = var.existing_container_registry_name != "" ? data.azurerm_container_registry.existing[0].id : azurerm_container_registry.acr[0].id
  skip_service_principal_aad_check = true
}
