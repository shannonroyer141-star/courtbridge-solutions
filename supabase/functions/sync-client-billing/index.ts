import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Keeps a Stripe subscription's per-client line item quantity matched to an
// org's real active-client count. Call this after any client is added,
// reactivated, or deactivated. Safe to call even for orgs not on self-serve
// Stripe billing (manually-created orgs) -- it just no-ops.
//
// Takes a provider_id and resolves that provider's org itself (rather than
// trusting the caller's own session to already belong to that org) -- the
// client-onboarding flow calls this from the BRAND NEW CLIENT's own session
// right after signup, not the provider's, so there's no provider-scoped JWT
// available at that point. This is safe to trust regardless of who's asking:
// the function only ever pushes Stripe's quantity to match what's *actually*
// in the database for that org -- a caller can't inflate or fake the number,
// at most they can trigger a harmless resync-to-the-truth for some org.
//
// Whether a mid-cycle quantity change should prorate a charge is an open
// business decision (see CourtBridge_Locked_Pricing_Model.docx, "still to
// decide"). This uses proration_behavior=none for now, meaning a quantity
// change only affects the *next* invoice, not the current one -- change that
// once Shannon decides how mid-month enrollment should actually bill.

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { provider_id } = await req.json();
    if (!provider_id) throw new Error('provider_id is required.');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: providerProfile } = await admin.from('profiles').select('organization_id').eq('id', provider_id).single();
    const organizationId = providerProfile?.organization_id;
    if (!organizationId) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_organization' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: org } = await admin.from('organizations')
      .select('stripe_subscription_id, stripe_client_line_item_id')
      .eq('id', organizationId).single();

    if (!org?.stripe_client_line_item_id) {
      return new Response(JSON.stringify({ success: true, skipped: 'not_on_stripe_billing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: orgProviders } = await admin.from('profiles').select('id').eq('organization_id', organizationId);
    const providerIds = (orgProviders || []).map((p: any) => p.id);

    let activeClientCount = 0;
    if (providerIds.length > 0) {
      const { count } = await admin.from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('provider_id', providerIds);
      activeClientCount = count || 0;
    }

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) throw new Error('Stripe is not configured yet.');

    const params = new URLSearchParams();
    params.set('quantity', String(activeClientCount));
    params.set('proration_behavior', 'none');

    const stripeResponse = await fetch(`https://api.stripe.com/v1/subscription_items/${org.stripe_client_line_item_id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const stripeData = await stripeResponse.json();
    if (!stripeResponse.ok) throw new Error(`Stripe error: ${stripeData.error?.message || JSON.stringify(stripeData)}`);

    return new Response(JSON.stringify({ success: true, activeClientCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
