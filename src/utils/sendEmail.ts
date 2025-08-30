import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GOOGLE_EMAIL, // your Gmail address
        pass: process.env.GOOGLE_EMAIL_APP_PASSWORD, // your generated app password
    },
});

export const sendEmail = async (
    to: string,
    subject: string,
    text: string,
    html?: string
) => {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER, // must be the same as authenticated user
            to,
            subject,
            text,
            html: html || text,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error: any) {
        console.error("Error sending email:", error);

        if (error.response) {
            console.error(error.response);
        }

        throw new Error("Failed to send email");
    }
};
