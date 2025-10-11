import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id } = req.params;
        const { rating, comment } = req.body;
        const user = (req as any).user;

        if (!rating) return next(new ApiError(RESPONSE_MESSAGES.REVIEW.RATING_REQUIRED, 400));

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
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id } = req.params;
        const currentUserId = req.body.user_id || null;
        console.log(currentUserId);
        const result = await pool.query(
            `SELECT 
                r.review_id, 
                r.rating, 
                r.comment, 
                r.created_at, 
                u.name,
                CASE 
                    WHEN r.user_id = $2 THEN true 
                    ELSE false 
                END AS is_current_user
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC`,
            [product_id, currentUserId]
        );

        res.json({
            message: RESPONSE_MESSAGES.REVIEW.RETRIEVED,
            total: result.rows.length,
            data: result.rows,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};


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
            return next(new ApiError(RESPONSE_MESSAGES.REVIEW.NOT_FOUND_OR_UNAUTHORIZED, 404));
        }

        res.json({
            message: RESPONSE_MESSAGES.REVIEW.UPDATED,
            data: result.rows[0],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

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
            return next(new ApiError(RESPONSE_MESSAGES.REVIEW.NOT_FOUND_OR_UNAUTHORIZED, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.REVIEW.DELETED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};
