import { validateWithSupervisor } from './stage';
import { aiSpecialistRegistry } from '../specialists/registry';
import { routeToSpecialist } from '../specialists/router';

describe('AI Supervisor Validation and Specialist Routing', () => {

  it('A-SPEC-01: Correct logical specialist selected for supported intents', () => {
    expect(routeToSpecialist('booking_status').id).toBe('BOOKING');
    expect(routeToSpecialist('refund_request').id).toBe('PAYMENT_REFUND_DEPOSIT');
    expect(routeToSpecialist('damage_report').id).toBe('CLAIM_DISPUTE');
    expect(routeToSpecialist('unknown_intent').id).toBe('GENERAL_SUPPORT');
    expect(routeToSpecialist(undefined).id).toBe('GENERAL_SUPPORT');
  });

  it('A-SPEC-02: Specialist cannot access a tool outside its allowlist', () => {
    const specialist = aiSpecialistRegistry['BOOKING']; // Allowed tools: get_booking_status, cancel_booking
    
    // Valid tool
    const validResult = validateWithSupervisor({
      specialist,
      requestedTool: 'get_booking_status',
      isConsequentialAction: true
    });
    expect(validResult.outcome).toBe('PASS');

    // Invalid tool
    const invalidResult = validateWithSupervisor({
      specialist,
      requestedTool: 'report_damage', // Only allowed in CLAIM_DISPUTE
      isConsequentialAction: true
    });
    expect(invalidResult.outcome).toBe('SYSTEM_BLOCKED');
    expect(invalidResult.reason).toContain('is not allowed for specialist');
  });

  it('A-SUP-01: Supervisor blocks unsupported or contradictory action and returns safe-hold/system-blocked behavior', () => {
    const specialist = aiSpecialistRegistry['GENERAL_SUPPORT'];
    // Risk ceiling is INFORMATION
    
    const result = validateWithSupervisor({
      specialist,
      requestedTool: 'any_action_tool',
      isConsequentialAction: true
    });

    // Should fail due to risk ceiling (INFORMATION cannot perform consequential actions)
    expect(result.outcome).toBe('SYSTEM_BLOCKED'); // Wait, validateWithSupervisor returns SYSTEM_BLOCKED for invalid tool or SAFE_HOLD for risk ceiling
  });

  it('A-SUP-01: Supervisor enforces risk ceiling', () => {
    const specialist = aiSpecialistRegistry['GENERAL_SUPPORT'];
    
    // Bypassing tool check just to test risk ceiling
    const tempSpecialist = { ...specialist, allowedTools: ['some_action'] };
    const result = validateWithSupervisor({
      specialist: tempSpecialist,
      requestedTool: 'some_action',
      isConsequentialAction: true
    });

    expect(result.outcome).toBe('SAFE_HOLD');
    expect(result.reason).toContain('limited to INFORMATION');
  });

  it('A-SUP-01: Supervisor enforces intent match (contradictory state)', () => {
    const specialist = aiSpecialistRegistry['BOOKING'];
    const result = validateWithSupervisor({
      specialist,
      resolvedIntent: 'kyc_status', // BOOKING specialist does not handle this
    });

    expect(result.outcome).toBe('SAFE_HOLD');
    expect(result.reason).toContain('is not supported by specialist');
  });

});
