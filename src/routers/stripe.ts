import express, { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import pool from "../config/db.js";
import { isAuthenticated } from "../middlewares/isAuth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-04-10" as any,
});


const router = Router();

// ✅ Create Payment Intent
router.post("/create-payment-intent", async (req: Request, res: Response) => {
    try {
        const { amount, currency, orderId } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount, // in cents (e.g., 2000 = $20)
            currency,
            metadata: { orderId },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Webhook to confirm payment
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("✅ Payment succeeded:", paymentIntent.id);

        // TODO: update order status in DB to "paid"
    }

    res.json({ received: true });
});

// router.post("/create-checkout-session", async (req: Request, res: Response) => {
//     try {
//         const { cartItems } = req.body; // [{ name, price, quantity }]

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ["card"],
//             mode: "payment",
//             line_items: cartItems.map((item: any) => ({
//                 price_data: {
//                     currency: "usd",
//                     product_data: { name: item.name },
//                     unit_amount: item.price * 100, // price in cents
//                 },
//                 quantity: item.quantity,
//             })),
//             success_url: `${process.env.CLIENT_URL}/success`,
//             cancel_url: `${process.env.CLIENT_URL}/cancel`,
//         });

//         res.json({ url: session.url });
//     } catch (error: any) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// });

// 
// adjust based on your setup
router.post("/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user; // comes from isAuthenticated middleware
        const userId = user.user_id;

        // 1. Fetch cart items for this user
        const cartQuery = `
            SELECT p.name, p.price, c.quantity
            FROM cart_items c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.user_id = $1
        `;
        const { rows: cartItems } = await pool.query(cartQuery, [userId]);

        if (cartItems.length === 0) {
            return res.status(404).json({ error: "Cart is empty" });
        }

        // 2. Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: cartItems.map((item: any) => ({
                price_data: {
                    currency: "usd",
                    product_data: { name: item.name },
                    unit_amount: item.price * 100, // Stripe uses cents
                },
                quantity: item.quantity,
            })),
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
        });

        // 3. Return checkout link
        res.json({ url: session.url });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


export default router;