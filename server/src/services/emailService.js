
import { Resend } from 'resend';

export const sendVerificationEmail = async (to, verificationUrl) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured.');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
        from: 'TutorHub <onboarding@resend.dev>',
        to: [to],
        subject: 'Verify your new TutorHub email address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Verify your new email address</h2>
                <p>You requested to change the email address associated with your TutorHub account.</p>
                <p>Click the button below to verify your new email address:</p>
                <a href="${verificationUrl}"
                   style="display: inline-block; padding: 12px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                    Verify Email
                </a>
                <p>This link will expire after 30 minutes.</p>
                <p>If you did not request this change, you can ignore this email.</p>
            </div>
        `,
        text: `Verify your new TutorHub email address by visiting: ${verificationUrl}`
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
