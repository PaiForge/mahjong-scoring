import { afterEach, expect, it, vi } from "vitest";
vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));
import dotenv from "dotenv";
import { loadScriptEnv } from "./load-script-env";
const argv = [...process.argv];
afterEach(() => {
  process.argv = [...argv];
  vi.clearAllMocks();
});
it("can use injected environment without reading env files", () => {
  process.argv.push("--no-env");
  loadScriptEnv();
  expect(dotenv.config).not.toHaveBeenCalled();
});
it("preserves ordinary CLI environment loading", () => {
  loadScriptEnv();
  expect(dotenv.config).toHaveBeenCalledWith({ path: [".env.local", ".env"] });
});
