variable "environment" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "log_analytics_workspace_id" { type = string }

variable "existing_container_registry_name" {
  type    = string
  default = ""
}
variable "existing_container_app_environment_name" {
  type    = string
  default = ""
}

