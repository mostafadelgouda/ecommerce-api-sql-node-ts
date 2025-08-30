import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { genSaltSync, hashSync, compare, hash, genSalt } from "bcrypt-ts";
import jwt, { type SignOptions } from "jsonwebtoken";
import passport from "../config/passport.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password, name } = req.body;

        // 1. Check if email already exists
        const existingUser = await pool.query("SELECT admin_id FROM admins WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // 2. Hash password
        const hashedPassword = await hash(password, parseInt(process.env.SALT || "10"));

        // 3. Insert new user
        const result = await pool.query(
            "INSERT INTO admins (email, password, name, permissions) VALUES ($1, $2, $3, $4) RETURNING admin_id, email, name",
            [email, hashedPassword, name, "admin"]
        );

        const user = result.rows[0];
        const expireIn: SignOptions["expiresIn"] = (process.env.ADMIN_TOKEN_EXPIRE_IN as SignOptions["expiresIn"]) || "1d";
        const token = jwt.sign({ id: user.admin_id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: expireIn });
        res.status(201).json({ user, token });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        console.log("start");

        const { email, password } = req.body;
        console.log(email, password);
        const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
        console.log("end")
        const user = result.rows[0];

        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const validPassword = await compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });
        //console.log("__________________DSJDLjadsladsjkldaslk")
        const token = jwt.sign({ id: user.admin_id, email: user.email, role: user.permissions }, process.env.JWT_SECRET!, {
            expiresIn: "1d",
        });

        res.json({ user: { id: user.admin_id, email: user.email, name: user.name }, token });
    } catch (err) {
        next(err);
    }
}



