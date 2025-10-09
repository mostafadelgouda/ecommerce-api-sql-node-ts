import express, { Router, type NextFunction, type Request, type Response } from "express";
import Stripe from "stripe";
import pool from "../config/db.js";
import { isAuthenticated } from "../middlewares/isAuth.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import ApiError from "../utils/apiError.js";
import { validateRequest } from "../middlewares/validateRequest.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-04-10" as any,
});


const router = Router();

router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
        const sig = req.headers["stripe-signature"] as string;
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
        } catch (err: any) {
            console.error("⚠️ Webhook signature verification failed.", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;


            console.log("✅ Payment success for user:", userId);

            if (!userId) {
                console.error("No userId in session metadata");
                return res.status(400).send("No userId in session metadata");
            }

            try {
                const { rows: cartItems } = await pool.query(
                    `
                    SELECT 
                        ci.cart_item_id,
                        ci.user_id,
                        ci.variant_id,
                        ci.quantity,
                        ci.product_id,
                        p.price,               -- ✅ get product price
                        pv.size,
                        pv.color,
                        pv.stock,
                        pv.sold
                    FROM cart_items ci
                    JOIN product_variants pv ON ci.variant_id = pv.variant_id
                    JOIN products p ON ci.product_id = p.product_id
                    WHERE ci.user_id = $1;
                    `,
                    [userId]
                );

                if (cartItems.length === 0) {
                    console.log("Cart is empty, skipping order creation");
                    return res.json({ received: true });
                }

                const { rows: orderRows } = await pool.query(
                    `INSERT INTO orders (user_id, total_amount, status) 
           VALUES ($1, $2, $3) RETURNING order_id`,
                    [userId, session.amount_total! / 100, "paid"]
                );

                const orderId = orderRows[0].order_id;

                for (const item of cartItems) {
                    await pool.query(
                        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) 
                        VALUES ($1, $2, $3, $4, $5)`,
                        [orderId, item.product_id, item.variant_id, item.quantity, item.price]
                    );

                    await pool.query(
                        `UPDATE product_variants 
             SET stock = stock - $1, sold = sold + $1
             WHERE variant_id = $2`,
                        [item.quantity, item.variant_id]
                    );
                }

                await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
                console.log("✅ Order created and cart cleared for user:", userId);
            } catch (err) {
                console.error("❌ Error processing order:", err);
                return res.status(500).send("Error processing order");
            }
        }

        res.json({ received: true });
    }
);

router.post(
    "/create-checkout-session",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;
            const userId = user.user_id;

            // ✅ Get cart items directly from products
            const cartQuery = `
                SELECT p.product_id, p.name, p.price, c.quantity
                FROM cart_items c
                JOIN products p ON c.product_id = p.product_id
                WHERE c.user_id = $1
            `;
            const { rows: cartItems } = await pool.query(cartQuery, [userId]);

            if (cartItems.length === 0) {
                return next(new ApiError("Cart is empty", 400));
            }

            // ✅ Apply discounts (if any)
            const enrichedItems = await Promise.all(
                cartItems.map(async (item: any) => {
                    const saleRes = await pool.query(
                        `
                        SELECT discount_percent
                        FROM sale_items
                        WHERE product_id = $1
                          AND start_date <= NOW()
                          AND end_date >= NOW()
                        ORDER BY created_at DESC
                        LIMIT 1
                        `,
                        [item.product_id]
                    );

                    let finalPrice = parseFloat(item.price);
                    if (saleRes.rows.length > 0) {
                        const discount = parseFloat(saleRes.rows[0].discount_percent);
                        finalPrice = finalPrice - (finalPrice * discount) / 100;
                    }

                    return {
                        ...item,
                        final_price: Math.round(finalPrice * 100), // Stripe expects amount in cents
                    };
                })
            );

            // ✅ Create Stripe Checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items: enrichedItems.map((item: any) => ({
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: item.name,
                        },
                        unit_amount: item.final_price,
                    },
                    quantity: item.quantity,
                })),
                success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL}/cancel`,
                metadata: {
                    user_id: userId.toString(),
                },
            });

            res.json({
                message: RESPONSE_MESSAGES.PAY.SESSION_CREATED,
                url: session.url,
            });
        } catch (err: any) {
            return next(new ApiError(err.message, err.statusCode || 500));
        }
    }
);



export default router;