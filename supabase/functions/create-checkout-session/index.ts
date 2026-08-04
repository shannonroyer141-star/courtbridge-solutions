import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Mirrors src/pricing.js in the app repo -- keep these numbers in sync.
// Flat monthly platform fee + a per-active-client rate. Stripe Checkout won't
// accept a line item quantity of 0, so the per-client line starts at 1 here
// and stripe-webhook corrects it down to the org's real client count (0 for a
// brand-new org) right after checkout completes. sync-client-billing keeps it
// in sync from then on as clients are added or deactivated.
const PRICING = {
  flatMonthlyCents: 19900,
  perClientMonthlyCents: 2200,
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { org_name, admin_name, admin_email, phone } = await req.json();

    if (!org_name?.trim()) throw new Error('Organization name is required.');
    if (!admin_name?.trim()) throw new Error('Your name is required.');
    if (!admin_email?.trim() || !admin_email.includes('@')) throw new Error('A valid email is required.');

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured yet. Add STRIPE_SECRET_KEY in Supabase Edge Function secrets.');
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.courtbridgesolutions.com';

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer_email', admin_email);
    params.set('success_url', `${siteUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${siteUrl}/signup`);

    // Line 0: flat platform fee, quantity 1.
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(PRICING.flatMonthlyCents));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][product_data][name]', 'CourtBridge Solutions -- Platform Fee');

    // Line 1: per-client rate. Quantity 1 here is a placeholder -- Checkout
    // requires a positive quantity; stripe-webhook sets the real number right after.
    params.set('line_items[1][quantity]', '1');
    params.set('line_items[1][price_data][currency]', 'usd');
    params.set('line_items[1][price_data][unit_amount]', String(PRICING.perClientMonthlyCents));
    params.set('line_items[1][price_data][recurring][interval]', 'month');
    params.set('line_items[1][price_data][product_data][name]', 'CourtBridge Solutions -- Per Active Client');

    params.set('metadata[org_name]', org_name.trim());
    params.set('metadata[admin_name]', admin_name.trim());
    params.set('metadata[admin_email]', admin_email.trim());
    params.set('metadata[phone]', phone?.trim() || '');
    // Subscription-level metadata too, so the webhook's subscription.updated
    // events (which don't include the Checkout Session) can still find the org.
    params.set('subscription_data[metadata][org_name]', org_name.trim());

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const stripeData = await stripeResponse.json();
    if (!stripeResponse.ok) {
      throw new Error(`Stripe error: ${stripeData.error?.message || JSON.stringify(stripeData)}`);
    }

    return new Response(JSON.stringify({ success: true, url: stripeData.url }), {
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
