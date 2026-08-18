variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "tags" { type = map(string) }

variable "parallel_vnet_name_prefix" { type = string }
variable "parallel_vnet_address_space_cidr" { type = string }
variable "container_apps_infrastructure_subnet_name" { type = string }
variable "container_apps_infrastructure_subnet_cidr" { type = string }
variable "private_endpoint_subnet_name" { type = string }
variable "private_endpoint_subnet_cidr" { type = string }
