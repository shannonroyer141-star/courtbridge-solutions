import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Called by Stripe's servers, not by app users -- there is no Supabase JWT to
// check here. Security instead comes from verifying Stripe's own webhook
// signature below (STRIPE_WEBHOOK_SECRET), which only Stripe can produce.

// Mirrors src/pricing.js -- used to identify which subscription line item is
// the per-client one (Stripe doesn't guarantee item order matches the
// Checkout line_items order, so we match on price instead).
const PER_CLIENT_UNIT_AMOUNT_CENTS = 2200;

async function stripeGet(path: string, secretKey: string) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` },
  });
  return { ok: res.ok, data: await res.json() };
}

async function stripePost(path: string, secretKey: string, params: URLSearchParams) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  return { ok: res.ok, data: await res.json() };
}

async function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time-ish compare
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text();
    const sigHeader = req.headers.get('Stripe-Signature') || '';
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!STRIPE_WEBHOOK_SECRET) {
      return new Response('Webhook not configured (missing STRIPE_WEBHOOK_SECRET)', { status: 500 });
    }

    const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      const { org_name, admin_name, admin_email, phone } = meta;

      if (!org_name || !admin_email) {
        console.error('checkout.session.completed missing required metadata', meta);
        return new Response('ok', { status: 200 }); // ack to Stripe, nothing more we can do
      }

      const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
      let clientLineItemId: string | null = null;

      if (session.subscription && STRIPE_SECRET_KEY) {
        const { ok, data: sub } = await stripeGet(`/v1/subscriptions/${session.subscription}?expand[]=items.data.price`, STRIPE_SECRET_KEY);
        if (ok) {
          const perClientItem = (sub.items?.data || []).find((it: any) => it.price?.unit_amount === PER_CLIENT_UNIT_AMOUNT_CENTS);
          clientLineItemId = perClientItem?.id || null;
        } else {
          console.error('Could not fetch subscription to find per-client line item', sub);
        }
      }

      const { data: org, error: orgError } = await supabase.from('organizations').insert({
        organization_name: org_name,
        phone: phone || null,
        plan: 'standard',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        stripe_client_line_item_id: clientLineItemId,
        subscription_status: 'active',
        billing_email: admin_email,
      }).select().single();

      if (orgError || !org) {
        console.error('Failed to create organization', orgError);
        return new Response('ok', { status: 200 });
      }

      // Checkout required a positive quantity on the per-client line, so it
      // was created at 1. A brand-new org has 0 clients -- correct it now.
      if (clientLineItemId && STRIPE_SECRET_KEY) {
        const correctParams = new URLSearchParams();
        correctParams.set('quantity', '0');
        correctParams.set('proration_behavior', 'none');
        const { ok, data } = await stripePost(`/v1/subscription_items/${clientLineItemId}`, STRIPE_SECRET_KEY, correctParams);
        if (!ok) console.error('Could not correct initial per-client quantity to 0', data);
      }

      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(admin_email, {
        data: { full_name: admin_name },
      });

      if (inviteError || !invited?.user) {
        console.error('Failed to invite admin user', inviteError);
        return new Response('ok', { status: 200 });
      }

      await supabase.from('profiles').upsert({
        id: invited.user.id,
        email: admin_email,
        full_name: admin_name,
        role: 'provider',
        organization_id: org.id,
        organization_name: org_name,
        is_org_admin: true,
        org_role: 'admin',
        phone: phone || null,
        account_status: 'active',
      });
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : (sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trialing' : sub.status === 'past_due' ? 'past_due' : 'canceled');
      await supabase.from('organizations')
        .update({ subscription_status: status })
        .eq('stripe_subscription_id', sub.id);
    }

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('stripe-webhook error', error);
    return new Response('ok', { status: 200 }); // never make Stripe retry-storm on our bugs
  }
});
