import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, localDate, shiftMonth } from '../src/utils/dates.ts';
import { readStorage, writeStorage } from '../src/utils/storage.ts';
import { createTask, updateTask, getTasks, deleteTask } from '../src/api/tasks.ts';

const store = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: key => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: key => store.delete(key),
}});

test('calendar: Monday start, leap year, full weeks and year boundaries', () => {
  const february = calendarDays('2024-02');
  assert.equal(february.length % 7, 0);
  assert.equal(february[3], '2024-02-01');
  assert.equal(february.filter(Boolean).length, 29);
  assert.equal(calendarDays('2026-02').filter(Boolean).length, 28);
  assert.equal(calendarDays('2026-11')[6], '2026-11-01');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(localDate(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
});

test('storage stays usable when blocked', () => {
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
  assert.equal(readStorage('key'), null);
  assert.doesNotThrow(() => writeStorage('key', 'value'));
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
});

test('task API: priority and optional dates survive reload and status updates', async () => {
  store.clear();
  let row;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : {};
    if (options.method === 'POST') row = { id: 123, ...body };
    if (options.method === 'PUT') row = { ...row, ...body };
    return new Response(JSON.stringify(options.method ? row : [row]), { status: 200 });
  };
  try {
    const created = await createTask({ title: 'Task', description: '', priority: 'high', status: 'todo' });
    assert.equal(created.priority, 'high');
    assert.equal(created.dueDate, undefined);
    assert.equal((await getTasks())[0].dueDate, undefined);
    assert.equal((await updateTask(123, { status: 'in_progress' })).priority, 'high');
    assert.equal((await updateTask(123, { dueDate: '2026-12-03', priority: 'low' })).dueDate, '2026-12-03');
    assert.equal((await getTasks())[0].priority, 'low');
    assert.equal((await updateTask(123, { dueDate: '' })).dueDate, undefined);
    assert.equal((await getTasks())[0].dueDate, undefined);
    await deleteTask(123);
    assert.equal([...store.keys()].some(key => key.startsWith('my-e-todo-task:')), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('failed API updates do not replace saved local values', async () => {
  const key = 'my-e-todo-task:http://localhost:3000:123';
  store.set(key, JSON.stringify({ priority: 'high', noDate: true }));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ msg: 'Server error' }), { status: 500 });
  try {
    await assert.rejects(updateTask(123, { priority: 'low', dueDate: '2027-01-01' }), /Server error/);
    assert.deepEqual(JSON.parse(store.get(key)), { priority: 'high', noDate: true });
  } finally { globalThis.fetch = originalFetch; }
});
