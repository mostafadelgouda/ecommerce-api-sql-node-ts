import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    try {
        const msg = {
            to,
            from: process.env.SENDGRID_FROM_EMAIL as string, // Your verified sender email
            subject,
            text,
            html: html || text,
        };

        await sgMail.send(msg);
        console.log("Email sent successfully");
    } catch (error: any) {
        console.error("Error sending email:", error);

        if (error.response) {
            console.error(error.response.body);
        }

        throw new Error("Failed to send email");
    }
};