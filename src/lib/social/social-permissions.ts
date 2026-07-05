export function canUserManageAccount(userRole: string | undefined, accountType: string): boolean {
  if (!userRole) return false;
  
  if (userRole === 'Super Admin' || userRole === 'Admin') {
    return true; // Admins can manage platform-wide accounts
  }
  
  if ((userRole === 'Business Provider' || userRole === 'Individual Provider') && accountType === 'Provider') {
    return true; // Providers can manage their own
  }
  
  return false;
}

export function canUserApproveCampaign(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return userRole === 'Super Admin' || userRole === 'Admin';
}

export function canProviderApproveOwnPost(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return userRole === 'Business Provider' || userRole === 'Individual Provider';
}
