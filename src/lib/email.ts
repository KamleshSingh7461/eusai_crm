import nodemailer from 'nodemailer';

interface EmailPayload {
    to: string | string[];
    cc?: string | string[];
    subject: string;
    html: string;
}

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
};

// Check if credentials exist
const hasCredentials = !!(smtpConfig.host && smtpConfig.user && smtpConfig.pass);

const transporter = hasCredentials
    ? nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
        },
    })
    : null;

export async function sendEmail({ to, cc, subject, html }: EmailPayload): Promise<boolean> {
    const from = process.env.SMTP_USER
        ? `"EuSai Alert System" <${process.env.SMTP_USER}>`
        : '"EuSai Alert System" <alert@eusaiteam.com>';

    if (!hasCredentials || !transporter) {
        console.log(`
      [MOCK EMAIL SERVICE]
      ---------------------------------------------------
      FROM: ${from}
      TO: ${Array.isArray(to) ? to.join(', ') : to}
      ${cc ? `CC: ${Array.isArray(cc) ? cc.join(', ') : cc}` : ''}
      SUBJECT: ${subject}
      ---------------------------------------------------
      BODY:
      ${html.replace(/<[^>]*>/g, '')} 
      ---------------------------------------------------
      (End of Mock Email)
      `);
        return true;
    }

    try {
        await transporter.sendMail({
            from,
            to,
            cc,
            subject,
            html,
        });
        console.log(`[EMAIL SENT] To: ${Array.isArray(to) ? to.join(', ') : to} ${cc ? `| CC: ${Array.isArray(cc) ? cc.join(', ') : cc}` : ''} | Subject: ${subject}`);
        return true;
    } catch (error) {
        console.error('[EMAIL FAILED]', error);
        return false;
    }
}
