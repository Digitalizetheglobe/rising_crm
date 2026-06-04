import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import { logger } from '../config/logger';

interface MailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}

const transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
    },
});

export const sendMail = async (options: MailOptions): Promise<void> => {
    try {
        await transporter.sendMail({
            from: `"Rising Spaces CRM" <${ENV.SMTP_USER}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
        logger.info(`Email sent to ${options.to}`);
    } catch (error) {
        logger.error('Email sending failed:', error);
    }
};