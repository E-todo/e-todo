import assert from "node:assert/strict";
import test from "node:test";
import { createTask, getTasks, updateTask } from "../src/api/tasks.ts";
import { matchesTaskFilters } from "../src/utils/taskFilters.ts";

globalThis.localStorage = { getItem: () => null };

const apiTask = (due_time) => ({
  id: 1,
  title: "Tâche",
  description: "",
  due_time,
  status: "todo",
});

function mockResponse(data, onRequest = () => {}) {
  globalThis.fetch = async (_url, options) => {
    onRequest(options);
    return { ok: true, json: async () => data };
  };
}

test("charge une tâche sans date et conserve une tâche datée", async () => {
  mockResponse([apiTask(null), { ...apiTask("2026-11-20T23:59:59.000Z"), id: 2 }]);
  assert.deepEqual((await getTasks()).map((task) => task.dueDate), [null, "2026-11-20"]);
});

test("crée une tâche sans date avec due_time null", async () => {
  let body;
  mockResponse(apiTask(null), (options) => { body = JSON.parse(options.body); });
  const task = await createTask({ title: "Tâche", description: "", dueDate: null, status: "todo" });
  assert.equal(body.due_time, null);
  assert.equal(task.dueDate, null);
});

test("crée une tâche datée", async () => {
  let body;
  mockResponse(apiTask("2026-11-20 23:59:59"), (options) => { body = JSON.parse(options.body); });
  const task = await createTask({ title: "Tâche", description: "", dueDate: "2026-11-20", status: "todo" });
  assert.equal(body.due_time, "2026-11-20 23:59:59");
  assert.equal(task.dueDate, "2026-11-20");
});

test("ajoute puis retire une date via la mise à jour", async () => {
  const bodies = [];
  mockResponse(apiTask("2026-11-20 23:59:59"), (options) => { bodies.push(JSON.parse(options.body)); });
  await updateTask(1, { dueDate: "2026-11-20" });
  mockResponse(apiTask(null), (options) => { bodies.push(JSON.parse(options.body)); });
  await updateTask(1, { dueDate: null });
  assert.deepEqual(bodies, [{ due_time: "2026-11-20 23:59:59" }, { due_time: null }]);
});

test("refuse une date invalide avant l'envoi", async () => {
  await assert.rejects(
    createTask({ title: "Tâche", description: "", dueDate: "2026-02-30", status: "todo" }),
  );
});

test("refuse une date invalide dans la réponse API", async () => {
  mockResponse([apiTask("2026-02-30 23:59:59")]);
  await assert.rejects(getTasks(), /Réponse de tâche invalide/);
});

test("une tâche sans date ne passe jamais le filtre En retard", () => {
  const task = { id: 1, title: "Tâche", description: "", dueDate: null, status: "todo" };
  const overdueOnly = { search: "", overdueOnly: true };
  assert.equal(matchesTaskFilters(task, "2026-11-19", overdueOnly), false);
  assert.equal(matchesTaskFilters({ ...task, dueDate: "2026-11-18" }, "2026-11-19", overdueOnly), true);
  assert.equal(matchesTaskFilters(task, "2026-11-19", { ...overdueOnly, overdueOnly: false }), true);
});
