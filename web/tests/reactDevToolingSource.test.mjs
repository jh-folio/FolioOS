import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("React dev tooling is gated by Vite DEV and the opt-out flag", async () => {
  const source = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");

  assert.match(source, /import\.meta\.env\.DEV/);
  assert.match(source, /VITE_DISABLE_REACT_DEVTOOLS/);
  assert.match(source, /void import\("react-grab"\)/);
  assert.match(source, /void import\("react-scan"\)/);
  assert.match(source, /import\.meta\.env\.DEV\s*&&\s*!reactDevToolsDisabled/);
});
