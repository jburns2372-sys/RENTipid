import { z } from 'zod';

export const PublicRegistrationRole = z.enum(['Renter', 'Individual Provider', 'Business Provider']);
export const PublicAccountType = z.enum(['Individual', 'Business']);

// Reject any control characters including null bytes
const NoControlChars = (val: string) => !/[\x00-\x1F\x7F]/.test(val);

export const EmailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .max(254, 'Email too long')
  .refine(NoControlChars, { message: 'Control characters not allowed' });

export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(val => !/[\x00]/.test(val), { message: 'Null bytes not allowed' });

export const HumanReadableString = z.string()
  .trim()
  .max(150, 'Input too long')
  .refine(NoControlChars, { message: 'Control characters not allowed' });

export const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  full_name: HumanReadableString,
  mobile_number: HumanReadableString.optional(),
  account_type: PublicAccountType.optional().default('Individual'),
  role: PublicRegistrationRole.optional().default('Renter'),
  address: HumanReadableString.optional(),
  city: HumanReadableString.optional(),
  province: HumanReadableString.optional(),
  country: HumanReadableString.optional(),
  business_name: z.string().trim().max(200).refine(NoControlChars, { message: 'Control characters not allowed' }).optional(),
  business_registration_number: HumanReadableString.optional(),
  authorized_representative: HumanReadableString.optional(),
}).strict();

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
