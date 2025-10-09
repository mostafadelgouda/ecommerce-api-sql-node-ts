import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id } = req.body;
        const user: any = req.user;
        const user_id = user?.user_id;

        if (!user_id) {
            return next(new ApiError(RESPONSE_MESSAGES.WISHLIST.UNAUTHORIZED, 401));
        }

        const result = await pool.query(
            `INSERT INTO wishlist_items (user_id, product_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, product_id) DO NOTHING 
             RETURNING *`,
            [user_id, product_id]
        );

        if (result.rows.length === 0) {
            return res.json({ message: RESPONSE_MESSAGES.WISHLIST.ALREADY_EXISTS });
        }

        res.status(201).json({ message: RESPONSE_MESSAGES.WISHLIST.ADDED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: any = req.user;
        const user_id = user?.user_id;

        if (!user_id) {
            return next(new ApiError(RESPONSE_MESSAGES.WISHLIST.UNAUTHORIZED, 401));
        }

        const result = await pool.query(
            `SELECT 
                w.wishlist_item_id, 
                p.product_id, 
                p.name, 
                p.price,
                i.image_url AS main_image
            FROM wishlist_items AS w
            JOIN products AS p 
                ON w.product_id = p.product_id
            JOIN product_images AS i 
                ON i.product_id = p.product_id 
                AND i.is_main = TRUE
            WHERE w.user_id = $1`,
            [user_id]
        );

        const wishlistCount = result.rows.length;

        res.json({
            message: RESPONSE_MESSAGES.WISHLIST.RETRIEVED,
            total_items: wishlistCount,
            data: result.rows,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};


export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { wishlist_item_id } = req.params;
        const user: any = req.user;
        const user_id = user?.user_id;

        if (!user_id) {
            return next(new ApiError(RESPONSE_MESSAGES.WISHLIST.UNAUTHORIZED, 401));
        }

        // Delete the item first
        const deleteResult = await pool.query(
            `DELETE FROM wishlist_items 
             WHERE user_id = $1 AND wishlist_item_id = $2 
             RETURNING *`,
            [user_id, wishlist_item_id]
        );

        if (deleteResult.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.WISHLIST.NOT_FOUND, 404));
        }

        // Fetch the updated wishlist
        const wishlistResult = await pool.query(
            `SELECT 
                w.wishlist_item_id, 
                p.product_id, 
                p.name, 
                p.price,
                i.image_url AS main_image
             FROM wishlist_items AS w
             JOIN products AS p 
                ON w.product_id = p.product_id
             JOIN product_images AS i 
                ON i.product_id = p.product_id 
                AND i.is_main = TRUE
             WHERE w.user_id = $1`,
            [user_id]
        );

        res.json({
            message: RESPONSE_MESSAGES.WISHLIST.REMOVED,
            data: wishlistResult.rows
        });

    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};


export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: any = req.user;
        const user_id = user?.user_id;

        if (!user_id) {
            return next(new ApiError(RESPONSE_MESSAGES.WISHLIST.UNAUTHORIZED, 401));
        }

        const result = await pool.query(
            `DELETE FROM wishlist_items WHERE user_id = $1 RETURNING *`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.json({ message: RESPONSE_MESSAGES.WISHLIST.ALREADY_EMPTY });
        }

        res.json({ message: RESPONSE_MESSAGES.WISHLIST.CLEARED, data: [] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};
