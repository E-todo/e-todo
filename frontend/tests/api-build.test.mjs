import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build as viteBuild } from "vite";

const frontend = fileURLToPath(new URL("..", import.meta.url));
async function build(apiUrl) {
  const outDir = mkdtempSync(join(tmpdir(), "my-e-todo-api-build-"));
  const originalApiUrl = process.env.VITE_API_URL;
  if (apiUrl === undefined) delete process.env.VITE_API_URL;
  else process.env.VITE_API_URL = apiUrl;

  try {
    await viteBuild({
      root: frontend,
      logLevel: "silent",
      build: { outDir, emptyOutDir: true },
    });
    return readFileSync(join(outDir, "assets", readdirSync(join(outDir, "assets")).find((file) => file.endsWith(".js"))), "utf8");
  } finally {
    if (originalApiUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = originalApiUrl;
    rmSync(outDir, { recursive: true, force: true });
  }
}

test("a production build without VITE_API_URL uses the production API", async () => {
  const bundle = await build();
  assert.ok(bundle.includes("https://e-todo-api.vercel.app"), "production API URL missing from bundle");
  assert.ok(!bundle.includes("http://localhost:3000"), "localhost API URL found in production bundle");
});

test("a production build rejects a localhost API override", async () => {
  await assert.rejects(build("http://localhost:3000"), /VITE_API_URL.*localhost/);
});

test("a production build uses a configured API URL", async () => {
  const bundle = await build("https://example-api.test");
  assert.ok(bundle.includes("https://example-api.test"), "configured API URL missing from bundle");
  assert.ok(!bundle.includes("http://localhost:3000"), "localhost API URL found in production bundle");
});
