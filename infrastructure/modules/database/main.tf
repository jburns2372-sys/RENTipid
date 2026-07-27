data "azurerm_postgresql_flexible_server" "existing" {
  count               = var.existing_postgresql_server_name != "" ? 1 : 0
  name                = var.existing_postgresql_server_name
  resource_group_name = var.resource_group_name
}

resource "azurerm_postgresql_flexible_server" "db" {
  count                  = var.existing_postgresql_server_name == "" ? 1 : 0
  name                   = "psql-rentipid-${var.environment}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "16"
  administrator_login    = var.db_admin
  administrator_password = var.db_password
  storage_mb             = var.storage_mb
  sku_name               = var.sku_name

  backup_retention_days         = 30
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = false

  lifecycle {
    prevent_destroy = true
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

resource "azurerm_postgresql_flexible_server_configuration" "require_secure_transport" {
  name      = "require_secure_transport"
  server_id = var.existing_postgresql_server_name != "" ? data.azurerm_postgresql_flexible_server.existing[0].id : azurerm_postgresql_flexible_server.db[0].id
  value     = "on"
}
