resource "azurerm_application_insights" "app_insights" {
  name                = "rentipid-ai-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = var.log_analytics_workspace_id
  application_type    = "Node.JS"
  tags                = var.tags
}

resource "azurerm_monitor_metric_alert" "failed_requests" {
  name                = "rentipid-alert-failed-requests-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.app_insights.id]
  description         = "Alert when failed requests exceed threshold."

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = 10
  }

  dynamic "action" {
    for_each = var.action_group_id != "" ? [1] : []
    content {
      action_group_id = var.action_group_id
    }
  }
}

resource "azurerm_monitor_metric_alert" "exceptions" {
  name                = "rentipid-alert-exceptions-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.app_insights.id]
  description         = "Alert when exceptions exceed threshold."

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "exceptions/count"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = 5
  }

  dynamic "action" {
    for_each = var.action_group_id != "" ? [1] : []
    content {
      action_group_id = var.action_group_id
    }
  }
}

resource "azurerm_monitor_metric_alert" "response_duration" {
  name                = "rentipid-alert-duration-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.app_insights.id]
  description         = "Alert when response duration exceeds 2 seconds."

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 2000
  }

  dynamic "action" {
    for_each = var.action_group_id != "" ? [1] : []
    content {
      action_group_id = var.action_group_id
    }
  }
}
