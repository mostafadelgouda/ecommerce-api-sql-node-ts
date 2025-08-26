import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { genSaltSync, hashSync, compare, hash, genSalt } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import passport from "../config/passport.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/messages.js";

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



