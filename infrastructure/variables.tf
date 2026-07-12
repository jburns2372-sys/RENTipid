variable "resource_group_name" {
  type    = string
  default = "rg-rentipid-prod"
}

variable "location" {
  type    = string
  default = "southeastasia"
}

variable "acr_name" {
  type    = string
  default = "rentipidacr"
}

variable "db_server_name" {
  type    = string
  default = "rentipid-postgres-db"
}

variable "db_admin_user" {
  type    = string
  default = "rentipid_admin"
}

variable "db_admin_password" {
  type      = string
  sensitive = true
}

variable "key_vault_name" {
  type    = string
  default = "kv-rentipid-prod"
}

variable "tenant_id" {
  type = string
}
