variable "resource_group_name" {
  type        = string
  description = "The name of the resource group in which to create the Application Insights resource."
}

variable "location" {
  type        = string
  description = "The location/region where the Application Insights resource should be created."
}

variable "environment" {
  type        = string
  description = "The environment name (e.g. prod, staging)."
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "The ID of the existing Log Analytics Workspace to link with Application Insights."
}

variable "action_group_id" {
  type        = string
  description = "Optional ID of an Azure Monitor Action Group for notifications. Defaults to empty."
  default     = ""
}

variable "tags" {
  type        = map(string)
  description = "A map of tags to assign to the resources."
  default     = {}
}
