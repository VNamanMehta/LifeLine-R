import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { z } from 'zod';

const publicMetadataSchema = z.object({
  role: z.string().optional(),
  blood_group: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  db_id: z.string().optional(),
});

// This interface helps TypeScript understand the shape of Clerk's event data
interface UserCreatedEvent {
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    last_name: string | null;
    public_metadata: z.infer<typeof publicMetadataSchema>;
  };
  object: 'event';
  type: 'user.created';
}

// Initialize Supabase client with the service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to your environment variables.');
  }

  // Get the headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: UserCreatedEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as UserCreatedEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Webhook verification failed', { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, public_metadata, first_name, last_name } = evt.data;

    const validation = publicMetadataSchema.safeParse(public_metadata);
    if (!validation.success) {
      console.error('Webhook Error: Invalid public_metadata.', validation.error.issues);
      return new Response('Error: Invalid metadata provided.', { status: 400 });
    }
    const { location, role, blood_group } = validation.data;

    const clerkId = id;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim() || 'New User';

    const locationString = `SRID=4326;POINT(${location.lng} ${location.lat})`;

    try {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email: email,
          name: name,
          role: role || "donor",
          blood_group: blood_group,
          location: locationString,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }

      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          ...public_metadata,
          db_id: newUser.id,
        },
      });

      console.log(`Successfully synced new user: ${email} with DB ID: ${newUser.id}`);

    } catch (err) {
      console.error('Error syncing user:', err);
      return new Response('Error occurred during user sync', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}