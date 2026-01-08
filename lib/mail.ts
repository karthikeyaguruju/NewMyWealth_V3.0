import nodemailer from 'nodemailer';

// This utility uses Gmail SMTP which allows sending to ANY email address free of charge.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'webdev16.contact@gmail.com',
        // USING THE NEW SECURE APP PASSWORD
        pass: 'hdfmgjsohwqpwxsv',
    },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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
