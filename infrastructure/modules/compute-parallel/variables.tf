variable "environment" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "log_analytics_workspace_id" { type = string }
variable "existing_container_registry_name" { type = string }
variable "infrastructure_subnet_id" { type = string }
variable "parallel_container_apps_environment_name_prefix" { type = string }
variable "tags" { type = map(string) }

variable "application_insights_connection_string" {
  type      = string
  sensitive = true
}
