import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { client_name, client_email, program_type, provider_name, organization_name, invite_token, message } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = 'noreply@interventionconnect.com';
    const APP_URL = Deno.env.get('APP_URL') || 'https://courtbridge-solutions.vercel.app';

    const providerDisplayName = provider_name || organization_name || 'your provider';

    const signup_link = `${APP_URL}/enroll?token=${invite_token}`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `CourtBridge Solutions <${FROM_EMAIL}>`,
        to: [client_email],
        subject: `${organization_name || 'Your Provider'} has invited you to CourtBridge Solutions`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border-left: 4px solid #1B3A6B; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="color: #1B3A6B; margin: 0;">CourtBridge Solutions</h2>
              <p style="color: #666; margin: 4px 0 0; font-size: 13px;">Compliance Tracking Platform</p>
            </div>
            <h3 style="color: #333;">Hi ${client_name},</h3>
            <p style="color: #444; line-height: 1.7;">You have been invited by <strong>${providerDisplayName}</strong> to use CourtBridge Solutions to track your compliance requirements${program_type ? ` for your <strong>${program_type}</strong> program` : ''}.</p>
            ${message ? `<p style="color: #444; line-height: 1.7; background: #f4f6f9; padding: 14px; border-radius: 8px;">${message}</p>` : ''}
            <p style="color: #444; line-height: 1.7;">CourtBridge Solutions allows you to:</p>
            <ul style="color: #444; line-height: 1.9;">
              <li>Check in from your phone with GPS verification</li>
              <li>Log required meetings and PO visits</li>
              <li>See your upcoming court dates and compliance status</li>
              <li>Build a record of proof that you are completing your requirements</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${signup_link}" style="background: #1B3A6B; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">Create Your Account</a>
            </div>
            <p style="color: #888; font-size: 13px;">This link was sent by ${organization_name || 'your provider'}. If you have questions, contact them directly.</p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
              CourtBridge Solutions — Verified. Connected. Accountable.
            </div>
          </div>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('invites').update({ accepted: false, expires_at }).eq('token', invite_token);

    if (!resendResponse.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
