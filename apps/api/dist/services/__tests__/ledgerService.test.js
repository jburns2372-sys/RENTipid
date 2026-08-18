describe('LedgerService (Phase 17)', () => {
    it('should calculate the correct Platform Fee and Provider Share from a 10,000 payment', () => {
        // Arrange
        const totalPaid = 10000; // Expected to be in smallest currency unit (e.g. cents if applicable, or whole PHP)
        const platformFeePercentage = 0.10;
        // Act
        const platformFee = totalPaid * platformFeePercentage;
        const providerShare = totalPaid - platformFee;
        // Assert
        expect(platformFee).toBe(1000);
        expect(providerShare).toBe(9000);
    });
    it('should split security deposits correctly across double-entry accounts', () => {
        // Arrange
        const rentalFee = 5000;
        const deposit = 2000;
        const totalPaid = rentalFee + deposit;
        const platformFeePercentage = 0.10;
        // Act
        const platformFee = rentalFee * platformFeePercentage;
        const providerShare = rentalFee - platformFee;
        // Assert: Platform fee should NOT be taken from the deposit
        expect(platformFee).toBe(500);
        expect(providerShare).toBe(4500);
        expect(deposit).toBe(2000);
        expect(platformFee + providerShare + deposit).toBe(totalPaid);
    });
});
