import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseService = getServiceSupabase();

        // 1. Generate the signup/verification link manually
        const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${new URL(request.url).origin}/login`
            }
        });

        if (linkError) {
            console.error('Link generation error:', linkError.message);
            return NextResponse.json({ error: linkError.message }, { status: 400 });
        }

        const verificationLink = linkData.properties.action_link;
        console.log('Verification link generated successfully');

        // 2. Send the link via Nodemailer (Gmail)
        console.log(`Attempting to send verification email to ${email} via Nodemailer...`);
        const { success, error: mailError } = await sendEmail({
            to: email,
            subject: 'Verify your access | My Wealth',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Email</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:56px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px; background-color:#ffffff; border-radius:16px; box-shadow:0 20px 40px rgba(15,23,42,0.12); overflow:hidden;">
        <tr>
          <td style="padding:32px 40px; background:linear-gradient(135deg,#020617,#1e293b); color:#ffffff;">
            <table width="100%" role="presentation">
              <tr>
                <td style="font-size:22px; font-weight:700; letter-spacing:0.4px;">My Wealth</td>
                <td align="right" style="font-size:13px; opacity:0.85;">Account Verification</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px 44px;">
            <div style="text-align:center; padding-bottom:28px;">
              <div style="width:64px; height:64px; background:linear-gradient(135deg,#e0e7ff,#eef2ff); border-radius:50%; line-height:64px; display:inline-block;">
                <span style="font-size:28px;">🔐</span>
              </div>
            </div>
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; text-align:center; color:#020617;">Activate your account</h1>
            <p style="margin:0 0 20px; font-size:16px; line-height:1.7; text-align:center; color:#334155;">Please confirm your email address to activate your account and keep your financial data secure.</p>
            <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${verificationLink}" style="display:inline-block; padding:16px 44px; background:linear-gradient(135deg,#2563eb,#1e40af); color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; border-radius:999px; box-shadow:0 10px 24px rgba(37,99,235,0.45);">Confirm Email</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
            `
        });

        if (!success) {
            console.error('Nodemailer transmission error:', mailError);
            return NextResponse.json({ error: 'Failed to transmit email' }, { status: 500 });
        }

        console.log('Verification email transmitted successfully');
        return NextResponse.json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
