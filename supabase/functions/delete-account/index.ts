// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error(
      'delete-account function: Missing required environment variables.'
    );
    return new Response('Internal Server Error: Missing configuration.', {
      status: 500,
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json(
      { error: 'Missing Authorization header' },
      {
        status: 401,
      }
    );
  }

  // User-scoped client (to identify who is calling)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin client (service role)
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Delete the Auth user
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error('Error deleting user:', delErr);
    return Response.json(
      { error: 'Failed to delete user account.' },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
});
