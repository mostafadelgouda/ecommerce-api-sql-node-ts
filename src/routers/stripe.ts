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

// router.post(
//     "/webhook",
//     express.raw({ type: "application/json" }),
//     async (req: Request, res: Response) => {
//         const sig = req.headers["stripe-signature"] as string;
//         let event: Stripe.Event;

//         try {
//             event = stripe.webhooks.constructEvent(
//                 req.body,
//                 sig,
//                 process.env.STRIPE_WEBHOOK_SECRET as string
//             );
//         } catch (err: any) {
//             console.error("⚠️ Webhook signature verification failed:", err.message);
//             return res.status(400).send(`Webhook Error: ${err.message}`);
//         }

//         if (event.type === "checkout.session.completed") {
//             const session = event.data.object as Stripe.Checkout.Session;
//             const userId = session.metadata?.user_id;

//             console.log("✅ Payment success for user:", userId);

//             if (!userId) {
//                 console.error("No userId in session metadata");
//                 return res.status(400).send("No userId in session metadata");
//             }

//             try {
//                 // 🛒 Get all cart items for the user
//                 const { rows: cartItems } = await pool.query(
//                     `
//                     SELECT 
//                         ci.cart_item_id,
//                         ci.user_id,
//                         ci.quantity,
//                         ci.product_id,
//                         p.price
//                     FROM cart_items ci
//                     JOIN products p ON ci.product_id = p.product_id
//                     WHERE ci.user_id = $1;
//                     `,
//                     [userId]
//                 );

//                 if (cartItems.length === 0) {
//                     console.log("Cart is empty, skipping order creation");
//                     return res.json({ received: true });
//                 }

//                 // 💰 Create order
//                 const { rows: orderRows } = await pool.query(
//                     `
//                     INSERT INTO orders (user_id, total_amount, status) 
//                     VALUES ($1, $2, $3) 
//                     RETURNING order_id
//                     `,
//                     [userId, session.amount_total! / 100, "paid"]
//                 );

//                 const orderId = orderRows[0].order_id;

//                 // 🧾 Add order items
//                 for (const item of cartItems) {
//                     await pool.query(
//                         `
//                         INSERT INTO order_items (order_id, product_id, quantity, price)
//                         VALUES ($1, $2, $3, $4)
//                         `,
//                         [orderId, item.product_id, item.quantity, item.price]
//                     );

//                     // 🏷️ Update product stock (if applicable)
//                     // await pool.query(
//                     //     `
//                     //     UPDATE products 
//                     //     SET stock = stock - $1, sold = sold + $1
//                     //     WHERE product_id = $2
//                     //     `,
//                     //     [item.quantity, item.product_id]
//                     // );
//                 }

//                 // 🧹 Clear cart

//                 await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

//                 console.log("✅ Order created and cart cleared for user:", userId);
//             } catch (err) {
//                 console.error("❌ Error processing order:", err);
//                 return res.status(500).send("Error processing order");
//             }
//         }

//         res.json({ received: true });
//     }
// );

// router.post(
//     "/create-checkout-session",
//     isAuthenticated,
//     async (req: Request, res: Response, next: NextFunction) => {
//         try {
//             const user = (req as any).user;
//             const userId = user.user_id;

//             // ✅ Get cart items directly from products
//             const cartQuery = `
//                 SELECT p.product_id, p.name, p.price, c.quantity
//                 FROM cart_items c
//                 JOIN products p ON c.product_id = p.product_id
//                 WHERE c.user_id = $1
//             `;
//             const { rows: cartItems } = await pool.query(cartQuery, [userId]);

//             if (cartItems.length === 0) {
//                 return next(new ApiError("Cart is empty", 400));
//             }

//             // ✅ Apply discounts (if any)
//             const enrichedItems = await Promise.all(
//                 cartItems.map(async (item: any) => {
//                     const saleRes = await pool.query(
//                         `
//                         SELECT discount_percent
//                         FROM sale_items
//                         WHERE product_id = $1
//                           AND start_date <= NOW()
//                           AND end_date >= NOW()
//                         ORDER BY created_at DESC
//                         LIMIT 1
//                         `,
//                         [item.product_id]
//                     );

//                     let finalPrice = parseFloat(item.price);
//                     if (saleRes.rows.length > 0) {
//                         const discount = parseFloat(saleRes.rows[0].discount_percent);
//                         finalPrice = finalPrice - (finalPrice * discount) / 100;
//                     }

//                     return {
//                         ...item,
//                         final_price: Math.round(finalPrice * 100), // Stripe expects amount in cents
//                     };
//                 })
//             );

//             // ✅ Create Stripe Checkout session
//             const session = await stripe.checkout.sessions.create({
//                 payment_method_types: ["card"],
//                 mode: "payment",
//                 line_items: enrichedItems.map((item: any) => ({
//                     price_data: {
//                         currency: "usd",
//                         product_data: {
//                             name: item.name,
//                         },
//                         unit_amount: item.final_price,
//                     },
//                     quantity: item.quantity,
//                 })),
//                 success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//                 cancel_url: `${process.env.CLIENT_URL}/cancel`,
//                 metadata: {
//                     user_id: userId.toString(),
//                 },
//             });

//             res.json({
//                 message: RESPONSE_MESSAGES.PAY.SESSION_CREATED,
//                 url: session.url,
//             });
//         } catch (err: any) {
//             return next(new ApiError(err.message, err.statusCode || 500));
//         }
//     }
// );

router.post(
    "/create-checkout-session",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        const client = await pool.connect();
        try {
            const user = (req as any).user;
            const userId = user.user_id;

            // Get cart items
            const cartQuery = `
        SELECT p.product_id, p.name, p.price, c.quantity
        FROM cart_items c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.user_id = $1
      `;
            const { rows: cartItems } = await client.query(cartQuery, [userId]);

            if (cartItems.length === 0) {
                return next(new ApiError("Cart is empty", 400));
            }

            // Apply discounts and compute final_price (in cents) for Stripe
            const enrichedItems = await Promise.all(
                cartItems.map(async (item: any) => {
                    const saleRes = await client.query(
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
                        final_price_cents: Math.round(finalPrice * 100), // cents
                    };
                })
            );

            // Build Stripe line_items
            const line_items = enrichedItems.map((item: any) => ({
                price_data: {
                    currency: "usd",
                    product_data: { name: item.name },
                    unit_amount: item.final_price_cents,
                },
                quantity: item.quantity,
            }));

            // Compute total amount in cents
            const totalCents = enrichedItems.reduce(
                (acc: number, it: any) => acc + it.final_price_cents * it.quantity,
                0
            );

            // 1) Create DB order + order_items first (status = 'pending')
            let orderId: number;
            try {
                await client.query("BEGIN");

                const insertOrderText = `
          INSERT INTO orders (user_id, total_amount, status)
          VALUES ($1, $2, $3)
          RETURNING order_id
        `;
                const totalDollars = totalCents / 100;
                const { rows: orderRows } = await client.query(insertOrderText, [
                    userId,
                    totalDollars,
                    "pending",
                ]);
                orderId = orderRows[0].order_id;

                const insertItemText = `
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `;
                for (const it of enrichedItems) {
                    await client.query(insertItemText, [
                        orderId,
                        it.product_id,
                        it.quantity,
                        it.final_price_cents / 100,
                    ]);
                }

                await client.query("COMMIT");
            } catch (dbErr) {
                await client.query("ROLLBACK");
                console.error("DB error while creating pending order:", dbErr);
                return next(new ApiError("Failed to create pending order", 500));
            }

            // 2) Create Stripe session and include orderId in metadata & success_url
            let session: Stripe.Checkout.Session;
            try {
                session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    mode: "payment",
                    line_items,
                    // redirect the user to receipt page including order id
                    success_url: `${process.env.CLIENT_URL}/receipt?order_id=${orderId}`,
                    cancel_url: `${process.env.CLIENT_URL}/cancel`,
                    metadata: {
                        user_id: userId.toString(),
                        order_id: orderId.toString(),
                    },
                });
            } catch (stripeErr: any) {
                console.error("Stripe session creation failed:", stripeErr);

                // Cleanup: remove the orphan pending order and its items (optional)
                try {
                    await client.query("BEGIN");
                    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
                    await client.query(`DELETE FROM orders WHERE order_id = $1`, [orderId]);
                    await client.query("COMMIT");
                } catch (cleanupErr) {
                    await client.query("ROLLBACK");
                    console.error("Failed to cleanup orphan order after stripe error:", cleanupErr);
                }

                return next(new ApiError("Failed to create checkout session", 500));
            }

            // 3) Update order with stripe_session_id (best-effort)
            try {
                await client.query(
                    `UPDATE orders SET stripe_session_id = $1 WHERE order_id = $2`,
                    [session.id, orderId]
                );
            } catch (updErr) {
                console.error("Failed to update order with stripe session id:", updErr);
                // Not fatal for stripe flow; continue and return session url and orderId
            }

            // Return the session url and the order id so frontend can track it
            res.json({
                message: RESPONSE_MESSAGES.PAY.SESSION_CREATED,
                url: session.url,
                sessionId: session.id,
                orderId, // <- added order id here
            });
        } catch (err: any) {
            return next(new ApiError(err.message, err.statusCode || 500));
        } finally {
            client.release();
        }
    }
);

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
            console.error("⚠️ Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const stripeSessionId = session.id;
            const userId = session.metadata?.user_id;

            console.log("✅ Payment success for stripe session:", stripeSessionId, "user:", userId);

            if (!stripeSessionId) {
                console.error("No stripe session id in event");
                return res.status(400).send("No session id");
            }

            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                // Find the order created earlier that matches this stripe_session_id
                const { rows: orderRows } = await client.query(
                    `SELECT order_id, user_id, status FROM orders WHERE stripe_session_id = $1 FOR UPDATE`,
                    [stripeSessionId]
                );

                if (orderRows.length === 0) {
                    // No pending order found: optionally create one now or log and return
                    console.error("No order found for stripe_session_id:", stripeSessionId);
                    await client.query("ROLLBACK");
                    return res.status(404).send("Order not found");
                }

                const order = orderRows[0];
                if (order.status === "paid") {
                    // already processed
                    await client.query("COMMIT");
                    return res.json({ received: true });
                }

                // Update order status to paid
                await client.query(
                    `UPDATE orders SET status = $1 WHERE order_id = $2`,
                    ["paid", order.order_id]
                );

                // Optionally update product stock and sold counters based on order_items
                const { rows: orderItems } = await client.query(
                    `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
                    [order.order_id]
                );

                // for (const it of orderItems) {
                //     // update product stock (if you track stock)
                //     await client.query(
                //         `UPDATE products SET stock = GREATEST(stock - $1, 0), sold = COALESCE(sold,0) + $1 WHERE product_id = $2`,
                //         [it.quantity, it.product_id]
                //     );
                // }

                // Clear cart for this user (so user doesn't have duplicate items)
                if (userId) {
                    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
                }

                await client.query("COMMIT");
                console.log("✅ Order marked as paid and cart cleared for user:", userId);
            } catch (err) {
                await client.query("ROLLBACK");
                console.error("❌ Error processing order after payment:", err);
                return res.status(500).send("Error processing order");
            } finally {
                client.release();
            }
        }

        res.json({ received: true });
    }
);


export default router;