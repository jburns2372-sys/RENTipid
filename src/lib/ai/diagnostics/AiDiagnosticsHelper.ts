export interface DiagnosticResult {
  status: 'healthy' | 'degraded' | 'failed';
  details: string;
  recommendedAction: string;
}

export class AiDiagnosticsHelper {
  private static instance = new AiDiagnosticsHelper();

  static getInstance() {
    return this.instance;
  }

  checkNetwork(): DiagnosticResult {
    // In a real browser context this would check navigator.onLine and ping
    return { status: 'healthy', details: 'Network connected', recommendedAction: 'none' };
  }

  checkMicrophonePermission(hasPermission: boolean): DiagnosticResult {
    if (hasPermission) {
      return { status: 'healthy', details: 'Microphone active', recommendedAction: 'none' };
    }
    return { status: 'failed', details: 'Microphone permission denied', recommendedAction: 'USE_TEXT_FALLBACK' };
  }

  checkServiceWorker(swRegistered: boolean): DiagnosticResult {
    if (swRegistered) {
      return { status: 'healthy', details: 'Service worker active', recommendedAction: 'none' };
    }
    return { status: 'degraded', details: 'PWA offline capabilities reduced', recommendedAction: 'REGISTER_SW' };
  }

  checkSession(sessionActive: boolean): DiagnosticResult {
    if (sessionActive) {
      return { status: 'healthy', details: 'Session active', recommendedAction: 'none' };
    }
    return { status: 'failed', details: 'Session expired or disconnected', recommendedAction: 'RECREATE_SESSION' };
  }

  checkAiProvider(providerHealthy: boolean): DiagnosticResult {
    if (providerHealthy) {
      return { status: 'healthy', details: 'Digital Human provider connected', recommendedAction: 'none' };
    }
    return { status: 'failed', details: 'Provider offline', recommendedAction: 'USE_TEXT_FALLBACK' };
  }

  // Self-Repair Logic
  attemptSelfRepair(issue: string): string {
    switch (issue) {
      case 'RECREATE_SESSION':
        return 'SESSION_RECREATED';
      case 'USE_TEXT_FALLBACK':
        return 'TEXT_FALLBACK_ACTIVATED';
      case 'REGISTER_SW':
        return 'SW_REGISTRATION_ATTEMPTED';
      default:
        return 'NO_REPAIR_AVAILABLE';
    }
  }
}
