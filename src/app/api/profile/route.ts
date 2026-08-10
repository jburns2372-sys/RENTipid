import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { addressSchema } from '@/lib/address/types';
import { ProfileFieldProtection, ProfileFieldContext } from '@/lib/security/crypto/profile-field-protection';
import { AddressService } from '@/lib/address/AddressService';
import { AddressTokenService } from '@/lib/address/address-token';
import { COUNTRIES } from '@/lib/address/countryRegistry';
import { PsgcService } from '@/lib/address/psgc/psgc-service';

const profileUpdateSchema = z.object({
  first_name: z.string().trim().optional().nullable(),
  middle_name: z.string().trim().optional().nullable(),
  last_name: z.string().trim().optional().nullable(),
  display_name: z.string().trim().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  preferred_language: z.string().trim().optional().nullable(),
  timezone: z.string().trim().optional().nullable(),
  alternate_mobile_number: z.string().trim().optional().nullable(),
  emergency_contact_name: z.string().trim().optional().nullable(),
  emergency_contact_relationship: z.string().trim().optional().nullable(),
  emergency_contact_number: z.string().trim().optional().nullable(),
  email_notifications_enabled: z.boolean().optional(),
  sms_notifications_enabled: z.boolean().optional(),
  push_notifications_enabled: z.boolean().optional(),
  // Business fields
  business_name: z.string().trim().optional().nullable(),
  business_type: z.string().trim().optional().nullable(),
  business_contact_number: z.string().trim().optional().nullable(),
  business_email: z.string().trim().email().optional().or(z.literal('')).nullable(),
  business_description: z.string().trim().optional().nullable(),
  authorized_representative: z.string().trim().optional().nullable(),
  global_address: addressSchema.optional().nullable(),
  global_business_address: addressSchema.optional().nullable(),
}).strict();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session?.user as {id?: string}).id;
    const userRole = (session?.user as {role?: string})?.role || 'Renter';

    const [userProfile, businessProfile] = await Promise.all([
      prisma.userProfile.findUnique({ 
        where: { user_id: userId },
        include: { global_address: true }
      }),
      ['Individual Provider', 'Business Provider'].includes(userRole) 
        ? prisma.businessProfile.findUnique({ 
            where: { user_id: userId },
            include: { global_business_address: true }
          })
        : null
    ]);

    if (userProfile && userProfile.global_address) {
      (userProfile as Record<string, unknown>).global_address = AddressService.readNormalizedAddress(userProfile.global_address);
    }
    if (businessProfile && businessProfile.global_business_address) {
      (businessProfile as Record<string, unknown>).global_business_address = AddressService.readNormalizedAddress(businessProfile.global_business_address);
    }

    return NextResponse.json({
      userProfile: userProfile || {},
      businessProfile: businessProfile || {}
    });
  } catch {
    console.error('GET /api/profile error: [REDACTED_DUE_TO_PII]');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

interface ProcessedAddressPayload {
  addressLine1_encrypted: string | null;
  addressLine2_encrypted: string | null;
  sublocality_encrypted: string | null;
  locality_encrypted: string | null;
  administrativeArea2_encrypted: string | null;
  administrativeArea1_encrypted: string | null;
  postalCode_encrypted: string | null;
  countryCode: string | null;
  formattedAddress_encrypted: string | null;
  latitude_encrypted: string | null;
  longitude_encrypted: string | null;
  provider: string;
  providerPlaceId: string | null;
  validationStatus: string;
  validationLevel: string | null;
  manuallyEdited: boolean;
  validatedAt: Date | null;
  // Philippine PSGC codes
  regionPsgcCode: string | null;
  provincePsgcCode: string | null;
  localityPsgcCode: string | null;
  sublocalityPsgcCode: string | null;
  _legacyFormatted?: string;
  _legacyPlaintext?: {
    city?: string;
    province?: string;
    country?: string;
  };
}

function processAddressPayload(clientAddressData: z.infer<typeof addressSchema>, userId: string): ProcessedAddressPayload | null {
  if (!clientAddressData || !clientAddressData.countryCode) return null;
  
  // Base manual state
  let sourceData = { ...clientAddressData };
  let provider = 'MANUAL';
  let validationStatus = 'UNVERIFIED';
  let validationLevel: string | null = null;
  let providerPlaceId: string | null = null;

  // If token is present, it MUST match the authenticated user and it overrides all canonical fields
  if (clientAddressData.selectionToken) {
    const verifiedPayload = AddressTokenService.verifyToken(clientAddressData.selectionToken);
    if (verifiedPayload && verifiedPayload.userId === userId) {
      // Overwrite client payload with verified server metadata entirely
      sourceData = { ...verifiedPayload, selectionToken: clientAddressData.selectionToken, manuallyEdited: false } as unknown as z.infer<typeof addressSchema>;
      provider = verifiedPayload.provider;
      validationStatus = verifiedPayload.validationStatus;
      validationLevel = verifiedPayload.validationLevel;
      providerPlaceId = verifiedPayload.providerPlaceId;
      

    } else {
      // Token was invalid or belonged to another user
      provider = 'MANUAL';
      validationStatus = 'UNVERIFIED';
    }
  } else if (clientAddressData.provider === 'google' || clientAddressData.validationStatus === 'VALIDATED') {
    // If the client claims it's Google/Validated but provides no valid token, downgrade securely
    provider = 'MANUAL';
    validationStatus = 'UNVERIFIED';
  }

  // Encrypt sensitive fields
  const p = ProfileFieldProtection.protect;
  return {
    addressLine1_encrypted: sourceData.addressLine1 ? p(sourceData.addressLine1, ProfileFieldContext.ADDRESS_LINE_1) : null,
    addressLine2_encrypted: sourceData.addressLine2 ? p(sourceData.addressLine2, ProfileFieldContext.ADDRESS_LINE_2) : null,
    sublocality_encrypted: sourceData.sublocality ? p(sourceData.sublocality, ProfileFieldContext.ADDRESS_SUBLOCALITY) : null,
    locality_encrypted: sourceData.locality ? p(sourceData.locality, ProfileFieldContext.ADDRESS_LOCALITY) : null,
    administrativeArea2_encrypted: sourceData.administrativeArea2 ? p(sourceData.administrativeArea2, ProfileFieldContext.ADDRESS_ADMIN_AREA_2) : null,
    administrativeArea1_encrypted: sourceData.administrativeArea1 ? p(sourceData.administrativeArea1, ProfileFieldContext.ADDRESS_ADMIN_AREA_1) : null,
    postalCode_encrypted: sourceData.postalCode ? p(sourceData.postalCode, ProfileFieldContext.ADDRESS_POSTAL_CODE) : null,
    countryCode: sourceData.countryCode,
    formattedAddress_encrypted: sourceData.formattedAddress ? p(sourceData.formattedAddress, ProfileFieldContext.ADDRESS_FORMATTED) : null,
    latitude_encrypted: typeof sourceData.latitude === 'number' && !isNaN(sourceData.latitude) ? p(sourceData.latitude.toString(), ProfileFieldContext.ADDRESS_LATITUDE) : null,
    longitude_encrypted: typeof sourceData.longitude === 'number' && !isNaN(sourceData.longitude) ? p(sourceData.longitude.toString(), ProfileFieldContext.ADDRESS_LONGITUDE) : null,
    provider,
    providerPlaceId,
    validationStatus,
    validationLevel,
    manuallyEdited: clientAddressData.manuallyEdited ?? true,
    validatedAt: provider === 'MANUAL' ? null : (sourceData.validatedAt ? new Date(sourceData.validatedAt) : null),
    // Philippine PSGC codes — passed through from client, validated server-side in PATCH
    regionPsgcCode: clientAddressData.regionPsgcCode || null,
    provincePsgcCode: clientAddressData.provincePsgcCode || null,
    localityPsgcCode: clientAddressData.localityPsgcCode || null,
    sublocalityPsgcCode: clientAddressData.sublocalityPsgcCode || null,
    _legacyFormatted: typeof sourceData.formattedAddress === 'string' ? sourceData.formattedAddress : undefined,
    _legacyPlaintext: {
      city: typeof sourceData.locality === 'string' ? sourceData.locality : undefined,
      province: typeof sourceData.administrativeArea1 === 'string' ? sourceData.administrativeArea1 : undefined,
      country: typeof sourceData.countryCode === 'string' 
        ? COUNTRIES.find(c => c.countryCode === sourceData.countryCode)?.countryName || sourceData.countryCode
        : undefined,
    }
  };
}

async function validatePsgcFields(payload: ProcessedAddressPayload | null): Promise<string | null> {
  if (!payload || payload.countryCode !== 'PH') return null;

  const { localityPsgcCode, sublocalityPsgcCode } = payload;
  
  if (!localityPsgcCode) {
    return 'Philippine address requires a valid City or Municipality.';
  }
  if (!sublocalityPsgcCode) {
    return 'Philippine address requires a valid Barangay or District.';
  }

  const isValidCity = await PsgcService.validateCity(localityPsgcCode);
  if (!isValidCity) {
    return 'The selected City/Municipality is invalid or inactive.';
  }

  const isValidBarangay = await PsgcService.validateBarangayBelongsToCity(sublocalityPsgcCode, localityPsgcCode);
  if (!isValidBarangay) {
    return 'The selected Barangay is invalid or does not belong to the selected City/Municipality.';
  }

  return null;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session?.user as {id: string}).id;
    const userRole = (session?.user as {role?: string})?.role || 'Renter';
    const body = await req.json();

    const validatedData = profileUpdateSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Failed', details: validatedData.error.format() }, { status: 400 });
    }

    const data = validatedData.data;
    
    const userProfileData: Partial<z.infer<typeof profileUpdateSchema>> & Record<string, unknown> = { ...data };
    const businessProfileData: Partial<z.infer<typeof profileUpdateSchema>> & Record<string, unknown> = {};
    const businessKeys = [
      'business_name', 'business_type', 'business_contact_number', 
      'business_email', 'business_description', 'business_address', 'authorized_representative',
      'global_business_address'
    ];

    businessKeys.forEach(key => {
      if (key in userProfileData) {
        businessProfileData[key] = userProfileData[key];
        delete userProfileData[key];
      }
    });

    if (userProfileData.date_of_birth) {
      const parsedDate = new Date(userProfileData.date_of_birth as string | number);
      if (!isNaN(parsedDate.getTime())) {
        if (parsedDate > new Date()) {
           return NextResponse.json({ error: 'Validation Failed', details: 'Future date of birth is rejected' }, { status: 400 });
        }
        (userProfileData as Record<string, unknown>).date_of_birth = parsedDate;
      } else {
        delete userProfileData.date_of_birth;
      }
    }

    const existingUserProfile = await prisma.userProfile.findUnique({ where: { user_id: userId } });
    const existingBusinessProfile = await prisma.businessProfile.findUnique({ where: { user_id: userId } });

    // Addresses setup
    let userAddressPayload: ReturnType<typeof processAddressPayload> = null;
    let clearUserAddress = false;
    if (userProfileData.global_address !== undefined) {
      if (userProfileData.global_address === null) {
        clearUserAddress = true;
      } else {
        userAddressPayload = processAddressPayload(userProfileData.global_address as z.infer<typeof addressSchema>, userId);
        
        // Dual-write legacy fields using server-authoritative verified data
        if (userAddressPayload?._legacyFormatted) {
          userProfileData.address_encrypted = ProfileFieldProtection.protect(userAddressPayload._legacyFormatted, ProfileFieldContext.USER_ADDRESS);
        }
        if (userAddressPayload?._legacyPlaintext) {
          userProfileData.city = userAddressPayload._legacyPlaintext.city;
          userProfileData.province = userAddressPayload._legacyPlaintext.province;
          userProfileData.country = userAddressPayload._legacyPlaintext.country;
        }
        
        const psgcError = await validatePsgcFields(userAddressPayload);
        if (psgcError) {
          return NextResponse.json({ error: psgcError }, { status: 400 });
        }

        if (userAddressPayload) {
          delete userAddressPayload._legacyFormatted;
          delete userAddressPayload._legacyPlaintext;
        }
      }
      delete userProfileData.global_address;
    }

    let businessAddressPayload: ReturnType<typeof processAddressPayload> = null;
    let clearBusinessAddress = false;
    if (businessProfileData.global_business_address !== undefined) {
      if (businessProfileData.global_business_address === null) {
        clearBusinessAddress = true;
        // Strict clear of legacy business address state
        businessProfileData.business_address_encrypted = null;
      } else {
        businessAddressPayload = processAddressPayload(businessProfileData.global_business_address as z.infer<typeof addressSchema>, userId);
        
        // Dual-write legacy fields for business using server-authoritative verified data
        if (businessAddressPayload?._legacyFormatted) {
          businessProfileData.business_address_encrypted = ProfileFieldProtection.protect(businessAddressPayload._legacyFormatted, ProfileFieldContext.BUSINESS_ADDRESS);
        }

        const psgcError = await validatePsgcFields(businessAddressPayload);
        if (psgcError) {
          return NextResponse.json({ error: psgcError }, { status: 400 });
        }

        if (businessAddressPayload) {
          delete businessAddressPayload._legacyFormatted;
          delete businessAddressPayload._legacyPlaintext;
        }
      }
      delete businessProfileData.global_business_address;
    }

    // Execute in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      let updatedUserProfile;
      let finalUserAddressId = existingUserProfile?.global_address_id;

      if (userAddressPayload) {
        if (finalUserAddressId) {
          await tx.address.update({ where: { id: finalUserAddressId }, data: userAddressPayload });
        } else {
          const newAddr = await tx.address.create({ data: userAddressPayload });
          finalUserAddressId = newAddr.id;
        }
      } else if (clearUserAddress) {
        if (finalUserAddressId) {
          await tx.address.delete({ where: { id: finalUserAddressId } });
        }
        finalUserAddressId = null;
        userProfileData.address_encrypted = null;
        userProfileData.city = null;
        userProfileData.province = null;
        userProfileData.country = null;
      }

      const safeUserFields: Record<string, unknown> = {};
      const userSchemaFields = ['first_name', 'last_name', 'display_name', 'profile_photo'];
      for (const k of userSchemaFields) {
        if (k in userProfileData) safeUserFields[k] = userProfileData[k];
      }
      
      if ('address_encrypted' in userProfileData) safeUserFields.address_encrypted = userProfileData.address_encrypted;
      if ('city' in userProfileData) safeUserFields.city = userProfileData.city;
      if ('province' in userProfileData) safeUserFields.province = userProfileData.province;
      if ('country' in userProfileData) safeUserFields.country = userProfileData.country;
      
      if (existingUserProfile) {
        updatedUserProfile = await tx.userProfile.update({
          where: { user_id: userId },
          data: { ...safeUserFields, global_address_id: finalUserAddressId }
        });
      } else {
        updatedUserProfile = await tx.userProfile.create({
          data: {
            user_id: userId,
            verification_status: "Unverified",
            ...safeUserFields,
            global_address_id: finalUserAddressId || null
          }
        });
      }

      let updatedBusinessProfile: unknown = null;
      if (['Individual Provider', 'Business Provider'].includes(userRole) && (Object.keys(businessProfileData).length > 0 || businessAddressPayload || clearBusinessAddress)) {
        let finalBusinessAddressId = existingBusinessProfile?.global_business_address_id;

        if (businessAddressPayload) {
          if (finalBusinessAddressId) {
            await tx.address.update({ where: { id: finalBusinessAddressId }, data: businessAddressPayload });
          } else {
            const newBAddr = await tx.address.create({ data: businessAddressPayload });
            finalBusinessAddressId = newBAddr.id;
          }
        } else if (clearBusinessAddress) {
          if (finalBusinessAddressId) {
            await tx.address.delete({ where: { id: finalBusinessAddressId } });
          }
          finalBusinessAddressId = null;
          businessProfileData.business_address_encrypted = null;
        }

        const safeBusinessFields: Record<string, unknown> = {};
        const businessSchemaFields = ['business_name', 'business_registration_number', 'business_registration_number_encrypted', 'authorized_representative'];
        for (const k of businessSchemaFields) {
          if (k in businessProfileData) safeBusinessFields[k] = businessProfileData[k];
        }
        
        if ('business_address_encrypted' in businessProfileData) safeBusinessFields.business_address_encrypted = businessProfileData.business_address_encrypted;

        if (existingBusinessProfile) {
          updatedBusinessProfile = await tx.businessProfile.update({
            where: { user_id: userId },
            data: { ...safeBusinessFields, global_business_address_id: finalBusinessAddressId }
          });
        } else {
          updatedBusinessProfile = await tx.businessProfile.create({
            data: {
              user_id: userId,
              verification_status: "Unverified",
              // We require a default string for business_name if it's missing in create, but client validation handles that
              business_name: businessProfileData.business_name || "New Business",
              ...safeBusinessFields,
              global_business_address_id: finalBusinessAddressId || null
            }
          });
        }
      }

      return { updatedUserProfile, updatedBusinessProfile };
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'PROFILE_UPDATED_BY_USER',
      module: 'profile',
      target_id: userId,
      details: JSON.stringify({
        updatedFields: Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined && data[k as keyof typeof data] !== null)
      })
    });

    return NextResponse.json({
      success: true,
      userProfile: result.updatedUserProfile,
      businessProfile: result.updatedBusinessProfile
    });
  } catch {
    console.error('PATCH /api/profile error: [REDACTED_DUE_TO_PII]');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
