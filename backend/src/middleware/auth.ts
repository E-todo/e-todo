
import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      msg: "No token, authorization denied"
    });
    return;
  }

  const token = authorization.slice(7).trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      msg: "Internal server error"
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "number" ||
      !Number.isInteger(decoded.id) ||
      decoded.id <= 0
    ) {
      res.status(401).json({
        msg: "Token is not valid"
      });
      return;
    }

    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({
      msg: "Token is not valid"
    });
  }
}
