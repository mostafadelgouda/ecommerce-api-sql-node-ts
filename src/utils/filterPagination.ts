import { Pool } from "pg";

import pool from "../config/db.js";

// Generic pagination + filtering handler
export async function getItemsWithFilters(
    table: string,
    filters: Record<string, any>, // key = column, value = filter value
    page: number = 1,
    limit: number = 10,
    orderBy: string = "created_at",
    order: "ASC" | "DESC" = "DESC"
) {
    const offset = (page - 1) * limit;

    // Build filter conditions dynamically
    const conditions: string[] = [];
    const values: any[] = [];

    Object.entries(filters).forEach(([key, value], index) => {
        if (value !== undefined && value !== null) {
            // Check if value starts with an operator
            const operatorMatch = /^([<>]=?|!=|LIKE)\s*(.+)$/.exec(String(value));
            if (operatorMatch) {
                const operator = operatorMatch[1];
                const val = operatorMatch[2];
                conditions.push(`${key} ${operator} $${index + 1}`);
                values.push(val);
            } else {
                // Default to equals
                conditions.push(`${key} = $${index + 1}`);
                values.push(value);
            }
        }
    });


    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Main query with pagination
    const query = `
    SELECT * FROM ${table}
    ${whereClause}
    ORDER BY ${orderBy} ${order}
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Count total items for metadata
    const countQuery = `
    SELECT COUNT(*) FROM ${table} ${whereClause}
  `;
    const countResult = await pool.query(countQuery, values.slice(0, -2));

    return {
        page,
        number_of_items: parseInt(countResult.rows[0].count, 10),
        data: result.rows,
    };
}
