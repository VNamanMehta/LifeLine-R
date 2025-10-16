// File: api/create-profile.ts

import { createClient } from '@supabase/supabase-js';
import { Clerk, AuthStatus } from '@clerk/clerk-sdk-node';
import { z } from 'zod';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['donor', 'staff']),
  blood_group: z.string().optional(),
  last_donation_date: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const requestState = await clerk.authenticateRequest({ request: req });
    if (requestState.status !== AuthStatus.SignedIn) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const auth = requestState.toAuth();
    if (!auth || !auth.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const { userId } = auth;

    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return new Response(JSON.stringify({ error: 'User email could not be found in Clerk.' }), { status: 400 });
    }

    const body = await req.json();
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
    }

    const { firstName, lastName, role, blood_group, location, last_donation_date } = validation.data;
    const fullName = `${firstName} ${lastName}`.trim();
    const locationString = `SRID=4326;POINT(${location.lng} ${location.lat})`;

    // Insert user into Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        email: email,
        name: fullName,
        role: role,
        blood_group: role === 'donor' ? blood_group : null,
        location: locationString,
        last_donation_date: last_donation_date || null,
      })
      .select('id')
      .single();

    if (error) { throw error; }

    // Update Clerk's metadata
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        db_id: newUser.id,
        role: role,
      },
    });

    return new Response(JSON.stringify({ success: true, userId: newUser.id }), { status: 200 });

  } catch (error: any) {
    console.error('Error in create-profile:', error);
    const status = error.status || 500;
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { status });
  }
}