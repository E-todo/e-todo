
import { Router } from "express";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import db from "../../config/db";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

type TodoStatus = "not started" | "todo" | "in progress" | "done";

interface TodoRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  created_at: Date;
  due_time: Date;
  status: TodoStatus;
  user_id: number;
}

type CreateTodoBody = {
  title: string;
  description: string;
  due_time: string;
  status?: TodoStatus;
  user_id?: number;
};

function isTodoStatus(value: unknown): value is TodoStatus {
  return (
    value === "not started" ||
    value === "todo" ||
    value === "in progress" ||
    value === "done"
  );
}

function isValidDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(value.replace(" ", "T") + "Z");

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 19).replace("T", " ") === value
  );
}

function isCreateTodoBody(value: unknown): value is CreateTodoBody {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.title === "string" &&
    typeof data.description === "string" &&
    typeof data.due_time === "string" &&
    (data.status === undefined || isTodoStatus(data.status)) &&
    (data.user_id === undefined || (
      typeof data.user_id === "number" &&
      Number.isSafeInteger(data.user_id)
    ))
  );
}

// GET /todos - Récupérer toutes les tâches

router.get("/todos", authMiddleware, async (_req, res) => {
  try {
    const [todos] = await db.execute<TodoRow[]>(
      "SELECT * FROM `todo` ORDER BY id DESC"
    );

    return res.status(200).json(todos);
  } catch (error) {
    console.error("Get todos failed:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

// GET /todos/:id - Récupérer une tâche

router.get("/todos/:id", authMiddleware, async (req, res) => {
  const rawId = req.params.id;

  if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  try {
    const [todos] = await db.execute<TodoRow[]>(
      "SELECT * FROM `todo` WHERE id = ?",
      [id]
    );

    const todo = todos[0];

    if (!todo) {
      return res.status(404).json({ msg: "Not found" });
    }

    return res.status(200).json(todo);
  } catch (error) {
    console.error("Get todo failed:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

// POST /todos - Créer une tâche

router.post("/todos", authMiddleware, async (req, res) => {
  const userId = req.userId;

  if (typeof userId !== "number") {
    return res.status(401).json({
      msg: "No token, authorization denied"
    });
  }

  if (!isCreateTodoBody(req.body)) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  const { title, description, due_time, status, user_id } = req.body;

  if (
    !title.trim() ||
    title.length > 255 ||
    !isValidDateTime(due_time) ||
    (user_id !== undefined && user_id !== userId)
  ) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO \`todo\`
       (title, description, due_time, status, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description,
        due_time,
        status ?? "not started",
        userId
      ]
    );

    const [todos] = await db.execute<TodoRow[]>(
      "SELECT * FROM `todo` WHERE id = ?",
      [result.insertId]
    );

    const todo = todos[0];

    if (!todo) {
      return res.status(500).json({
        msg: "Internal server error"
      });
    }

    return res.status(201).json(todo);
  } catch (error) {
    console.error("Create todo failed:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
});


type UpdateTodoBody = {
  title?: string;
  description?: string;
  due_time?: string;
  status?: TodoStatus;
  user_id?: number;
};

function isUpdateTodoBody(
  value: unknown
): value is UpdateTodoBody {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;
  const keys = Object.keys(data);

  const allowed = [
    "title",
    "description",
    "due_time",
    "status",
    "user_id"
  ];

  return (
    keys.length > 0 &&
    keys.every(key => allowed.includes(key)) &&
    (data.title === undefined ||
      typeof data.title === "string") &&
    (data.description === undefined ||
      typeof data.description === "string") &&
    (data.due_time === undefined ||
      typeof data.due_time === "string") &&
    (data.status === undefined ||
      isTodoStatus(data.status)) &&
    (data.user_id === undefined ||
      (typeof data.user_id === "number" &&
       Number.isSafeInteger(data.user_id)))
  );
}

// PUT /todos/:id - Modifier une tâche

router.put("/todos/:id", authMiddleware, async (req, res) => {
  const rawId = req.params.id;
  const userId = req.userId;

  if (
    typeof rawId !== "string" ||
    !/^\d+$/.test(rawId)
  ) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  if (typeof userId !== "number") {
    return res.status(401).json({
      msg: "No token, authorization denied"
    });
  }

  if (!isUpdateTodoBody(req.body)) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  const updates = req.body;

  if (
    (updates.user_id !== undefined &&
     updates.user_id !== userId) ||
    (updates.title !== undefined &&
     (!updates.title.trim() || updates.title.length > 255)) ||
    (updates.due_time !== undefined &&
     !isValidDateTime(updates.due_time))
  ) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title.trim());
  }

  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }

  if (updates.due_time !== undefined) {
    fields.push("due_time = ?");
    values.push(updates.due_time);
  }

  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  if (fields.length === 0) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  try {
    const [todos] = await db.execute<TodoRow[]>(
      "SELECT * FROM `todo` WHERE id = ?",
      [id]
    );

    const todo = todos[0];

    if (!todo) {
      return res.status(404).json({ msg: "Not found" });
    }

    if (todo.user_id !== userId) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE \`todo\`
       SET ${fields.join(", ")}
       WHERE id = ? AND user_id = ?`,
      [...values, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "Not found" });
    }

    const [updated] = await db.execute<TodoRow[]>(
      "SELECT * FROM `todo` WHERE id = ?",
      [id]
    );

    return res.status(200).json(updated[0]);

  } catch (error) {
    console.error("Update todo failed:", error);

    return res.status(500).json({
      msg: "Internal server error"
    });
  }
});


router.delete("/todos/:id", authMiddleware, async (req, res) => {
  const rawId = req.params.id;
  const userId = req.userId;

  // Vérifier que l'identifiant est valide
  if (
    typeof rawId !== "string" ||
    !/^\d+$/.test(rawId)
  ) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ msg: "Bad parameter" });
  }

  // Vérifier que l'utilisateur est authentifié
  if (typeof userId !== "number") {
    return res.status(401).json({
      msg: "No token, authorization denied"
    });
  }

  try {
    // Rechercher la tâche dans MySQL
    const [todos] = await db.execute<TodoRow[]>(
      "SELECT * FROM `todo` WHERE id = ?",
      [id]
    );

    const todo = todos[0];

    // La tâche n'existe pas
    if (!todo) {
      return res.status(404).json({ msg: "Not found" });
    }

    // Empêcher la suppression de la tâche d'un autre utilisateur
    if (todo.user_id !== userId) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    // Supprimer la tâche
    const [result] = await db.execute<ResultSetHeader>(
      "DELETE FROM `todo` WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "Not found" });
    }

    // Confirmer la suppression
    return res.status(200).json({
      msg: `Successfully deleted record number: ${id}`
    });

  } catch (error) {
    console.error("Delete todo failed:", error);

    return res.status(500).json({
      msg: "Internal server error"
    });
  }
});

export default router;