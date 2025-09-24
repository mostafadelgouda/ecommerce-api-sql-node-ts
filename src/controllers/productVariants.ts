import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { size, color, stock } = req.body;
        const product_id = req.params.productId;

        if (!size || !color) {
            return next(new ApiError(RESPONSE_MESSAGES.VARIANT.MISSING_FIELDS, 400));
        }

        const result = await pool.query(
            `INSERT INTO product_variants (product_id, size, color, stock, sold)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [product_id, size, color, stock || 0, 0]
        );

        res.status(201).json({ message: RESPONSE_MESSAGES.VARIANT.CREATED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getVariantsByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        const query = `
      SELECT
        v.*,
        vimg.image_url AS main_image
      FROM product_variants v
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM variant_images vi
        WHERE vi.variant_id = v.variant_id AND vi.is_main = true
        LIMIT 1
      ) vimg ON TRUE
      WHERE v.product_id = $1
      ORDER BY v.created_at ASC
    `;

        const result = await pool.query(query, [productId]);

        res.json({
            message: RESPONSE_MESSAGES.VARIANT.RETRIEVED,
            data: result.rows,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};


export const updateVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        if (fields.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.VARIANT.NO_FIELDS, 400));
        }

        const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

        const result = await pool.query(
            `UPDATE product_variants SET ${setQuery} WHERE variant_id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.VARIANT.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.VARIANT.UPDATED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM product_variants WHERE variant_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.VARIANT.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.VARIANT.DELETED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const addVariantImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_url, is_main = false } = req.body;
        const { variant_id } = req.params;

        if (!image_url) {
            return next(new ApiError(RESPONSE_MESSAGES.IMAGE.URL_REQUIRED, 400));
        }

        if (is_main) {
            await pool.query(
                `UPDATE variant_images SET is_main = false WHERE variant_id = $1`,
                [variant_id]
            );
        }

        const result = await pool.query(
            `INSERT INTO variant_images (variant_id, image_url, is_main) 
             VALUES ($1, $2, $3) RETURNING *`,
            [variant_id, image_url, is_main]
        );

        res.status(201).json({ message: RESPONSE_MESSAGES.IMAGE.ADDED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getVariantImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { variant_id } = req.params;

        const result = await pool.query(
            `SELECT * FROM variant_images WHERE variant_id = $1 ORDER BY created_at DESC`,
            [variant_id]
        );

        res.json({ message: RESPONSE_MESSAGES.IMAGE.RETRIEVED, data: result.rows });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const deleteVariantImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_id } = req.params;
        const result = await pool.query("DELETE FROM variant_images WHERE image_id = $1 RETURNING *", [image_id]);

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.IMAGE.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.IMAGE.DELETED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};
