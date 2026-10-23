export class AiGuardrails {
  private static instance = new AiGuardrails();

  static getInstance() {
    return this.instance;
  }

  // Check for common prompt injection patterns
  detectInjection(input: string): boolean {
    const maliciousPatterns = [
      /ignore all previous instructions/i,
      /you are now a/i,
      /bypass safety/i,
      /system prompt/i,
      /reveal hidden/i,
      /<\|im_start\|>system/i,
      /system:/i
    ];
    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  // Ensure minimum data serialization (scrubbing secrets)
  scrubSecrets(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const scrubbed = { ...data };
    const secretKeys = ['password', 'token', 'secret', 'credit_card', 'ssn', 'cvv'];
    
    for (const key in scrubbed) {
      if (secretKeys.some(sk => key.toLowerCase().includes(sk))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof scrubbed[key] === 'object') {
        scrubbed[key] = this.scrubSecrets(scrubbed[key]);
      }
    }
    return scrubbed;
  }

  validateDataPrivacy(data: any, allowedFields: string[]): any {
    if (typeof data !== 'object' || data === null) return data;
    const filtered: any = {};
    for (const key in data) {
      if (allowedFields.includes(key)) {
        filtered[key] = data[key];
      }
    }
    return filtered;
  }
}
