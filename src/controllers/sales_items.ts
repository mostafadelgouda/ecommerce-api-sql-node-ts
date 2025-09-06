import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { getItemsWithFilters } from "../utils/filterPagination.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

// Create sale item
// Create sale item
export const createSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id, product_id, quantity, unit_price } = req.body;

        if (!order_id || !product_id || !quantity || !unit_price) {
            return next(new ApiError("All fields are required", 400));
        }

        // 1. Delete any previous sale item for this product
        await pool.query("DELETE FROM sale_items WHERE product_id = $1", [product_id]);

        // 2. Insert the new sale item
        const result = await pool.query(
            `INSERT INTO sale_items (order_id, product_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [order_id, product_id, quantity, unit_price]
        );

        res.status(201).json({
            message: RESPONSE_MESSAGES.SALE_ITEM.CREATED,
            data: result.rows[0]
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};


// Get all sale items (with pagination + filters)
export const getSaleItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, order_id, product_id } = req.query;

        const filters: Record<string, any> = {};
        if (order_id) filters.order_id = order_id;
        if (product_id) filters.product_id = product_id;

        const result = await getItemsWithFilters(
            "sale_items",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );

        res.json({
            message: RESPONSE_MESSAGES.SALE_ITEM.RETRIEVED,
            page: Number(page),
            total_items: result.number_of_items,
            limit: Number(limit),
            data: result.data
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// Get single sale item by ID
export const getSaleItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const result = await pool.query("SELECT * FROM sale_items WHERE sale_item_id = $1", [id]);
        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.SALE_ITEM.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.SALE_ITEM.FOUND, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// Update sale item
export const updateSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        if (fields.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.SALE_ITEM.NO_FIELDS, 400));
        }

        const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
        const result = await pool.query(
            `UPDATE sale_items SET ${setQuery}, updated_at = NOW() WHERE sale_item_id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.SALE_ITEM.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.SALE_ITEM.UPDATED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// Delete sale item
export const deleteSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const result = await pool.query("DELETE FROM sale_items WHERE sale_item_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.SALE_ITEM.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.SALE_ITEM.DELETED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};
