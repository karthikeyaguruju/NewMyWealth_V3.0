import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            console.log('Forgot password request: Email is missing.');
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseService = getServiceSupabase();
        console.log(`Starting Password Recovery for: ${email}`);

        // 1. Generate the recovery link manually
        console.log('Attempting to generate recovery link...');
        const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${new URL(request.url).origin}/reset-password`
            }
        });

        if (linkError) {
            console.error('Recovery link generation error:', linkError.message);
            return NextResponse.json({ error: linkError.message }, { status: 400 });
        }

        const recoveryLink = linkData.properties.action_link;
        console.log('Recovery link generated successfully.');

        // 2. Send the link via Nodemailer (Gmail)
        console.log(`Transmitting Recovery email to ${email} via Nodemailer...`);
        const { success, error: mailError } = await sendEmail({
            to: email,
            subject: 'Password reset requested for your My Wealth account',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#eef2f7;
  font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  color:#0f172a;
">

<!-- Preheader (hidden preview text) -->
<div style="
  display:none;
  max-height:0;
  overflow:hidden;
  opacity:0;
  font-size:1px;
  line-height:1px;
">
  Reset your My Wealth password securely.
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:56px 16px;">

      <!-- Card Container -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="
          max-width:640px;
          background-color:#ffffff;
          border-radius:16px;
          box-shadow:0 20px 40px rgba(15,23,42,0.12);
          overflow:hidden;
        ">

        <!-- Header -->
        <tr>
          <td style="
            padding:32px 40px;
            background:linear-gradient(135deg,#020617,#1e293b);
            color:#ffffff;
          ">
            <table width="100%" role="presentation">
              <tr>
                <td style="font-size:22px; font-weight:700; letter-spacing:0.4px;">
                  My Wealth
                </td>
                <td align="right" style="font-size:13px; opacity:0.85;">
                  Password Reset
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:48px 40px 44px;">

            <!-- Icon -->
            <table width="100%" role="presentation">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <div style="
                    width:64px;
                    height:64px;
                    background:linear-gradient(135deg,#fee2e2,#fecaca);
                    border-radius:50%;
                    line-height:64px;
                    text-align:center;
                  ">
                    <span style="font-size:28px;">🔑</span>
                  </div>
                </td>
              </tr>
            </table>

            <h1 style="
              margin:0 0 16px;
              font-size:24px;
              font-weight:800;
              text-align:center;
              color:#020617;
            ">
              Reset your password
            </h1>

            <p style="
              margin:0 0 20px;
              font-size:16px;
              line-height:1.7;
              text-align:center;
              color:#334155;
            ">
              We received a request to reset the password for your
              <strong>My Wealth</strong> account.
            </p>

            <p style="
              margin:0 0 36px;
              font-size:14px;
              line-height:1.6;
              text-align:center;
              color:#475569;
            ">
              Click the button below to create a new password.  
              If you didn’t request this, you can safely ignore this email.
            </p>

            <!-- Primary CTA (Single Link) -->
            <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${recoveryLink}"
                    style="
                      display:inline-block;
                      padding:16px 44px;
                      background:linear-gradient(135deg,#dc2626,#b91c1c);
                      color:#ffffff;
                      text-decoration:none;
                      font-size:16px;
                      font-weight:700;
                      border-radius:999px;
                      box-shadow:0 10px 24px rgba(220,38,38,0.45);
                    ">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="
              margin:28px 0 0;
              font-size:13px;
              line-height:1.6;
              text-align:center;
              color:#64748b;
            ">
              This password reset link will expire automatically for your security.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="
            padding:28px 40px;
            background-color:#f8fafc;
            text-align:center;
            font-size:12px;
            color:#64748b;
          ">
            <p style="margin:0 0 10px;">
              If you did not request a password reset, no action is required.
            </p>
            <p style="margin:0;">
              © 2026 My Wealth · Secure · Private · Reliable
            </p>
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
            console.error('Recovery Email transmission error:', mailError);
            return NextResponse.json({ error: 'Failed to transmit email' }, { status: 500 });
        }

        console.log('Recovery email transmitted successfully');
        return NextResponse.json({ message: 'Magic link transmitted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
