import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";

export async function getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.status(200).json({ message: "data retrieved successfully", data: result.rows });
    } catch (err) {
        return next(new ApiError("Couldn't get all categories", 401));
    }
}
