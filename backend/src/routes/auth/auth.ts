import "dotenv/config";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../../config/db";

const router = Router();

// Types des données reçues

type RegisterBody = {
  email: string;
  password: string;
  name: string;
  firstname: string;
};

type LoginBody = {
  email: string;
  password: string;
};

interface UserRow extends RowDataPacket {
  id: number;
  password: string;
}

// Vérification des données d'inscription

function isRegisterBody(value: unknown): value is RegisterBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "email" in value &&
    typeof value.email === "string" &&
    "password" in value &&
    typeof value.password === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "firstname" in value &&
    typeof value.firstname === "string"
  );
}

// Vérification des données de connexion

function isLoginBody(value: unknown): value is LoginBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "email" in value &&
    typeof value.email === "string" &&
    "password" in value &&
    typeof value.password === "string"
  );
}

// POST /register - Inscription

router.post("/register", async (req, res) => {
  if (!isRegisterBody(req.body)) {
    return res.status(400).json({
      msg: "Bad parameter"
    });
  }

  const { email, password, name, firstname } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    password.length < 8 ||
    !name.trim() ||
    !firstname.trim()
  ) {
    return res.status(400).json({
      msg: "Bad parameter"
    });
  }

  try {
    // Vérifier si le compte existe déjà
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM `user` WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        msg: "Account already exists"
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Enregistrer l'utilisateur dans MySQL
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO `user` (email, password, name, firstname) VALUES (?, ?, ?, ?)",
      [
        normalizedEmail,
        hashedPassword,
        name.trim(),
        firstname.trim()
      ]
    );

    // Générer le JWT
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { id: result.insertId },
      secret,
      { expiresIn: "24h" }
    );

    return res.status(201).json({ token });

  } catch (error) {
    console.error("Registration failed:", error);

    return res.status(500).json({
      msg: "Internal server error"
    });
  }
});

// POST /login - Connexion

router.post("/login", async (req, res) => {
  if (!isLoginBody(req.body)) {
    return res.status(400).json({
      msg: "Bad parameter"
    });
  }

  const { email, password } = req.body;

  if (!email.trim() || !password) {
    return res.status(400).json({
      msg: "Bad parameter"
    });
  }

  try {
    // Récupérer l'utilisateur depuis MySQL
    const [users] = await db.execute<UserRow[]>(
      "SELECT id, password FROM `user` WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({
        msg: "Invalid Credentials"
      });
    }

    // Vérifier le mot de passe avec bcrypt
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        msg: "Invalid Credentials"
      });
    }

    // Générer le JWT
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { id: user.id },
      secret,
      { expiresIn: "24h" }
    );

    return res.status(200).json({ token });

  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      msg: "Internal server error"
    });
  }
});

export default router;