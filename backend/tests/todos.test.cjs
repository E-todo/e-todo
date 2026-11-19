const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../dist/config/db").default;
const todoRoutes = require("../dist/routes/todos/todos").default;

test("l'API crée, ajoute et retire une échéance sans affaiblir la validation", async () => {
  const originalExecute = db.execute;
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-local";
  const rows = new Map();
  let nextId = 1;
  db.execute = async (sql, values) => {
    if (sql.startsWith("INSERT INTO")) {
      const id = nextId++;
      rows.set(id, {
        id, title: values[0], description: values[1], due_time: values[2],
        status: values[3], user_id: values[4],
      });
      return [{ insertId: id }];
    }
    if (sql.startsWith("UPDATE")) {
      const id = values.at(-2);
      const row = rows.get(id);
      if (!row || row.user_id !== values.at(-1)) return [{ affectedRows: 0 }];
      const fields = sql.match(/SET (.+)\s+WHERE/s)[1].split(", ");
      fields.forEach((field, index) => { row[field.split(" = ")[0]] = values[index]; });
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith("SELECT")) {
      const row = rows.get(values[0]);
      return [[row && row.user_id === values[1] ? { ...row } : undefined].filter(Boolean)];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };

  const app = express();
  app.use(express.json());
  app.use(todoRoutes);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    async function request(method, path, body) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    }
    const base = { title: "Tâche", description: "" };
    const omitted = await request("POST", "/todos", base);
    assert.equal(omitted.status, 201);
    assert.equal(omitted.body.due_time, null);

    const explicitNull = await request("POST", "/todos", { ...base, due_time: null });
    assert.equal(explicitNull.status, 201);
    assert.equal(explicitNull.body.due_time, null);

    const dated = await request("POST", "/todos", { ...base, due_time: "2026-11-20 23:59:59" });
    assert.equal(dated.status, 201);
    assert.equal(dated.body.due_time, "2026-11-20 23:59:59");

    const addDate = await request("PUT", `/todos/${omitted.body.id}`, { due_time: "2026-11-21 23:59:59" });
    assert.equal(addDate.status, 200);
    assert.equal(addDate.body.due_time, "2026-11-21 23:59:59");

    const removeDate = await request("PUT", `/todos/${omitted.body.id}`, { due_time: null });
    assert.equal(removeDate.status, 200);
    assert.equal(removeDate.body.due_time, null);

    assert.equal((await request("POST", "/todos", { ...base, due_time: "2026-02-30 23:59:59" })).status, 400);
    assert.equal((await request("PUT", `/todos/${dated.body.id}`, { due_time: "invalid" })).status, 400);
    assert.equal((await request("PUT", `/todos/${dated.body.id}`, { user_id: 2, due_time: null })).status, 400);
  } finally {
    server.close();
    db.execute = originalExecute;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
