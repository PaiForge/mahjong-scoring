import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listIapPurchases: vi.fn(),
  postAppleTransaction: vi.fn(),
  invalidatePlan: vi.fn(),
}));

vi.mock("./iap", () => ({
  connectIap: vi.fn(),
  finishIapPurchase: vi.fn(),
  listIapPurchases: mocks.listIapPurchases,
  onIapPurchase: vi.fn(),
}));
vi.mock("./iap-availability", () => ({ IAP_AVAILABLE: true }));
vi.mock("./plan-api", () => ({
  postAppleTransaction: mocks.postAppleTransaction,
}));
vi.mock("./use-plan", () => ({ invalidatePlan: mocks.invalidatePlan }));
vi.mock("../auth/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("../components/toast", () => ({ showToast: vi.fn() }));

import { restoreIapPurchases } from "./use-purchase-sync";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("restoreIapPurchases", () => {
  it("端末の購入を読めなかったら、送らずに failed を返す", async () => {
    mocks.listIapPurchases.mockResolvedValue({ ok: false });

    await expect(restoreIapPurchases("user-a")).resolves.toBe("failed");

    expect(mocks.postAppleTransaction).not.toHaveBeenCalled();
  });

  it("端末に購入が無ければ nothingToRestore を返す", async () => {
    mocks.listIapPurchases.mockResolvedValue({ ok: true, purchases: [] });

    await expect(restoreIapPurchases("user-a")).resolves.toBe(
      "nothingToRestore",
    );
  });
});
