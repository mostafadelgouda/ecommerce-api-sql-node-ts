import express, { type Request, type Response } from "express";
import pool from './config/db.js';

const app = express();
app.use(express.json())
const port = 3000;

app.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Example: add new product
app.post('/categories', async (req, res) => {
    try {
        const { name, type } = req.body;
        const result = await pool.query(
            'INSERT INTO categories (name, price) VALUES ($1, $2) RETURNING *',
            [name, type]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


app.get("/", (req: Request, res: Response) => {
    res.send("Hello, TypeScript + Express!");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
