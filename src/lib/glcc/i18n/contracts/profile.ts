/**
 * RENTipid GLCC v1.0.1 — Domain Contract: profile
 */

export const PROFILE_KEYS = [
  "profile.profileDetails",
  "profile.personalInformation",
  "profile.emergencyContact",
  "profile.businessAddress",
  "profile.notificationPreferences",
  "profile.receiveEmailNotifications",
  "profile.profilePhoto",
  "profile.jpgGifOrPng"
] as const;

export const PROFILE_EN_PH: Record<(typeof PROFILE_KEYS)[number], string> = {
  "profile.profileDetails": "Profile Details",
  "profile.personalInformation": "Personal Information",
  "profile.emergencyContact": "Emergency Contact",
  "profile.businessAddress": "Business Address",
  "profile.notificationPreferences": "Notification Preferences",
  "profile.receiveEmailNotifications": "Receive email notifications",
  "profile.profilePhoto": "Profile Photo",
  "profile.jpgGifOrPng": "JPG, GIF or PNG. Max size of 5MB."
};
