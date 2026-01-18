import nodemailer from 'nodemailer';

// This utility uses Gmail SMTP which allows sending to ANY email address free of charge.
const GMAIL_USER = 'webdev16.contact@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        // USING THE SECURE APP PASSWORD FROM ENVIRONMENT VARIABLES
        pass: GMAIL_PASS,
    },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!GMAIL_PASS) {
        console.error('Email Error: GMAIL_APP_PASSWORD is not defined in .env file.');
        return {
            success: false,
            error: 'Email configuration error: Missing GMAIL_APP_PASSWORD in environment variables.'
        };
    }

    try {
        const mailOptions = {
            from: '"My Wealth Support" <webdev16.contact@gmail.com>',
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error('Nodemailer Error:', error);
        return { success: false, error };
    }
}
