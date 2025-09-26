import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { getItemsWithFilters } from "../utils/filterPagination.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import ApiError from "../utils/apiError.js";

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, image_url } = req.body;

        const result = await pool.query(
            "INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING *",
            [name, description, image_url]
        );

        res.status(201).json({
            message: RESPONSE_MESSAGES.CATEGORY.CREATED,
            data: result.rows[0],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const filters: Record<string, any> = {};

        const result = await getItemsWithFilters(
            "categories",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );

        res.json({
            message: RESPONSE_MESSAGES.CATEGORY.RETRIEVED,
            page: Number(page),
            total_items: result.number_of_items,
            limit: Number(limit),
            data: result.data,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM categories WHERE category_id = $1", [id]);

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND, 404));
        }

        res.json({
            message: RESPONSE_MESSAGES.CATEGORY.RETRIEVED,
            data: result.rows[0],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, image_url } = req.body;

        const result = await pool.query(
            "UPDATE categories SET name = $1, description = $2, image_url = $3 WHERE category_id = $4 RETURNING *",
            [name, description, image_url, id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND, 404));
        }

        res.json({
            message: RESPONSE_MESSAGES.CATEGORY.UPDATED,
            data: result.rows[0],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Delete the category
        const result = await pool.query(
            "DELETE FROM categories WHERE category_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND, 404));
        }

        // Fetch remaining categories
        const remainingCategories = await pool.query(
            "SELECT * FROM categories ORDER BY created_at DESC"
        );

        res.json({
            message: RESPONSE_MESSAGES.CATEGORY.DELETED,
            data: remainingCategories.rows,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};