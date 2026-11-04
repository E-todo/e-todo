import { Router } from "express";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../../config/db";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

interface UserRow extends RowDataPacket {
    id: number;
    email: string;
    password: string;
    name: string;
    firstname: string;
    created_at: Date;
}

router.get("/user", authMiddleware, async (req, res) => {
    const userId = req.userId;

    if (typeof userId !== "number") {
        return res.status(401).json({
            msg: "No token, authorization denied",
        });
    }

    try {
        const [users] = await db.execute<UserRow[]>(
            `SELECT id, email, name, firstname, created_at
       FROM \`user\`
       WHERE id = ?`,
            [userId],
        );

        const user = users[0];

        if (!user) {
            return res.status(404).json({
                msg: "Not found",
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Failed to get user:", error);

        return res.status(500).json({
            msg: "Internal server error",
        });
    }
});

router.get("/users/:identifier", authMiddleware, async (req, res) => {
    const identifier = req.params.identifier;

    if (typeof identifier !== "string" || !identifier.trim()) {
        return res.status(400).json({
            msg: "Bad parameter",
        });
    }
    if (typeof req.userId !== "number") {
        return res.status(401).json({
            msg: "Unauthorized",
        });
    }
    const isId = /^\d+$/.test(identifier);

    if (isId && Number(identifier) !== req.userId) {
        return res.status(403).json({ msg: "Forbidden" });
    }

    if (
        isId &&
        (!Number.isSafeInteger(Number(identifier)) || Number(identifier) <= 0)
    ) {
        return res.status(400).json({
            msg: "Bad parameter",
        });
    }

    try {
        const query = isId
            ? "SELECT id, email, name, firstname, created_at FROM `user` WHERE id = ?"
            : "SELECT id, email, name, firstname, created_at FROM `user` WHERE id = ? AND email = ?";

        const values: (string | number)[] = isId
            ? [Number(identifier)]
            : [req.userId, identifier.trim().toLowerCase()];

        const [users] = await db.execute<UserRow[]>(query, values);

        const user = users[0];

        if (!user) {
            return res.status(404).json({
                msg: "Not found",
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Failed to get user:", error);

        return res.status(500).json({
            msg: "Internal server error",
        });
    }
});

type UpdateUserBody = {
    email?: string;
    password?: string;
    name?: string;
    firstname?: string;
};

function isUpdateUserBody(value: unknown): value is UpdateUserBody {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const data = value as Record<string, unknown>;
    const allowed = ["email", "password", "name", "firstname"];
    const keys = Object.keys(data);

    return (
        keys.length > 0 &&
        keys.every(
            (key) => allowed.includes(key) && typeof data[key] === "string",
        )
    );
}

router.put("/users/:id", authMiddleware, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ msg: "Bad parameter" });
    }

    if (req.userId !== id) {
        return res.status(403).json({ msg: "Forbidden" });
    }

    if (!isUpdateUserBody(req.body)) {
        return res.status(400).json({ msg: "Bad parameter" });
    }

    const updates = req.body;
    const fields: string[] = [];
    const values: string[] = [];

    if (updates.email !== undefined) {
        const email = updates.email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ msg: "Bad parameter" });
        }

        fields.push("email = ?");
        values.push(email);
    }

    if (updates.name !== undefined) {
        if (!updates.name.trim()) {
            return res.status(400).json({ msg: "Bad parameter" });
        }

        fields.push("name = ?");
        values.push(updates.name.trim());
    }

    if (updates.firstname !== undefined) {
        if (!updates.firstname.trim()) {
            return res.status(400).json({ msg: "Bad parameter" });
        }

        fields.push("firstname = ?");
        values.push(updates.firstname.trim());
    }

    if (updates.password !== undefined) {
        if (updates.password.length < 8) {
            return res.status(400).json({ msg: "Bad parameter" });
        }

        const hash = await bcrypt.hash(updates.password, 12);
        fields.push("password = ?");
        values.push(hash);
    }

    try {
        values.push(String(id));

        const [result] = await db.execute<ResultSetHeader>(
            `UPDATE \`user\` SET ${fields.join(", ")} WHERE id = ?`,
            values,
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "Not found" });
        }

        const [users] = await db.execute<UserRow[]>(
            "SELECT id, email, name, firstname, created_at FROM `user` WHERE id = ?",
            [id],
        );

        return res.json(users[0]);
    } catch (error) {
        console.error("Update user failed:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

router.delete("/users/:id", authMiddleware, async (req, res) => {
    const rawId = req.params.id;

    // Vérifier que l'identifiant est valide
    if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) {
        return res.status(400).json({ msg: "Bad parameter" });
    }

    const id = Number(rawId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ msg: "Bad parameter" });
    }

    // Empêcher la suppression d'un autre compte
    if (req.userId !== id) {
        return res.status(403).json({ msg: "Forbidden" });
    }

    try {
        // Supprimer l'utilisateur de MySQL
        const [result] = await db.execute<ResultSetHeader>(
            "DELETE FROM `user` WHERE id = ?",
            [id],
        );

        // Vérifier si l'utilisateur existait
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "Not found" });
        }

        // Confirmer la suppression
        return res.status(200).json({
            msg: `Successfully deleted record number: ${id}`,
        });
    } catch (error) {
        console.error("Delete user failed:", error);

        return res.status(500).json({
            msg: "Internal server error",
        });
    }
});

export default router;
