output "environment_id" {
  value = azurerm_container_app_environment.parallel.id
}
output "api_principal_id" {
  value = azurerm_container_app.api_parallel.identity[0].principal_id
}
output "worker_principal_id" {
  value = azurerm_container_app_job.worker_parallel.identity[0].principal_id
}
output "api_fqdn" {
  value = azurerm_container_app.api_parallel.latest_revision_fqdn
}
