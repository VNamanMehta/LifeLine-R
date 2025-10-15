import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['donor', 'staff']),
  blood_group: z.string().optional(),
  last_donation_date: z.string().optional(),
  // Add location validation
  location: z.object({
    lat: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
    lng: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  }),
}).refine(data => {
  // If the role is 'donor', blood_group must be selected and not be an empty string.
  if (data.role === 'donor' && (!data.blood_group || data.blood_group === '')) {
    return false;
  }
  return true;
}, {
  // Custom error message for the blood_group field
  message: 'Blood group is required for donors',
  path: ['blood_group'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInFormData = z.infer<typeof signInSchema>;