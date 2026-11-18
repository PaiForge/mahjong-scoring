// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryChain } from "@/test/drizzle-mock";
const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../../_lib/auth", () => ({ requireAdminActor: mocks.actor }));
vi.mock("../../_lib/content-action", async (original) => ({
  ...(await original<object>()),
  recordContentAction: mocks.audit,
}));
vi.mock("@/lib/db", async () => ({
  ...(await import("@/lib/db/schema")),
  db: { transaction: mocks.transaction },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/log-error", () => ({ logExternalError: vi.fn() }));
import { setDailyProblemVisibility } from "./set-daily-problem-visibility";

const input = {
  day: "2026-11-18",
  hidden: true,
  reason: "Scoring requires review",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue({ actorId: "admin", ipAddress: "127.0.0.1" });
});
describe("daily problem visibility", () => {
  it("requires admin permission before reading or writing", async () => {
    mocks.actor.mockResolvedValue({ error: "unauthorized" });
    expect(await setDailyProblemVisibility(input)).toEqual({
      error: "unauthorized",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each([
    { ...input, reason: " " },
    { ...input, day: "2026-02-30" },
    { ...input, hidden: "yes" },
  ])("rejects invalid input", async (value) => {
    expect(await setDailyProblemVisibility(value)).toEqual({
      error: "invalidInput",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each([true, false])(
    "locks the day and audits publication changes: %s",
    async (hidden) => {
      const select = createQueryChain([
        { day: input.day, withheldReason: "old reason" },
      ]);
      const update = createQueryChain([]);
      const tx = { select: select.select, update: update.update };
      mocks.transaction.mockImplementation((body) => body(tx));
      expect(await setDailyProblemVisibility({ ...input, hidden })).toEqual({
        success: true,
      });
      expect(select.for).toHaveBeenCalledWith("update");
      expect(update.set).toHaveBeenCalledWith({
        withheldReason: hidden ? input.reason : null,
      });
      expect(mocks.audit).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          target: { type: "daily_problem", key: input.day },
          metadata: {
            reason: input.reason,
            before: "old reason",
            after: hidden ? input.reason : null,
          },
        }),
      );
      expect(mocks.revalidate).toHaveBeenCalledWith("/en/daily-problem");
      expect(mocks.revalidate).toHaveBeenCalledWith("/ja/dashboard");
    },
  );
  it("does not manufacture a problem for a missing day", async () => {
    const select = createQueryChain([]);
    mocks.transaction.mockImplementation((body) =>
      body({ select: select.select }),
    );
    expect(await setDailyProblemVisibility(input)).toEqual({
      error: "notFound",
    });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("treats failure of the audit transaction as failure of the change", async () => {
    mocks.transaction.mockRejectedValue(new Error("audit unavailable"));
    expect(await setDailyProblemVisibility(input)).toEqual({
      error: "saveFailed",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
