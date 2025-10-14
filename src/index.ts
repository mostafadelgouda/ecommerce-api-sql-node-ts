import express, { type NextFunction, type Request, type Response } from "express";
import categoriesRouter from "./routers/categories.js"
import userRouter from "./routers/users.js"
import adminRouter from "./routers/admins.js"
import productsRouter from "./routers/products.js"
import reviewsRouter from "./routers/reviews.js"
import productVariantsRouter from "./routers/productVariants.js"
import orderesRouter from "./routers/orders.js"
import cartRouter from "./routers/cart.js"
import wishlistRouter from "./routers/wishlist.js"
import saleItemsRouter from "./routers/saleItems.js"

import stripeRouter from "./routers/stripe.js"
import passport from "./config/passport.js";
import globalError from "./middlewares/error.js";
import cors from "cors";


const app = express();
app.use(
    cors({
        origin: [
            "http://localhost:4200",
            "https://shop-ecommerce-one-alpha.vercel.app" // ✅ deployed frontend
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // if you're using cookies or authorization headers
    })
);


/**
 * 🚨 Stripe requires the *raw* body to verify the signature.
 * So we must register its router BEFORE express.json().
 */
app.use("/", stripeRouter);

// Now we can safely parse JSON for all other routes
app.use(express.json());

app.use(passport.initialize());


app.use('/api', userRouter);
app.use('/api', adminRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/products', productVariantsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/orders', orderesRouter);
app.use('/api/saleItems', saleItemsRouter);


app.get("/", (req, res) => {
    res.send("🚀 Server is alive");
});

app.use(globalError);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

