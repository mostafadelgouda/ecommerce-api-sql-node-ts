import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { getItemsWithFilters } from "../utils/filterPagination.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const enrichSaleItems = async (items: any[]) => {
    return Promise.all(
        items.map(async (item) => {
            const productRes = await pool.query(
                `SELECT 
                    p.product_id,
                    p.name AS product_name,
                    p.description,
                    img.image_url AS main_image,
                    COALESCE(
                        (
                            SELECT json_agg(json_build_object('image_url', pi.image_url))
                            FROM product_images pi
                            WHERE pi.product_id = p.product_id
                        ),
                        '[]'
                    ) AS images
                 FROM products p
                 LEFT JOIN LATERAL (
                     SELECT image_url
                     FROM product_images i
                     WHERE i.product_id = p.product_id
                     ORDER BY i.is_main DESC, i.created_at ASC
                     LIMIT 1
                 ) img ON TRUE
                 WHERE p.product_id = $1
                 LIMIT 1`,
                [item.product_id]
            );

            const product = productRes.rows[0] || {};

            return {
                ...item,
                product: {
                    product_id: product.product_id,
                    name: product.product_name,
                    description: product.description,
                    main_image: product.main_image,
                    images: product.images,
                },
            };
        })
    );
};
// Create sale item
export const createSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id, discount_percent, start_date, end_date } = req.body;

        if (!product_id || !discount_percent || !start_date || !end_date) {
            return next(new ApiError("All fields are required", 400));
        }

        // 1. Delete any previous sale item for this product
        await pool.query("DELETE FROM sale_items WHERE product_id = $1", [product_id]);

        // 2. Insert the new sale item
        const result = await pool.query(
            `INSERT INTO sale_items (product_id, discount_percent, start_date, end_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [product_id, discount_percent, start_date, end_date]
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

        const enrichedSaleItems = await enrichSaleItems(result.data);

        res.json({
            message: RESPONSE_MESSAGES.SALE_ITEM.RETRIEVED,
            page: Number(page),
            total_items: result.number_of_items,
            limit: Number(limit),
            data: enrichedSaleItems,
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

        const enriched = await enrichSaleItems(result.rows);

        res.json({ message: RESPONSE_MESSAGES.SALE_ITEM.FOUND, data: enriched[0] });
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
            `UPDATE sale_items 
             SET ${setQuery}, updated_at = NOW() 
             WHERE sale_id = $${fields.length + 1} 
             RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.SALE_ITEM.NOT_FOUND, 404));
        }

        // Get all sale items (after update)
        const allItems = await pool.query(`SELECT * FROM sale_items ORDER BY created_at DESC`);
        const enrichedItems = await enrichSaleItems(allItems.rows);

        res.json({
            message: RESPONSE_MESSAGES.SALE_ITEM.UPDATED,
            updated: (await enrichSaleItems(result.rows))[0],
            data: enrichedItems
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// Delete sale item
export const deleteSaleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM sale_items WHERE sale_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.SALE_ITEM.NOT_FOUND, 404));
        }

        // Get all remaining sale items
        const allItems = await pool.query(`SELECT * FROM sale_items ORDER BY created_at DESC`);
        const enrichedItems = await enrichSaleItems(allItems.rows);

        res.json({
            message: RESPONSE_MESSAGES.SALE_ITEM.DELETED,
            deleted: (await enrichSaleItems(result.rows))[0],
            data: enrichedItems
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};