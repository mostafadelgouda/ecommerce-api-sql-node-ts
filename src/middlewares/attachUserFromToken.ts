import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";

export const attachUserFromToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ensure req.body exists even for GET requests
        if (!req.body) req.body = {};

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.body.user_id = null; // no token, mark user as guest
            return next();
        }

        const token: any = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        req.body.user_id = decoded?.user_id || null; // attach to body
        next();
    } catch (err) {
        if (!req.body) req.body = {};
        req.body.user_id = null; // invalid token → guest
        next();
    }
};