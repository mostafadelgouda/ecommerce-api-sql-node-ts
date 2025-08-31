import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";

interface JwtPayload {
    user_id: number;
    role: string;
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(new ApiError("No token provided", 401));
    }

    const token = authHeader.split(" ")[1] || "invalid token";
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        (req as any).user = decoded;
        next();
    } catch (err: any) {
        return next(new ApiError(err.message, err.code));
    }
};