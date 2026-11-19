import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const chrome = process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "google-chrome");
const profile = mkdtempSync(join(tmpdir(), "e-todo-password-test-"));
const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4177", "--strictPort"], { stdio: "ignore" });
const browser = spawn(chrome, ["--headless=new", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
let ws;
let sequence = 0;
const pending = new Map();
const delay = (ms) => new Promise((done) => setTimeout(done, ms));

async function until(check, description) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const value = await check();
    if (value) return value;
    if (vite.exitCode !== null || browser.exitCode !== null) break;
    await delay(100);
  }
  throw new Error(`Délai dépassé : ${description}`);
}

function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolveMessage, reject) => {
    pending.set(id, { resolveMessage, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const message = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (message.exceptionDetails) throw new Error(message.exceptionDetails.text);
  return message.result.value;
}

async function fill(id, value) {
  await evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`);
  await send("Input.insertText", { text: value });
  assert.equal(await evaluate(`document.getElementById(${JSON.stringify(id)}).value`), value);
}

async function replace(id, value) {
  await evaluate(`document.getElementById(${JSON.stringify(id)}).select()`);
  await send("Input.insertText", { text: value });
  assert.equal(await evaluate(`document.getElementById(${JSON.stringify(id)}).value`), value);
}

async function toggle(id, value) {
  const selector = `document.getElementById(${JSON.stringify(id)})`;
  const inspect = () => evaluate(`(() => { const input = ${selector}; const button = input.nextElementSibling; return { type: input.type, value: input.value, label: button.getAttribute('aria-label'), buttonType: button.type, pressed: button.getAttribute('aria-pressed'), icon: button.querySelector('svg').outerHTML, height: input.getBoundingClientRect().height, paddingRight: getComputedStyle(input).paddingRight }; })()`);
  const before = await inspect();
  assert.equal(before.type, "password");
  assert.equal(before.buttonType, "button");
  assert.equal(before.label, "Afficher le mot de passe");
  assert.equal(before.pressed, "false");
  assert.equal(before.value, value);
  assert.ok(parseFloat(before.paddingRight) >= 48);
  await evaluate(`${selector}.nextElementSibling.click()`);
  await until(async () => (await inspect()).type === "text", `${id} visible`);
  const shown = await inspect();
  assert.equal(shown.value, value);
  assert.equal(shown.label, "Masquer le mot de passe");
  assert.equal(shown.pressed, "true");
  assert.notEqual(shown.icon, before.icon);
  assert.equal(shown.height, before.height);
  await evaluate(`${selector}.nextElementSibling.click()`);
  await until(async () => (await inspect()).type === "password", `${id} masqué`);
  assert.equal((await inspect()).value, value);
}

async function navigate(path, id) {
  await send("Page.navigate", { url: `http://127.0.0.1:4177${path}` });
  await until(async () => evaluate(`Boolean(document.getElementById(${JSON.stringify(id)}))`).catch(() => false), `${path} chargé`);
}

try {
  await until(() => existsSync(join(profile, "DevToolsActivePort")), "Chrome démarré");
  await until(async () => fetch("http://127.0.0.1:4177").then((r) => r.ok).catch(() => false), "Vite démarré");
  const [port] = readFileSync(join(profile, "DevToolsActivePort"), "utf8").trim().split("\n");
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  ws = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((done, reject) => { ws.onopen = done; ws.onerror = reject; });
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolveMessage(message.result);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__requests = [];
    window.fetch = async (url, options = {}) => {
      const path = new URL(url).pathname;
      window.__requests.push({ path, method: options.method, body: options.body && JSON.parse(options.body) });
      const data = path === '/login' || path === '/register' ? { token: 'test-token' }
        : path === '/user' ? { id: 1, email: 'test@example.com', name: 'Test', firstname: 'User', created_at: '2026-11-19' }
        : path === '/user/password' ? { msg: 'ok' } : [];
      return { ok: true, json: async () => data };
    };
  ` });

  await navigate("/login", "password");
  assert.equal(await evaluate("document.getElementById('password').required"), true);
  assert.equal(await evaluate("document.getElementById('password').autocomplete"), "current-password");
  await fill("email", "test@example.com");
  await fill("password", "secret123");
  await toggle("password", "secret123");
  await evaluate("document.getElementById('password').nextElementSibling.focus()");
  assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"), "Afficher le mot de passe");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", text: "\r", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await until(async () => evaluate("document.getElementById('password').type === 'text'"), "activation au clavier");
  assert.equal(await evaluate("document.getElementById('password').value"), "secret123");
  assert.equal(await evaluate("window.__requests.length"), 0);
  await evaluate("document.querySelector('.auth-form').requestSubmit()");
  await until(async () => evaluate("window.__requests.some(r => r.path === '/login')"), "connexion envoyée");
  assert.deepEqual(await evaluate("window.__requests.find(r => r.path === '/login').body"), { email: "test@example.com", password: "secret123" });
  await until(async () => evaluate("location.pathname === '/home'"), "connexion terminée");

  await navigate("/profile", "profile-firstname");
  await evaluate("document.querySelector('.profile-password-button').click()");
  await until(async () => evaluate("Boolean(document.getElementById('current-password'))"), "dialogue ouvert");
  assert.deepEqual(await evaluate("['current-password', 'new-password', 'confirm-password'].map(id => { const input = document.getElementById(id); return [input.required, input.minLength, input.autocomplete]; })"), [[true, -1, "current-password"], [true, 8, "new-password"], [true, 8, "new-password"]]);
  for (const [id, value] of [["current-password", "oldsecret"], ["new-password", "newsecret123"], ["confirm-password", "newsecret123"]]) {
    await fill(id, value);
    await toggle(id, value);
  }
  await evaluate("document.getElementById('current-password').nextElementSibling.click()");
  await until(async () => evaluate("document.getElementById('current-password').type === 'text'"), "champ actuel visible");
  assert.equal(await evaluate("document.getElementById('new-password').type"), "password");
  assert.equal(await evaluate("document.getElementById('confirm-password').type"), "password");
  assert.equal(await evaluate("window.__requests.filter(r => r.path === '/user/password').length"), 0);
  await replace("confirm-password", "different123");
  await evaluate("document.querySelector('.password-dialog').requestSubmit()");
  await until(async () => evaluate("Boolean(document.querySelector('.password-dialog [role=alert]'))"), "validation de confirmation");
  assert.equal(await evaluate("window.__requests.filter(r => r.path === '/user/password').length"), 0);
  await replace("confirm-password", "newsecret123");
  await evaluate("document.querySelector('.password-dialog').requestSubmit()");
  await until(async () => evaluate("window.__requests.some(r => r.path === '/user/password')"), "changement envoyé");
  assert.deepEqual(await evaluate("window.__requests.find(r => r.path === '/user/password').body"), { currentPassword: "oldsecret", newPassword: "newsecret123", confirmPassword: "newsecret123" });

  await evaluate("localStorage.removeItem('my-e-todo-token')");
  await navigate("/register", "register-password");
  assert.deepEqual(await evaluate("(() => { const input = document.getElementById('register-password'); return [input.required, input.minLength, input.autocomplete]; })()"), [true, 8, "new-password"]);
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("(() => { const input = document.getElementById('register-password'); const button = input.nextElementSibling; const field = input.getBoundingClientRect(); const eye = button.getBoundingClientRect(); return field.width > 0 && field.right <= innerWidth && eye.left >= field.left && eye.right <= field.right && Math.abs((eye.top + eye.bottom) / 2 - (field.top + field.bottom) / 2) < 1; })()"), true);
  for (const [id, value] of [["firstname", "User"], ["name", "Test"], ["register-email", "test@example.com"], ["register-password", "short"]]) await fill(id, value);
  await evaluate("document.querySelector('.auth-form').requestSubmit()");
  assert.equal(await evaluate("window.__requests.length"), 0);
  await replace("register-password", "secret123");
  await toggle("register-password", "secret123");
  assert.equal(await evaluate("window.__requests.length"), 0);
  await evaluate("document.querySelector('.auth-form').requestSubmit()");
  await until(async () => evaluate("window.__requests.some(r => r.path === '/register')"), "inscription envoyée");
  assert.deepEqual(await evaluate("window.__requests.find(r => r.path === '/register').body"), { firstname: "User", name: "Test", email: "test@example.com", password: "secret123" });
  console.log("OK : cinq champs, affichage indépendant, formulaires et changement de mot de passe");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  ws?.close();
  browser.kill();
  vite.kill();
  await delay(500);
  const resolved = resolve(profile);
  if (resolved.startsWith(resolve(tmpdir()) + sep)) {
    try { rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (error) { console.warn(`Nettoyage Chrome impossible : ${error.message}`); }
  }
}
