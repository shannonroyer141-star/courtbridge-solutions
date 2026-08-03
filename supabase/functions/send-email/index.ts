import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to_email, to_name, subject, body, client_id, message_type } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@interventionconnect.com';
    const FROM_NAME = Deno.env.get('FROM_NAME') || 'CourtBridge Solutions';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured. Please add it in Supabase Edge Function secrets.');
    }

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to_email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border-left: 4px solid #1B3A6B; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="color: #1B3A6B; margin: 0;">CourtBridge Solutions</h2>
              <p style="color: #666; margin: 4px 0 0; font-size: 13px;">Compliance Communication</p>
            </div>
            <div style="color: #333; line-height: 1.7; font-size: 15px;">
              ${body.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
              This message was sent through CourtBridge Solutions compliance tracking platform.
            </div>
          </div>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    // Save to Supabase messages table
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('messages').insert([{
      client_id,
      provider_id: user?.id,
      to_email,
      to_name,
      subject,
      body,
      message_type: message_type || 'general',
      delivered: resendResponse.ok,
      delivery_error: resendResponse.ok ? null : JSON.stringify(resendData),
      sent_at: new Date().toISOString(),
    }]);

    if (!resendResponse.ok) {
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
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
