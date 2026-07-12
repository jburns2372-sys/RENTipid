import * as appInsights from 'applicationinsights';

export const initAppInsights = () => {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  
  if (connectionString) {
    appInsights.setup(connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);
      
    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'rentipid-azure-api';
    appInsights.start();
    console.log('Azure Application Insights initialized successfully.');
  } else {
    console.log('APPLICATIONINSIGHTS_CONNECTION_STRING not provided. Telemetry disabled.');
  }
};

export const getTelemetryClient = () => {
  return appInsights.defaultClient;
};