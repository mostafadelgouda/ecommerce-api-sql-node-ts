import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { getItemsWithFilters } from "../utils/filterPagination.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import ApiError from "../utils/apiError.js";
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        const { name, description, price, category_id, brand, images } = req.body;

        if (!name || !price) {
            return next(new ApiError("Name and price are required", 400));
        }

        await client.query("BEGIN");

        // Insert product
        const productResult = await client.query(
            `INSERT INTO products (name, description, price, category_id, brand)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, description, price, category_id, brand]
        );

        const product = productResult.rows[0];

        // Insert product images (if provided)
        if (Array.isArray(images) && images.length > 0) {
            for (const img of images) {
                const { image_url, is_main = false } = img;

                if (!image_url) continue; // skip invalid

                if (is_main) {
                    // Ensure only one main image for this product
                    await client.query(
                        `UPDATE product_images SET is_main = false WHERE product_id = $1`,
                        [product.product_id]
                    );
                }

                await client.query(
                    `INSERT INTO product_images (product_id, image_url, is_main)
                     VALUES ($1, $2, $3)`,
                    [product.product_id, image_url, is_main]
                );
            }
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: RESPONSE_MESSAGES.PRODUCT.CREATED,
            data: product
        });
    } catch (err: any) {
        await client.query("ROLLBACK");
        return next(new ApiError(err.message, err.statusCode || 500));
    } finally {
        client.release();
    }
};

// Get all products (with pagination + images)
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, category } = req.query;

        const filters: Record<string, any> = {};
        if (category) filters.category_id = category;

        const result = await getItemsWithFilters(
            "products",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );

        const productsWithDetails = await Promise.all(
            result.data.map(async (product: any) => {
                // images
                const imgRes = await pool.query(
                    `SELECT image_url, is_main 
             FROM product_images 
             WHERE product_id = $1 
             ORDER BY is_main DESC, created_at ASC`,
                    [product.product_id]
                );

                // average rating
                const ratingRes = await pool.query(
                    `SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 5 
                    ELSE ROUND(AVG(rating),1) 
                END AS average_rating
             FROM reviews
             WHERE product_id = $1`,
                    [product.product_id]
                );

                // sale / discount
                const saleRes = await pool.query(
                    `SELECT discount_percent 
             FROM sale_items 
             WHERE variant_id = $1
               AND start_date <= NOW()
               AND end_date >= NOW()
             ORDER BY created_at DESC 
             LIMIT 1`,
                    [product.product_id]
                );

                let final_price = product.price;
                let discount_percent = null;
                if (saleRes.rows.length > 0) {
                    discount_percent = parseFloat(saleRes.rows[0].discount_percent);
                    final_price = parseFloat(product.price) - (parseFloat(product.price) * discount_percent / 100);
                }

                return {
                    ...product,
                    images: imgRes.rows,
                    average_rating: parseFloat(ratingRes.rows[0].average_rating),
                    final_price,
                    discount_percent
                };
            })
        );

        res.json({
            message: RESPONSE_MESSAGES.PRODUCT.RETRIEVED,
            page: Number(page),
            total_items: result.number_of_items,
            limit: Number(limit),
            data: productsWithDetails
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

// Get product by ID (with images)
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const productRes = await pool.query("SELECT * FROM products WHERE product_id = $1", [id]);
        if (productRes.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.PRODUCT.NOT_FOUND, 404));
        }

        // images
        const imagesRes = await pool.query(
            "SELECT image_url, is_main FROM product_images WHERE product_id = $1 ORDER BY is_main DESC, created_at ASC",
            [id]
        );

        // average rating
        const ratingRes = await pool.query(
            `SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 5 
                    ELSE ROUND(AVG(rating),1) 
                END AS average_rating
            FROM reviews
            WHERE product_id = $1`,
            [id]
        );
        const saleRes = await pool.query(
            `SELECT discount_percent 
     FROM sale_items 
     WHERE variant_id = $1
       AND start_date <= NOW()
       AND end_date >= NOW()
     ORDER BY created_at DESC 
     LIMIT 1`,
            [id]
        );

        let final_price = productRes.rows[0].price;
        let discount_percent = null;
        if (saleRes.rows.length > 0) {
            discount_percent = parseFloat(saleRes.rows[0].discount_percent);
            final_price = parseFloat(final_price) - (parseFloat(final_price) * discount_percent / 100);
        }

        res.json({
            message: RESPONSE_MESSAGES.PRODUCT.FOUND,
            data: {
                ...productRes.rows[0],
                images: imagesRes.rows,
                average_rating: parseFloat(ratingRes.rows[0].average_rating),
                final_price,
                discount_percent
            }
        });

    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};


export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        if (fields.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.PRODUCT.NO_FIELDS, 400));
        }

        const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
        const result = await pool.query(
            `UPDATE products SET ${setQuery} WHERE product_id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.PRODUCT.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.PRODUCT.UPDATED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM products WHERE product_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.PRODUCT.NOT_FOUND, 404));
        }
        res.json({ message: RESPONSE_MESSAGES.PRODUCT.DELETED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const addProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_url, is_main = false } = req.body;
        const product_id = req.params.product_id;

        if (!image_url) {
            return next(new ApiError(RESPONSE_MESSAGES.IMAGE.URL_REQUIRED, 400));
        }

        if (is_main) {
            await pool.query(`UPDATE product_images SET is_main = false WHERE product_id = $1`, [product_id]);
        }

        const result = await pool.query(
            `INSERT INTO product_images (product_id, image_url, is_main) 
             VALUES ($1, $2, $3) RETURNING *`,
            [product_id || null, image_url, is_main]
        );

        res.status(201).json({ message: RESPONSE_MESSAGES.IMAGE.ADDED, data: result.rows[0] });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getProductImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id } = req.params;
        const result = await pool.query(
            `SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at DESC`,
            [product_id]
        );

        res.json({ message: RESPONSE_MESSAGES.IMAGE.RETRIEVED, data: result.rows });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_id } = req.params;
        const result = await pool.query("DELETE FROM product_images WHERE image_id = $1 RETURNING *", [image_id]);
        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.IMAGE.NOT_FOUND, 404));
        }
        res.json({ message: RESPONSE_MESSAGES.IMAGE.DELETED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};
