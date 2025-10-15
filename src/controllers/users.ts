import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { compare, hash } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { sendEmail } from "../utils/sendEmail.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password, name } = req.body;

        const existingUser = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.ACCOUNT_EXIST, 400))
        }

        const hashedPassword = await hash(password, parseInt(process.env.SALT || "10"));

        const result = await pool.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING user_id, email, name",
            [email, hashedPassword, name]
        );

        const user = result.rows[0];

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET!, {
            expiresIn: "1d",
        });

        res.status(201).json({ message: RESPONSE_MESSAGES.AUTH.SIGNUP_SUCCESS, data: { user, token } });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode))
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) return next(new ApiError(RESPONSE_MESSAGES.AUTH.INVALID_CREDINTIALS, 401));

        const validPassword = await compare(password, user.password);
        if (!validPassword) return next(new ApiError(RESPONSE_MESSAGES.AUTH.INVALID_CREDINTIALS, 401));

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET!, {
            expiresIn: "1d",
        });
        res.json({ message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, data: { user: { user_id: user.user_id, email: user.email, name: user.name }, token } });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
}
export async function loginGoogle(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user as any;
        console.log(user);
        // Extract correct email from Google data
        const email = user.email || user.emails?.[0]?.value;

        // Optional: Save user to DB if not exists (recommended)
        const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let user_id;

        if (existing.rows.length > 0) {
            user_id = existing.rows[0].user_id;
        } else {
            const inserted = await pool.query(
                "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING user_id",
                [email, user.displayName || "Google User"]
            );
            user_id = inserted.rows[0].user_id;
        }

        const token = jwt.sign(
            { user_id, email },
            process.env.JWT_SECRET!, // ✅ same secret
            { expiresIn: "1d" }
        );

        // Send to frontend
        res.redirect(`https://shop-ecommerce-one-alpha.vercel.app/home?token=${token}`);
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
}

export async function getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).user;
        const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [user.user_id]);
        const { password, ...userWithoutPassword } = result.rows[0];
        res.json({ message: RESPONSE_MESSAGES.AUTH.DETAILS_RETRIEVED, data: userWithoutPassword });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) return next(new ApiError(RESPONSE_MESSAGES.AUTH.EMAIL_REQUIRED, 400));

        const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        if (user.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.INVALID_CREDINTIALS, 401));
        }
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        await pool.query(
            `UPDATE users SET reset_code=$1, reset_expires=NOW() + INTERVAL '15 minutes' WHERE email=$2`,
            [resetCode, email]
        );

        await sendEmail(email, "Password Reset Code", `Your code is: ${resetCode}`);

        res.json({ message: RESPONSE_MESSAGES.AUTH.RESET_CODE_SENT });
    }
    catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await pool.query(
            "SELECT * FROM users WHERE email=$1 AND reset_code=$2 AND reset_expires > NOW()",
            [email, code]
        );

        if (user.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.INVALID_CODE, 400));
        }

        const bcrypt = await import("bcrypt");
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT || "10"));

        await pool.query(
            "UPDATE users SET password=$1, reset_code=NULL, reset_expires=NULL WHERE email=$2",
            [hashedPassword, email]
        );

        res.json({ message: RESPONSE_MESSAGES.AUTH.PASSWORD_CHANGED });
    }
    catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }

};

export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).user;
        const { oldPassword, newPassword } = req.body;

        const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [user.user_id]);
        const dbUser = result.rows[0];

        const isMatch = await compare(oldPassword, dbUser.password);
        if (!isMatch) return next(new ApiError(RESPONSE_MESSAGES.AUTH.OLD_PASSWORD_INCORRECT, 400));
        const hashedPassword = await hash(newPassword, parseInt(process.env.SALT || "10"));
        await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [
            hashedPassword,
            user.user_id,
        ]);

        res.json({ message: RESPONSE_MESSAGES.AUTH.PASSWORD_CHANGED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
}
