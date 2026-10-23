export interface ClientContext {
  route: string;
  bookingId?: string;
  listingId?: string;
  paymentId?: string;
  claimId?: string;
  disputeId?: string;
  caseId?: string;
}

export interface AuthorizedContext {
  userId: string;
  route: string;
  activeEntity?: {
    type: string;
    id: string;
  };
  caseId?: string;
}

export class AiContextHelper {
  private static instance = new AiContextHelper();

  static getInstance() {
    return this.instance;
  }

  // Mock domain database for context validation
  private mockDb = {
    bookings: [{ id: 'bk_123', userId: 'test_user' }],
    listings: [{ id: 'lst_123', ownerId: 'test_user' }],
    cases: [{ id: 'cas_123', userId: 'test_user' }]
  };

  /**
   * Safely carries minimum authorized context.
   * Never trusts unauthorized client context. Validates ownership server-side.
   */
  async authorizeContext(userId: string, clientContext: ClientContext): Promise<AuthorizedContext> {
    const authorized: AuthorizedContext = {
      userId,
      route: clientContext.route
    };

    if (clientContext.caseId) {
      const c = this.mockDb.cases.find(c => c.id === clientContext.caseId);
      if (c && c.userId === userId) {
        authorized.caseId = clientContext.caseId;
      } else {
        throw new Error('Unauthorized context: caseId');
      }
    }

    if (clientContext.bookingId) {
      const b = this.mockDb.bookings.find(b => b.id === clientContext.bookingId);
      if (b && b.userId === userId) {
        authorized.activeEntity = { type: 'Booking', id: clientContext.bookingId };
      } else {
        throw new Error('Unauthorized context: bookingId');
      }
    } else if (clientContext.listingId) {
      const l = this.mockDb.listings.find(l => l.id === clientContext.listingId);
      if (l && l.ownerId === userId) {
        authorized.activeEntity = { type: 'Listing', id: clientContext.listingId };
      } else {
        throw new Error('Unauthorized context: listingId');
      }
    }

    // Additional entity checks (claim, payment, dispute) would go here

    return authorized;
  }
}
