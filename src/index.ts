import express, { type NextFunction, type Request, type Response } from "express";
import pool from './config/db.js';
import ApiError from "./utils/apiError.js";
import categoriesRouter from "./routers/categories.js"
//import morgan from "morgan";
//import dotenv from "dotenv";
const app = express();
app.use(express.json())
const port = 3000;
// dotenv.config({ path: '.env' });

// if (process.env.NODE_ENV === 'development') {
//     app.use(morgan('dev'));
//     console.log(`mode: ${process.env.NODE_ENV}`);
// }

app.use('/api/v1/categories', categoriesRouter);

// app.get('/categories', async (req, res) => {
//     try {
//         const result = await pool.query('SELECT * FROM categories');
//         res.json(result.rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server error');
//     }
// });

// // Example: add new product
// app.post('/categories', async (req, res) => {
//     try {
//         const { name, type } = req.body;
//         const result = await pool.query(
//             'INSERT INTO categories (name, price) VALUES ($1, $2) RETURNING *',
//             [name, type]
//         );
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server error');
//     }
// });


// app.all('*', (req: Request, res: Response, next: NextFunction) => {
//     return next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
// });

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
