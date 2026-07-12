output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "db_fqdn" {
  value = azurerm_postgresql_flexible_server.db.fqdn
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}
