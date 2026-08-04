import { supabase } from './supabase';

const SUPABASE_URL = 'https://howvgvrrxcpdiqjbnhzn.supabase.co';

// Best-effort call to keep Stripe's per-client billing quantity in sync after
// a client is added, reactivated, or deactivated. No-ops safely for orgs not
// on self-serve Stripe billing. Never throws -- billing sync should never
// block or fail the action that triggered it.
//
// providerId is the client's provider (not necessarily the person calling
// this -- during client self-onboarding, the caller IS the new client, so
// there's no provider-scoped session to derive an org from).
export async function syncClientBilling(providerId) {
  try {
    if (!providerId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/functions/v1/sync-client-billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ provider_id: providerId }),
    });
  } catch {
    // Best-effort -- billing will catch up next time this runs.
  }
}
