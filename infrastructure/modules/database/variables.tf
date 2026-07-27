variable "environment" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "db_admin" { type = string }
variable "db_password" { type = string }
variable "sku_name" { type = string }
variable "storage_mb" { type = number }

variable "existing_postgresql_server_name" {
  type    = string
  default = ""
}

