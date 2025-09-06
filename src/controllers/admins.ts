import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { compare, hash } from "bcrypt-ts";
import jwt, { type SignOptions } from "jsonwebtoken";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password, name } = req.body;

        const existingUser = await pool.query("SELECT admin_id FROM admins WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.ACCOUNT_EXIST, 400));
        }

        const hashedPassword = await hash(password, parseInt(process.env.SALT || "10"));

        const result = await pool.query(
            "INSERT INTO admins (email, password, name, permissions) VALUES ($1, $2, $3, $4) RETURNING admin_id, email, name, permissions",
            [email, hashedPassword, name, "admin"]
        );

        const user = result.rows[0];
        const expireIn: SignOptions["expiresIn"] = (process.env.ADMIN_TOKEN_EXPIRE_IN as SignOptions["expiresIn"]) || "1d";

        const token = jwt.sign(
            { id: user.admin_id, email: user.email, role: user.permissions },
            process.env.JWT_SECRET!,
            { expiresIn: expireIn }
        );

        res.status(201).json({
            message: RESPONSE_MESSAGES.AUTH.SIGNUP_SUCCESS,
            data: { user, token }
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.INVALID_CREDINTIALS, 401));
        }

        const validPassword = await compare(password, user.password);
        if (!validPassword) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.INVALID_CREDINTIALS, 401));
        }

        const token = jwt.sign(
            { id: user.admin_id, email: user.email, role: user.permissions },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );

        res.json({
            message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS,
            data: {
                user: { id: user.admin_id, email: user.email, name: user.name, role: user.permissions },
                token
            }
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
}

export async function getAdminDetails(req: Request, res: Response, next: NextFunction) {
    try {
        // Ensure middleware set user from JWT
        const adminId = (req as any).user?.id;

        if (!adminId) {
            return next(new ApiError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401));
        }

        const result = await pool.query(
            "SELECT admin_id, email, name, permissions, created_at FROM admins WHERE admin_id = $1",
            [adminId]
        );

        const admin = result.rows[0];

        res.json({
            message: RESPONSE_MESSAGES.AUTH.DETAILS_RETRIEVED,
            data: admin
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
}
