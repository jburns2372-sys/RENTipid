output "application_insights_connection_string" {
  description = "The connection string for Application Insights."
  value       = azurerm_application_insights.app_insights.connection_string
  sensitive   = true
}

output "application_insights_id" {
  description = "The ID of the Application Insights resource."
  value       = azurerm_application_insights.app_insights.id
}
