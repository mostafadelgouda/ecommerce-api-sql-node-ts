import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { genSaltSync, hashSync, compare, hash, genSalt } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import passport from "../config/passport.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/messages.js";
import { sendEmail } from "../utils/sendEmail.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password, name } = req.body;

        // 1. Check if email already exists
        const existingUser = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // 2. Hash password
        const hashedPassword = await hash(password, parseInt(process.env.SALT || "10"));

        // 3. Insert new user
        const result = await pool.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING user_id, email, name",
            [email, hashedPassword, name]
        );

        const user = result.rows[0];

        // 4. Create token
        const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET!, {
            expiresIn: "1d",
        });



        res.status(201).json({ user, token });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const validPassword = await compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET!, {
            expiresIn: "1d",
        });

        res.json({ user: { user_id: user.user_id, email: user.email, name: user.name }, token });
    } catch (err) {
        next(err);
    }
}

export async function getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).user;
        const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [user.user_id]);
        const { password, ...userWithoutPassword } = result.rows[0];
        res.json({ message: "User data retrieved successfully", data: userWithoutPassword });
    } catch (err) {
        next(err);
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    // Generate code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

    // Save code with expiry (e.g., 15 min)
    await pool.query(
        `UPDATE users SET reset_code=$1, reset_expires=NOW() + INTERVAL '15 minutes' WHERE email=$2`,
        [resetCode, email]
    );

    // Send email
    await sendEmail(email, "Password Reset Code", `Your code is: ${resetCode}`);

    res.json({ message: "Reset code sent to email" });
};

// Step 2: Reset password
export const resetPassword = async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    const user = await pool.query(
        "SELECT * FROM users WHERE email=$1 AND reset_code=$2 AND reset_expires > NOW()",
        [email, code]
    );

    if (user.rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Hash password (use bcrypt)
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT || "10"));

    await pool.query(
        "UPDATE users SET password=$1, reset_code=NULL, reset_expires=NULL WHERE email=$2",
        [hashedPassword, email]
    );

    res.json({ message: "Password reset successfully" });
};

export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).user;
        const { oldPassword, newPassword } = req.body;

        // 1. Fetch user
        const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [user.user_id]);
        const dbUser = result.rows[0];

        if (!dbUser) return res.status(404).json({ message: "User not found" });

        // 2. Check old password
        const isMatch = await compare(oldPassword, dbUser.password);
        if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

        // 3. Hash new password
        const hashedPassword = await hash(newPassword, parseInt(process.env.SALT || "10"));

        // 4. Update password
        await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [
            hashedPassword,
            user.user_id,
        ]);

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        next(err);
    }
}