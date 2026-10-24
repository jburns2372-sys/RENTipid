import * as appInsights from 'applicationinsights';

const SENSITIVE_KEYS = new Set([
  'authorization', 'proxyauthorization', 'cookie', 'setcookie',
  'password', 'passwordconfirmation', 'passwd', 'pwd',
  'accesstoken', 'refreshtoken', 'idtoken', 'sessiontoken',
  'resettoken', 'verificationtoken', 'bearer',
  'apikey', 'apisecret', 'clientsecret', 'secretkey', 'privatekey',
  'connectionstring', 'databaseurl', 'directurl',
  'storageaccountkey', 'sastoken', 'paymongosecret',
  'cardnumber', 'cvv', 'cvc', 'accountnumber', 'governmentid'
]);

export const isSensitiveKey = (key: string): boolean => {
  if (!key) return false;
  const normalized = key.toLowerCase().replace(/[_\-\s.]/g, '');
  return SENSITIVE_KEYS.has(normalized);
};

export const sanitizeValue = (value: unknown, depth = 0, seen = new WeakSet<object>()): unknown => {
  if (value === null || value === undefined) return value;
  if (depth > 10) return '[MAX_DEPTH_REACHED]';

  if (typeof value === 'string') {
    if (/^bearer\s+/i.test(value)) return '[REDACTED]';
    if (/password=|pwd=|accountkey=/i.test(value)) return '[REDACTED]';
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value;

  if (typeof value === 'object') {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1, seen));
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }

    const sanitizedObj: Record<string, unknown> = {};
    const recordValue = value as Record<string, unknown>;
    for (const key in recordValue) {
      if (Object.prototype.hasOwnProperty.call(recordValue, key)) {
        sanitizedObj[key] = isSensitiveKey(key)
          ? '[REDACTED]'
          : sanitizeValue(recordValue[key], depth + 1, seen);
      }
    }
    return sanitizedObj;
  }

  return value;
};

export const sanitizeUrl = (urlStr: string): string => {
  if (!urlStr) return urlStr;
  try {
    const parsed = new URL(urlStr);
    parsed.username = '';
    parsed.password = '';
    parsed.hash = '';

    const params = new URLSearchParams(parsed.search);
    for (const key of Array.from(params.keys())) {
      params.set(key, '[REDACTED]');
    }
    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    const queryIdx = urlStr.indexOf('?');
    const hashIdx = urlStr.indexOf('#');
    let chopIdx = -1;
    if (queryIdx !== -1 && hashIdx !== -1) chopIdx = Math.min(queryIdx, hashIdx);
    else if (queryIdx !== -1) chopIdx = queryIdx;
    else if (hashIdx !== -1) chopIdx = hashIdx;
    return chopIdx !== -1 ? urlStr.substring(0, chopIdx) : urlStr;
  }
};

export const telemetryPrivacyProcessor = (envelope: appInsights.Contracts.EnvelopeTelemetry): boolean => {
  if (!envelope?.data || !(envelope.data as appInsights.Contracts.Data<appInsights.Contracts.Domain>).baseData) {
    return true;
  }

  const baseData = (envelope.data as appInsights.Contracts.Data<appInsights.Contracts.Domain>).baseData;

  if ('url' in baseData && typeof baseData.url === 'string') {
    baseData.url = sanitizeUrl(baseData.url);
  }
  if ('properties' in baseData && baseData.properties) {
    baseData.properties = sanitizeValue(baseData.properties) as Record<string, string>;
  }
  if ('customDimensions' in baseData && baseData.customDimensions) {
    baseData.customDimensions = sanitizeValue(baseData.customDimensions) as Record<string, string>;
  }
  if ('measurements' in baseData && baseData.measurements) {
    baseData.measurements = sanitizeValue(baseData.measurements) as Record<string, number>;
  }
  if ('exceptions' in baseData && Array.isArray(baseData.exceptions)) {
    baseData.exceptions = baseData.exceptions.map((exception: appInsights.Contracts.ExceptionDetails) => {
      if (exception.message && (/bearer\s+/i.test(exception.message) || /password=|pwd=|accountkey=/i.test(exception.message))) {
        exception.message = '[REDACTED]';
      }
      return exception;
    });
  }

  if (envelope.tags) {
    const userIdKey = appInsights.defaultClient?.context?.keys?.userId;
    const authUserIdKey = appInsights.defaultClient?.context?.keys?.userAuthUserId;
    if (userIdKey && envelope.tags[userIdKey]) envelope.tags[userIdKey] = '[REDACTED]';
    if (authUserIdKey && envelope.tags[authUserIdKey]) envelope.tags[authUserIdKey] = '[REDACTED]';
  }

  return true;
};

let isInitialized = false;

export const initAppInsights = () => {
  if (isInitialized) return;
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
      
    if (appInsights.defaultClient?.context?.tags) {
      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'rentipid-azure-api';
      appInsights.defaultClient.addTelemetryProcessor(telemetryPrivacyProcessor);
    }
    appInsights.start();
    isInitialized = true;
    console.log('Azure Application Insights initialized successfully.');
  } else {
    console.log('APPLICATIONINSIGHTS_CONNECTION_STRING not provided. Telemetry disabled.');
  }
};

export const getTelemetryClient = () => {
  return appInsights.defaultClient;
};
