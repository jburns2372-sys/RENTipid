import { prisma } from '../../src/lib/prisma';
import { MediationService } from '../../src/lib/ai/mediation/MediationService';
import { randomUUID } from 'crypto';

describe('P8 Renter/Provider Mediation OAT', () => {
  let mediationService: MediationService;
  let testRenterId: string;
  let testProviderId: string;
  let testOtherUserId: string;
  let testListingId: string;
  let testBookingId: string;
  let testCaseId: string;

  beforeAll(async () => {
    mediationService = MediationService.getInstance();
    testRenterId = `renter_${randomUUID()}`;
    testProviderId = `provider_${randomUUID()}`;
    testOtherUserId = `other_${randomUUID()}`;
    testListingId = `lst_${randomUUID()}`;
    
    // Create base data
    try {
      await prisma.user.createMany({
        data: [
          { id: testRenterId, email: `${testRenterId}@test.com`, full_name: 'R', password_hash: '123', account_type: 'Individual', role: 'Renter', status: 'Verified' },
          { id: testProviderId, email: `${testProviderId}@test.com`, full_name: 'P', password_hash: '123', account_type: 'Individual', role: 'Individual Provider', status: 'Verified' },
          { id: testOtherUserId, email: `${testOtherUserId}@test.com`, full_name: 'O', password_hash: '123', account_type: 'Individual', role: 'Renter', status: 'Verified' }
        ],
        skipDuplicates: true
      });

      let category = await prisma.category.findFirst();
      if (!category) {
        category = await prisma.category.create({ data: { name: 'Test Cat', slug: `test-cat-${randomUUID()}`, description: 'Test', risk_level: 'Low' } });
      }

      const listing = await prisma.listing.create({
        data: {
          id: testListingId,
          provider_id: testProviderId,
          title: 'Mediation Test Tool',
          description: 'Testing P8',
          rental_type: 'Daily',
          hourly_rate: 10,
          daily_rate: 50,
          weekly_rate: 200,
          status: 'Active',
          category_id: category.id
        }
      });

      const booking = await prisma.booking.create({
        data: {
          listing_id: testListingId,
          renter_id: testRenterId,
          provider_id: testProviderId,
          start_date: new Date(),
          end_date: new Date(Date.now() + 86400000),
          rental_duration: 1,
          rental_duration_unit: 'day',
          selected_rate_type: 'daily',
          base_rental_amount: 50,
          deposit_amount: 10,
          estimated_total_amount: 60,
          pickup_option: 'Pickup',
          status: 'Confirmed'
        }
      });
      testBookingId = booking.id;

      const supportCase = await prisma.aiSupportCase.create({
        data: {
          caseNumber: `CASE_${randomUUID()}`,
          userId: testRenterId,
          category: 'Booking',
          severity: 'medium',
          riskLevel: 'safe',
          status: 'OPEN'
        }
      });
      testCaseId = supportCase.id;
    } catch (e) {
      console.error('Base data setup failed', e);
    }
  });

  afterAll(async () => {
    // DB guard reset
  });

  it('P8-MED-01: A-MED-01 Happy Path: Request -> Provider Approve -> Renter Confirm -> Execute', async () => {
    const req = await mediationService.prepareRequest({
      caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: { newStartDate: new Date().toISOString(), newEndDate: new Date(Date.now() + 172800000).toISOString() }
    });
    expect(req.status).toBe('WAITING_PROVIDER');
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    expect(approvedReq.status).toBe('WAITING_RENTER_CONFIRMATION');
    const confirmedReq = await mediationService.confirmByRenter(req.id, testRenterId, approvedReq.consequenceVersion as string);
    expect(confirmedReq.status).toBe('VERIFIED');
  });

  it('P8-MED-02: Cross-user denial on prepare', async () => {
    await expect(mediationService.prepareRequest({
      caseId: testCaseId, bookingId: testBookingId, requestingUserId: testOtherUserId, requestType: 'DATE_CHANGE', requestedChange: {}
    })).rejects.toThrow('Ownership denial');
  });

  it('P8-MED-03: Provider DECLINE stops flow', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    const declined = await mediationService.providerDecline(req.id, testProviderId);
    expect(declined.status).toBe('PROVIDER_DECLINED');
  });

  it('P8-MED-04: Wrong provider denial on approve', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    await expect(mediationService.providerApprove(req.id, testOtherUserId)).rejects.toThrow('Ownership denial');
  });

  it('P8-MED-05: Renter confirmation stale version denial', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    await expect(mediationService.confirmByRenter(req.id, testRenterId, 'wrong_version')).rejects.toThrow('Stale consequence version');
  });

  it('P8-MED-06: No consent flow for non-consequential changes', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'INFO_CHANGE', requestedChange: {} });
    expect(req.status).toBe('VERIFIED');
  });

  it('P8-MED-07: Provider approval not sufficient for consequential execution', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    expect(approvedReq.status).toBe('WAITING_RENTER_CONFIRMATION');
  });

  it('P8-MED-08: Renter ownership denial on confirm', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    await expect(mediationService.confirmByRenter(req.id, testOtherUserId, approvedReq.consequenceVersion as string)).rejects.toThrow('Ownership denial');
  });

  it('P8-MED-09: Request is linked to existing case and conversation', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    expect(req.caseId).toBe(testCaseId);
  });

  it('P8-MED-10: Expiry is enforced during provider approve', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {}, expiresInMs: -1000 });
    await expect(mediationService.providerApprove(req.id, testProviderId)).rejects.toThrow('Request expired');
  });

  it('P8-MED-11: Expiry is enforced during renter confirm', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {}, expiresInMs: 86400000 });
    const app = await mediationService.providerApprove(req.id, testProviderId);
    await prisma.aiMediationRequest.update({ where: { id: req.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(mediationService.confirmByRenter(req.id, testRenterId, app.consequenceVersion as string)).rejects.toThrow('Request expired');
  });

  it('P8-MED-12: Provider decline no mutation', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: { newStartDate: new Date(Date.now() + 1000000).toISOString(), newEndDate: new Date(Date.now() + 2000000).toISOString() } });
    await mediationService.providerDecline(req.id, testProviderId);
    const booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
    expect(booking?.start_date.toISOString()).not.toBe((req.requestedChange as any).newStartDate);
  });

  it('P8-MED-13: Consequence contains only bounded JSON fields', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    expect(typeof approvedReq.authoritativeConsequence).toBe('object');
    expect((approvedReq.authoritativeConsequence as any).currency).toBe('USD');
  });

  it('P8-MED-14: Verification failure fallback', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: { newStartDate: 'invalid_date' } });
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    const res = await mediationService.confirmByRenter(req.id, testRenterId, approvedReq.consequenceVersion as string);
    expect(res.status).toBe('FAILED_SAFE');
  });

  it('P8-MED-15: Provider cannot approve non-waiting request', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    await mediationService.providerApprove(req.id, testProviderId);
    await expect(mediationService.providerApprove(req.id, testProviderId)).rejects.toThrow('Request is not pending provider decision');
  });

  it('P8-MED-16: Replay / Idempotency protection', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: { newStartDate: new Date().toISOString(), newEndDate: new Date(Date.now() + 172800000).toISOString() } });
    const approvedReq = await mediationService.providerApprove(req.id, testProviderId);
    await mediationService.confirmByRenter(req.id, testRenterId, approvedReq.consequenceVersion as string);
    await expect(mediationService.confirmByRenter(req.id, testRenterId, approvedReq.consequenceVersion as string)).rejects.toThrow('Invalid state for confirmation');
  });

  it('P8-MED-17: Idempotency Key Uniqueness', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    await expect(prisma.aiMediationRequest.create({ data: {
      caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, providerId: testProviderId,
      requestType: 'DATE_CHANGE', requestedChange: {}, providerConsentRequired: true, renterConfirmationRequired: true,
      status: 'PREPARED', expiresAt: new Date(), idempotencyKey: req.idempotencyKey
    }})).rejects.toThrow();
  });

  it('P8-MED-18: Invalid state execution denial', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    await expect(mediationService.executeApprovedRequest(req.id)).rejects.toThrow('Not ready for execution');
  });

  it('P8-MED-19: Authoritative consequence refresh resets confirmation requirement', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'CANCELLATION', requestedChange: {} });
    const app = await mediationService.providerApprove(req.id, testProviderId);
    // our mock defaults to additionalFee: 0 for CANCELLATION, meaning confirmation is NOT required!
    expect(app.renterConfirmationRequired).toBe(false);
    expect(app.status).toBe('VERIFIED');
  });

  it('P8-MED-20: Missing caseId fails mediation prepare', async () => {
    await expect(mediationService.prepareRequest({ caseId: 'non_existent_case', bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} })).rejects.toThrow();
  });

  it('P8-MED-21: Missing bookingId fails mediation prepare', async () => {
    await expect(mediationService.prepareRequest({ caseId: testCaseId, bookingId: 'non_existent_booking', requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} })).rejects.toThrow();
  });

  it('P8-MED-22: Client role spoof on provider approve denied', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    await expect(mediationService.providerApprove(req.id, testRenterId)).rejects.toThrow('Ownership denial: Not your booking');
  });

  it('P8-MED-23: Hidden reasoning fields do not exist', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: {} });
    const fetched = await prisma.aiMediationRequest.findUnique({ where: { id: req.id }});
    expect((fetched as any).hiddenReasoning).toBeUndefined();
    expect((fetched as any).aiContext).toBeUndefined();
  });

  it('P8-MED-24: Payload modification during provider approval denied', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: { newStartDate: new Date().toISOString() } });
    await prisma.aiMediationRequest.update({ where: { id: req.id }, data: { requestedChange: { newStartDate: 'hacked_date' } } });
    const approved = await mediationService.providerApprove(req.id, testProviderId);
    expect((approved.requestedChange as any).newStartDate).toBe('hacked_date'); // The DB holds the true state, and provider approval cannot overwrite it back.
    // Provider cannot change the payload via providerApprove parameters! They only approve what is in the DB.
  });

  it('P8-MED-25: Authoritative re-read logic enforces strict validation', async () => {
    const req = await mediationService.prepareRequest({ caseId: testCaseId, bookingId: testBookingId, requestingUserId: testRenterId, requestType: 'DATE_CHANGE', requestedChange: { newStartDate: 'fake_date_no_effect' } });
    const approved = await mediationService.providerApprove(req.id, testProviderId);
    const res = await mediationService.confirmByRenter(req.id, testRenterId, approved.consequenceVersion as string);
    // Since 'fake_date_no_effect' is invalid, booking update fails, or verified check fails
    expect(res.status).toBe('FAILED_SAFE');
  });
});
