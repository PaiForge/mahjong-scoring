import { beforeEach, describe, expect, it, vi } from "vitest";

const holder = vi.hoisted(() => ({
  values: vi.fn<() => Promise<void>>(),
}));

vi.mock("./db", () => ({
  db: { insert: vi.fn(() => ({ values: holder.values })) },
  userActivityLog: { _name: "user_activity_log" },
}));
vi.mock("./log-error", async () => await import("@/test/log-error-mock"));

import { logActivityEvent } from "./activity-log";
import { logExternalError } from "./log-error";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logActivityEvent", () => {
  it("書き込みに成功したらログを出さない", async () => {
    holder.values.mockResolvedValue(undefined);
    logActivityEvent({ userId: "user-1", action: "profile_updated" });
    await vi.waitFor(() => expect(holder.values).toHaveBeenCalled());
    await Promise.resolve();
    expect(logExternalError).not.toHaveBeenCalled();
  });

  it("書き込みの失敗は投げずにログへ残す", async () => {
    const error = new Error("db down");
    holder.values.mockRejectedValue(error);
    expect(() =>
      logActivityEvent({ userId: "user-1", action: "profile_updated" }),
    ).not.toThrow();
    await vi.waitFor(() =>
      expect(logExternalError).toHaveBeenCalledWith(
        "logActivityEvent",
        "failed to record profile_updated",
        error,
      ),
    );
  });
});
