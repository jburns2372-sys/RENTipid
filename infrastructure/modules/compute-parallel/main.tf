data "azurerm_container_registry" "existing" {
  count               = var.existing_container_registry_name != "" ? 1 : 0
  name                = var.existing_container_registry_name
  resource_group_name = var.resource_group_name
}

resource "azurerm_container_app_environment" "parallel" {
  name                       = var.parallel_container_apps_environment_name_prefix
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  infrastructure_subnet_id   = var.infrastructure_subnet_id
  tags                       = var.tags
}

resource "azurerm_container_app" "api_parallel" {
  name                         = "ca-api-parallel-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.parallel.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  secret {
    name  = "appinsights-connection-string"
    value = var.application_insights_connection_string
  }

  template {
    container {
      name   = "api"
      image  = "${data.azurerm_container_registry.existing[0].login_server}/rentipid-api:latest"
      cpu    = 0.5
      memory = "1Gi"

      liveness_probe {
        port      = 3000
        transport = "HTTP"
        path      = "/health/live"
      }

      readiness_probe {
        port      = 3000
        transport = "HTTP"
        path      = "/health/live"
      }

      env {
        name        = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        secret_name = "appinsights-connection-string"
      }
    }
  }

  ingress {
    external_enabled           = true
    target_port                = 3000
    allow_insecure_connections = false
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = var.tags
}

resource "azurerm_role_assignment" "acr_pull_api" {
  principal_id                     = azurerm_container_app.api_parallel.identity[0].principal_id
  role_definition_name             = "AcrPull"
  scope                            = data.azurerm_container_registry.existing[0].id
  skip_service_principal_aad_check = true
}

resource "azurerm_container_app_job" "worker_parallel" {
  name                         = "ca-worker-parallel-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.parallel.id
  resource_group_name          = var.resource_group_name
  location                     = var.location

  replica_timeout_in_seconds = 1800
  replica_retry_limit        = 1

  identity {
    type = "SystemAssigned"
  }

  schedule_trigger_config {
    cron_expression          = "*/15 * * * *"
    parallelism              = 1
    replica_completion_count = 1
  }

  template {
    container {
      name   = "worker"
      image  = "${data.azurerm_container_registry.existing[0].login_server}/rentipid-azure-worker:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "JOB_NAME"
        value = "booking-sweeper"
      }
    }
  }

  tags = var.tags
}

resource "azurerm_role_assignment" "acr_pull_worker" {
  principal_id                     = azurerm_container_app_job.worker_parallel.identity[0].principal_id
  role_definition_name             = "AcrPull"
  scope                            = data.azurerm_container_registry.existing[0].id
  skip_service_principal_aad_check = true
}
