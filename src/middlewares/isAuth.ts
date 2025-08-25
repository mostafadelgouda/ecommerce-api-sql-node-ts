import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    user_id: number;
    role: string;
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1] || "invalid token";
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        (req as any).user = decoded; // attach user payload to request
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};