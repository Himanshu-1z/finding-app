import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "FindingSecretJwtKey32BytesLongMinimumForHmacSha256!";

export interface AuthenticatedUser {
  id: string;
  email: string;
  mysteryName?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : (req.query.access_token as string);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.uid || decoded.id || decoded.sub || "",
      email: decoded.email || "",
      mysteryName: decoded.mystery_name || decoded.mysteryName || "",
      role: decoded.role || "User",
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const optionalJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : (req.query.access_token as string);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.uid || decoded.id || decoded.sub || "",
        email: decoded.email || "",
        mysteryName: decoded.mystery_name || decoded.mysteryName || "",
        role: decoded.role || "User",
      };
    } catch (_) {}
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticateJwt(req, res, () => {
    if (req.user && (req.user.role === "Admin" || req.user.role === "Super Admin")) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden. Admin access required." });
  });
};

