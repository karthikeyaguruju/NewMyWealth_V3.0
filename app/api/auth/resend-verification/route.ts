import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { Resend } from 'resend';

// Initialize Resend with the key provided
const resend = new Resend('re_VmugxcU7_N66LGqQUPEqce3dskXjTAD4n');

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
            type: 'magiclink', // Changed to magiclink for resend as we don't have the password here
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

        // 2. Send the link via Resend directly
        console.log(`Attempting to send verification email to ${email} via Resend...`);
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: 'My Wealth <onboarding@resend.dev>',
            to: email,
            subject: 'Verify your access | My Wealth',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #0f172a; font-weight: 800; font-size: 24px; margin-bottom: 16px;">Activate your Account</h2>
                    <p style="color: #64748b; font-size: 16px; line-height: 1.6;">Welcome back! Please click the button below to verify your email and activate your account.</p>
                    <div style="margin: 32px 0;">
                        <a href="${verificationLink}" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Verify Email</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Secure Protocol v4.1 | My Wealth Command Center</p>
                </div>
            `
        });

        if (resendError) {
            console.error('Resend transmission error:', resendError);
            return NextResponse.json({ error: 'Failed to transmit email' }, { status: 500 });
        }

        console.log('Verification email transmitted successfully:', resendData?.id);
        return NextResponse.json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
