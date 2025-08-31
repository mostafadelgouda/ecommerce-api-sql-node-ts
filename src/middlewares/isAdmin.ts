import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";

interface JwtPayload {
    user_id: number;
    role: string;
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1] || "invalid token";
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as JwtPayload;
        console.log(decoded);
        if (decoded.role !== "admin") {
            return next(new ApiError("Access denied: Admins only", 403));
        }
        (req as any).user = decoded;
        next();
    } catch (err: any) {
        return next(new ApiError(err.message, err.code));
    }
};