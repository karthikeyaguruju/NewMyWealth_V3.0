export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { signupSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, password } = validation.data;
    const supabaseService = getServiceSupabase();
    console.log(`Starting Signup process for: ${email}`);

    // 1. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error('Supabase Admin CreateUser Error:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      console.error('User creation returned empty data');
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }
    console.log(`User created successfully in Auth: ${user.id}`);

    // 2. Generate the verification link manually
    const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        redirectTo: `${new URL(request.url).origin}/login`
      }
    });

    if (!linkError && linkData?.properties?.action_link) {
      const verificationLink = linkData.properties.action_link;
      console.log('Signup verification link generated successfully.');

      // 3. Send the link via Nodemailer (Gmail)
      console.log(`Transmitting Welcome email to ${email} via Nodemailer...`);
      const { success, error: mailError } = await sendEmail({
        to: email,
        subject: 'Activate your My Wealth account and start tracking smarter',
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Email</title>
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
  Confirm your email to activate your My Wealth account.
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
                  Account Verification
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
                    background:linear-gradient(135deg,#e0e7ff,#eef2ff);
                    border-radius:50%;
                    line-height:64px;
                    text-align:center;
                  ">
                    <span style="font-size:28px;">🔐</span>
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
              Verify your email address
            </h1>

            <p style="
              margin:0 0 20px;
              font-size:16px;
              line-height:1.7;
              text-align:center;
              color:#334155;
            ">
              Thanks for joining <strong>My Wealth</strong>.
              Please confirm your email address to activate your account and keep your financial data secure.
            </p>

            <p style="
              margin:0 0 36px;
              font-size:14px;
              line-height:1.6;
              text-align:center;
              color:#475569;
            ">
              This verification link will expire automatically for your security.
            </p>

            <!-- Primary CTA (Single Link) -->
            <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${verificationLink}"
                    style="
                      display:inline-block;
                      padding:16px 44px;
                      background:linear-gradient(135deg,#2563eb,#1e40af);
                      color:#ffffff;
                      text-decoration:none;
                      font-size:16px;
                      font-weight:700;
                      border-radius:999px;
                      box-shadow:0 10px 24px rgba(37,99,235,0.45);
                    ">
                    Confirm Email
                  </a>
                </td>
              </tr>
            </table>

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
              If you did not create a My Wealth account, no action is required.
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
        console.error('Signup Email transmission error:', mailError);
      } else {
        console.log('Signup Welcome email transmitted successfully');
      }
    } else {
      console.error('Signup link generation failed:', linkError?.message);
    }

    // 4. Create Profile
    const { error: profileError } = await supabaseService
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // 5. Seed default categories
    const defaultCategories = [
      // Income
      { name: 'Salary', category_group: 'Income', is_default: true, user_id: user.id },
      { name: 'Freelancing', category_group: 'Income', is_default: true, user_id: user.id },
      { name: 'Investment Returns', category_group: 'Income', is_default: true, user_id: user.id },

      // Expense
      { name: 'Rent', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Groceries', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Utilities', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Entertainment', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Transportation', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Healthcare', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Insurance', category_group: 'Expense', is_default: true, user_id: user.id },
      { name: 'Investment Out', category_group: 'Expense', is_default: true, user_id: user.id },

      // Investment
      { name: 'Stocks', category_group: 'Investment', is_default: true, user_id: user.id },
      { name: 'Mutual Funds', category_group: 'Investment', is_default: true, user_id: user.id },
      { name: 'Real Estate', category_group: 'Investment', is_default: true, user_id: user.id },
      { name: 'Crypto', category_group: 'Investment', is_default: true, user_id: user.id },
      { name: 'Gold', category_group: 'Investment', is_default: true, user_id: user.id },
      { name: 'Bonds', category_group: 'Investment', is_default: true, user_id: user.id },
      { name: 'Fixed Deposits', category_group: 'Investment', is_default: true, user_id: user.id },
    ];

    const { error: categoryError } = await supabaseService
      .from('categories')
      .insert(defaultCategories);

    if (categoryError) {
      console.error('Category seeding error:', categoryError);
    }

    return NextResponse.json(
      { message: 'User created successfully. Verification email sent.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
