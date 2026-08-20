import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { staff_email, staff_name, invited_by_name, organization_name, invite_token, org_role_label } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = 'noreply@interventionconnect.com';
    const APP_URL = Deno.env.get('APP_URL') || 'https://courtbridge-solutions.vercel.app';

    const inviterDisplayName = invited_by_name || organization_name || 'Your team';
    const signup_link = `${APP_URL}/join-staff?token=${invite_token}`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `CourtBridge Solutions <${FROM_EMAIL}>`,
        to: [staff_email],
        subject: `${inviterDisplayName} has invited you to join ${organization_name || 'their team'} on CourtBridge Solutions`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border-left: 4px solid #1B3A6B; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="color: #1B3A6B; margin: 0;">CourtBridge Solutions</h2>
              <p style="color: #666; margin: 4px 0 0; font-size: 13px;">Specialty Court Compliance Platform</p>
            </div>
            <h3 style="color: #333;">Hi ${staff_name || 'there'},</h3>
            <p style="color: #444; line-height: 1.7;"><strong>${inviterDisplayName}</strong> has invited you to join <strong>${organization_name || 'their organization'}</strong> on CourtBridge Solutions${org_role_label ? ` as a <strong>${org_role_label}</strong>` : ''}.</p>
            <p style="color: #444; line-height: 1.7;">Click below to set up your account and get started.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${signup_link}" style="background: #1B3A6B; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">Create Your Account</a>
            </div>
            <p style="color: #888; font-size: 13px;">This invite was sent by ${inviterDisplayName}. If you weren't expecting this, you can safely ignore this email.</p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
              CourtBridge Solutions
            </div>
          </div>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('staff_invites').update({ expires_at }).eq('token', invite_token);

    if (!resendResponse.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
