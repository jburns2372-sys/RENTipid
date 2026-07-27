resource "azurerm_storage_account" "sa" {
  name                     = "sarentipid${var.environment}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "prod" ? "GRS" : "LRS"

  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  public_network_access_enabled   = false
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false

  blob_properties {
    versioning_enabled = true
    delete_retention_policy {
      days = 7
    }
    container_delete_retention_policy {
      days = 7
    }
  }

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

resource "azurerm_storage_container" "kyc" {
  name                  = "kyc-documents"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "listings" {
  name                  = "listing-media"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}
