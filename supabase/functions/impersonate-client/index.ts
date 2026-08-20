import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Founder-only: lets Shannon switch her own logged-in session into a real
// session for a given client, so she can see and act inside the app exactly
// as that client would (view AND write -- messages, check-ins, etc. really
// happen as that client, not a read-only preview). This is deliberately not
// available to ordinary providers, and not scoped to "my own org's clients
// only" -- founder already has cross-org visibility elsewhere (Platform
// Activity), so this matches that precedent.
//
// How it works: verifies the caller's own JWT and profile (is_founder), then
// uses the service role to generate a magic-link token for the target
// client's auth account. The frontend redeems that token via
// supabase.auth.verifyOtp(...) to get a genuinely real session for the
// client -- not a spoofed one -- so all existing RLS policies and app logic
// (role lookup, auth_user_id-based data fetches) work completely unchanged.

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { client_id } = await req.json();
    if (!client_id) throw new Error('client_id is required.');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not authenticated.');

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error('Not authenticated.');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: callerProfile } = await admin.from('profiles').select('is_founder').eq('id', caller.id).single();
    if (!callerProfile?.is_founder) throw new Error('Only the founder account can switch into a client view.');

    const { data: client } = await admin.from('clients').select('id, name, email').eq('id', client_id).single();
    if (!client?.email) throw new Error('That client has no email on file, so a session cannot be generated for them.');

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
    });
    if (linkError) throw linkError;

    const hashedToken = link?.properties?.hashed_token;
    if (!hashedToken) throw new Error('Could not generate a session token for that client.');

    return new Response(JSON.stringify({
      success: true,
      email: client.email,
      client_name: client.name,
      token_hash: hashedToken,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
