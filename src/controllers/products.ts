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
        const { page = 1, limit = 10, category, color, size, min_price, max_price } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // Build conditions dynamically
        const conditions: string[] = [];
        const values: any[] = [];

        if (category) {
            values.push(category);
            conditions.push(`p.category_id = $${values.length}`);
        }

        if (color) {
            values.push(color);
            conditions.push(`v.color = $${values.length}`);
        }

        if (size) {
            values.push(size);
            conditions.push(`v.size = $${values.length}`);
        }

        if (min_price) {
            values.push(Number(min_price));
            conditions.push(`p.price >= $${values.length}`);
        }

        if (max_price) {
            values.push(Number(max_price));
            conditions.push(`p.price <= $${values.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        // ✅ Fetch products with variants and their own main image
        const query = `
            SELECT 
                p.product_id,
                p.name,
                p.description,
                p.price,
                p.category_id,
                p.brand,
                p.created_at,
                img.image_url AS main_image,
                json_agg(
                    json_build_object(
                        'variant_id', v.variant_id,
                        'color', v.color,
                        'size', v.size,
                        'stock', v.stock,
                        'created_at', v.created_at,
                        'main_image', vimg.image_url
                    )
                ) AS variants
            FROM products p
            LEFT JOIN product_variants v ON p.product_id = v.product_id
            LEFT JOIN LATERAL (
                SELECT image_url 
                FROM product_images i 
                WHERE i.product_id = p.product_id 
                ORDER BY i.is_main DESC, i.created_at ASC 
                LIMIT 1
            ) img ON TRUE
            LEFT JOIN LATERAL (
                SELECT image_url
                FROM variant_images vi
                WHERE vi.variant_id = v.variant_id
                ORDER BY vi.is_main DESC, vi.created_at ASC
                LIMIT 1
            ) vimg ON TRUE
            ${whereClause}
            GROUP BY p.product_id, img.image_url
            ORDER BY p.created_at DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2};
        `;

        values.push(Number(limit), offset);

        const result = await pool.query(query, values);

        // Enrich with ratings + discount
        const productsWithDetails = await Promise.all(
            result.rows.map(async (row: any) => {
                // average rating
                const ratingRes = await pool.query(
                    `SELECT 
                        CASE 
                            WHEN COUNT(*) = 0 THEN 5 
                            ELSE ROUND(AVG(rating), 1) 
                        END AS average_rating
                     FROM reviews
                     WHERE product_id = $1`,
                    [row.product_id]
                );

                // sale / discount
                const saleRes = await pool.query(
                    `SELECT discount_percent 
                     FROM sale_items 
                     WHERE product_id = $1
                       AND start_date <= NOW()
                       AND end_date >= NOW()
                     ORDER BY created_at DESC 
                     LIMIT 1`,
                    [row.product_id]
                );

                let final_price = row.price;
                let discount_percent = null;
                if (saleRes.rows.length > 0) {
                    discount_percent = parseFloat(saleRes.rows[0].discount_percent);
                    final_price =
                        parseFloat(row.price) -
                        (parseFloat(row.price) * discount_percent) / 100;
                }

                return {
                    ...row,
                    average_rating: parseFloat(ratingRes.rows[0].average_rating),
                    final_price: Math.round(final_price),
                    discount_percent,
                };
            })
        );

        res.json({
            message: RESPONSE_MESSAGES.PRODUCT.RETRIEVED,
            page: Number(page),
            limit: Number(limit),
            total_items: productsWithDetails.length, // replace with COUNT(*) if exact count needed
            data: productsWithDetails,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};



// Get product by ID (with images)
// Get product by ID (with images)
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // ✅ Fetch product with its main image
        const productRes = await pool.query(
            `
            SELECT 
                p.*,
                img.image_url AS main_image
            FROM products p
            LEFT JOIN LATERAL (
                SELECT image_url 
                FROM product_images i 
                WHERE i.product_id = p.product_id 
                ORDER BY i.is_main DESC, i.created_at ASC 
                LIMIT 1
            ) img ON TRUE
            WHERE p.product_id = $1
            `,
            [id]
        );

        if (productRes.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.PRODUCT.NOT_FOUND, 404));
        }
        const product = productRes.rows[0];

        // ✅ Product images
        const imagesRes = await pool.query(
            "SELECT image_url, is_main FROM product_images WHERE product_id = $1 ORDER BY is_main DESC, created_at ASC",
            [id]
        );

        // ✅ Variants with their main image
        const variantsRes = await pool.query(
            `
            SELECT 
                v.variant_id,
                v.color,
                v.size,
                v.stock,
                v.created_at,
                vi.image_url AS main_image
            FROM product_variants v
            LEFT JOIN LATERAL (
                SELECT image_url 
                FROM variant_images vi 
                WHERE vi.variant_id = v.variant_id
                ORDER BY vi.is_main DESC, vi.created_at ASC
                LIMIT 1
            ) vi ON TRUE
            WHERE v.product_id = $1
            ORDER BY v.created_at ASC
            `,
            [id]
        );

        // ✅ Average rating
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

        // ✅ Sale (discount) - product-level
        const saleRes = await pool.query(
            `SELECT discount_percent 
             FROM sale_items 
             WHERE product_id = $1
               AND start_date <= NOW()
               AND end_date >= NOW()
             ORDER BY created_at DESC 
             LIMIT 1`,
            [id]
        );

        let final_price = product.price;
        let discount_percent = null;
        if (saleRes.rows.length > 0) {
            discount_percent = parseFloat(saleRes.rows[0].discount_percent);
            final_price =
                parseFloat(product.price) -
                (parseFloat(product.price) * discount_percent) / 100;
        }

        res.json({
            message: RESPONSE_MESSAGES.PRODUCT.FOUND,
            data: {
                ...product,
                images: imagesRes.rows,
                variants: variantsRes.rows,
                average_rating: parseFloat(ratingRes.rows[0].average_rating),
                final_price: Math.round(final_price),
                discount_percent
            }
        });

    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
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
export const getProductsCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query("SELECT COUNT(*) AS total_products FROM products");
        const total = parseInt(result.rows[0].total_products, 10);

        res.json({
            message: "Total number of products retrieved successfully",
            total_products: total,
            number_of_pages: Math.ceil(total / 20),
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};