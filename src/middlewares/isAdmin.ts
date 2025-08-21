import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

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
            return res.status(403).json({ message: "Access denied: Admins only" });
        }
        (req as any).user = decoded; // save user to request
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};