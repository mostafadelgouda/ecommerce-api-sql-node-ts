import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { RESPONSE_MESSAGES } from "../constants/messages.js";

// CREATE review
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id } = req.params;
        const { rating, comment } = req.body;
        const user = (req as any).user;
        if (!rating) return res.status(400).json({ message: "Rating is required" });

        const result = await pool.query(
            `INSERT INTO reviews (product_id, user_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [product_id, user.user_id, rating, comment]
        );

        res.status(201).json({
            message: RESPONSE_MESSAGES.REVIEW.CREATED,
            data: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

// READ all reviews for a product
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id } = req.params;

        const result = await pool.query(
            `SELECT r.review_id, r.rating, r.comment, r.created_at, u.name
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC`,
            [product_id]
        );

        res.json({
            message: RESPONSE_MESSAGES.REVIEW.RETRIEVED,
            total: result.rows.length,
            data: result.rows,
        });
    } catch (err) {
        next(err);
    }
};

// UPDATE review
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { review_id } = req.params;
        const { rating, comment } = req.body;
        const user = (req as any).user;
        const result = await pool.query(
            `UPDATE reviews
             SET rating = $1, comment = $2
             WHERE review_id = $3 AND user_id = $4
             RETURNING *`,
            [rating, comment, review_id, user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Review not found or not authorized" });
        }

        res.json({
            message: RESPONSE_MESSAGES.REVIEW.UPDATED,
            data: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

// DELETE review
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { review_id } = req.params;
        const user = (req as any).user;
        const result = await pool.query(
            `DELETE FROM reviews
             WHERE review_id = $1 AND user_id = $2
             RETURNING *`,
            [review_id, user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Review not found or not authorized" });
        }

        res.json({ message: RESPONSE_MESSAGES.REVIEW.DELETED });
    } catch (err) {
        next(err);
    }
};
