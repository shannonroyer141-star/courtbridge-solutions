import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Mirrors src/pricing.js in the app repo -- keep these numbers in sync.
// Server-side authoritative pricing: the frontend just tells us which tier
// was picked, we look up the real price here so a client can't tamper with it.
const PLAN_TIERS: Record<string, { name: string; priceMonthly: number }> = {
  starter: { name: 'CourtBridge Starter', priceMonthly: 9900 },
  growth: { name: 'CourtBridge Growth', priceMonthly: 24900 },
  agency: { name: 'CourtBridge Agency', priceMonthly: 49900 },
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
    const { tier, org_name, admin_name, admin_email, phone } = await req.json();

    const plan = PLAN_TIERS[tier];
    if (!plan) throw new Error('Unknown plan tier.');
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
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(plan.priceMonthly));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][product_data][name]', plan.name);
    params.set('metadata[tier]', tier);
    params.set('metadata[org_name]', org_name.trim());
    params.set('metadata[admin_name]', admin_name.trim());
    params.set('metadata[admin_email]', admin_email.trim());
    params.set('metadata[phone]', phone?.trim() || '');
    // Subscription-level metadata too, so the webhook's subscription.updated
    // events (which don't include the Checkout Session) can still find the org.
    params.set('subscription_data[metadata][tier]', tier);
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
