output "virtual_network_id" {
  value = azurerm_virtual_network.parallel.id
}
output "container_apps_infrastructure_subnet_id" {
  value = azurerm_subnet.container_apps_infrastructure.id
}
output "private_endpoint_subnet_id" {
  value = azurerm_subnet.private_endpoints.id
}
output "blob_private_dns_zone_id" {
  value = azurerm_private_dns_zone.blob.id
}
