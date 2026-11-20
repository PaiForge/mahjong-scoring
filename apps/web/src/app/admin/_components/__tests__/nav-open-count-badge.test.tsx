import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin } = vi.hoisted(() => ({ mockRequireAdmin: vi.fn() }));

vi.mock("../../_lib/auth", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve(
      (key: string, values: { count: number }) =>
        `${key}:${String(values.count)}`,
    ),
}));

const { NavOpenCountBadge } = await import("../nav-open-count-badge");

/** サーバーコンポーネントを解決してから描く */
async function show(count: () => Promise<number>) {
  const element = await NavOpenCountBadge({ count });
  return render(<div data-testid="slot">{element}</div>);
}

describe("NavOpenCountBadge", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("管理者には未対応の件数を数字と読み上げ用の文言で出す", async () => {
    mockRequireAdmin.mockResolvedValue({ userId: "admin" });
    await show(() => Promise.resolve(3));
    expect(screen.getByTestId("slot").textContent).toBe("3openCount:3");
  });

  it("99 件を超えたら数字は 99+ で止め、読み上げは実数のまま", async () => {
    mockRequireAdmin.mockResolvedValue({ userId: "admin" });
    await show(() => Promise.resolve(120));
    expect(screen.getByTestId("slot").textContent).toBe("99+openCount:120");
  });

  it("0 件なら何も描かない", async () => {
    mockRequireAdmin.mockResolvedValue({ userId: "admin" });
    await show(() => Promise.resolve(0));
    expect(screen.getByTestId("slot").textContent).toBe("");
  });

  it("管理者でなければ数えず、何も描かない", async () => {
    mockRequireAdmin.mockResolvedValue({ error: "unauthorized" });
    const count = vi.fn(() => Promise.resolve(3));
    await show(count);
    expect(count).not.toHaveBeenCalled();
    expect(screen.getByTestId("slot").textContent).toBe("");
  });
});
