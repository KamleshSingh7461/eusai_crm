import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use 'smtp.gmail.com'
    auth: {
        user: process.env.EMAIL_USER || 'eusai.crm@gmail.com', // Placeholder
        pass: process.env.EMAIL_PASS || 'app-password-here'
    }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: '"EUSAI CRM Team" <no-reply@eusai.com>',
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
