variable "environment" { default = "prod" }
variable "location" { default = "Southeast Asia" }
variable "db_admin" { type = string }
variable "db_password" {
  type      = string
  sensitive = true
}
variable "existing_resource_group_name" { default = "rg-rentipid-prod" }
variable "existing_postgresql_server_name" { default = "rentipid-postgres-db" }
variable "existing_log_analytics_workspace_name" { default = "rg-rentipid-prod-log" }
variable "existing_container_registry_name" { default = "rentipidacr" }
variable "existing_container_app_environment_name" { default = "rg-rentipid-prod-env" }
