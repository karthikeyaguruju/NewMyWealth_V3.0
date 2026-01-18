export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return null;
    }
    return user;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { summary, monthName, year } = body;

        if (!summary) {
            return NextResponse.json({ error: 'Summary data is required' }, { status: 400 });
        }

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Monthly Wealth Report</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c111d; color: #ffffff; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #141b2b; border-radius: 16px; overflow: hidden; border: 1px solid #2d3748;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">${monthName} ${year} Summary</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Your Monthly Wealth Report Card</p>
        </div>

        <!-- Main Stats -->
        <div style="padding: 30px 20px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 12px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Income</p>
                    <p style="margin: 5px 0 0; color: #10b981; font-size: 20px; font-weight: 700;">₹${summary.totalIncome.toLocaleString()}</p>
                </div>
                <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 12px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Expenses</p>
                    <p style="margin: 5px 0 0; color: #ef4444; font-size: 20px; font-weight: 700;">₹${summary.totalExpenses.toLocaleString()}</p>
                </div>
            </div>

            <div style="background: linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.2);">
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">Total Savings & Investments</p>
                <p style="margin: 5px 0 0; color: #10b981; font-size: 32px; font-weight: 800;">₹${(summary.totalIncome - summary.totalExpenses).toLocaleString()}</p>
            </div>

            <h3 style="border-bottom: 1px solid #2d3748; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">Top Categories</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(summary.categoryBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([name, amount]) => `
                    <tr>
                        <td style="padding: 10px 0; color: #cbd5e1;">${name}</td>
                        <td style="padding: 10px 0; text-align: right; color: #ffffff; font-weight: 600;">₹${(amount as number).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <!-- Footer -->
        <div style="background-color: #0c111d; padding: 20px; text-align: center; border-top: 1px solid #2d3748;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">© 2026 My Wealth | Tracking Smarter, Growing Faster</p>
        </div>
    </div>
</body>
</html>
        `;

        const { success, error: mailError } = await sendEmail({
            to: user.email!,
            subject: `📊 Your Wealth Summary for ${monthName} ${year}`,
            html: emailHtml
        });

        if (!success) {
            return NextResponse.json({ error: mailError || 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Report sent successfully' });
    } catch (error) {
        console.error('Send report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
