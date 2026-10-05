// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConstructEvent,
  mockHasProcessed,
  mockMarkProcessed,
  mockDispatch,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockHasProcessed: vi.fn(),
  mockMarkProcessed: vi.fn(),
  mockDispatch: vi.fn(),
}));

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mockConstructEvent } }),
}));
vi.mock("@/lib/billing/env", () => ({
  getStripeSecretKey: () => process.env.STRIPE_SECRET_KEY,
  getStripeWebhookSecret: () => "whsec_test",
}));
vi.mock("@/lib/billing/webhook-events-log", () => ({
  hasProcessedWebhookEvent: mockHasProcessed,
  markWebhookEventProcessed: mockMarkProcessed,
}));
vi.mock("@/lib/billing/webhook-handlers", () => ({
  dispatchStripeEvent: mockDispatch,
}));

import { POST } from "./route";

const EVENT = {
  id: "evt_1",
  type: "checkout.session.completed",
  livemode: false,
  data: { object: { id: "cs_1" } },
};

/** `signature` が null なら署名ヘッダを付けない（undefined は既定値に化けるので使わない） */
function request(body = "{}", signature: string | null = "sig") {
  const headers = new Headers();
  if (signature !== null) headers.set("stripe-signature", signature);
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
  mockConstructEvent.mockReturnValue(EVENT);
  mockHasProcessed.mockResolvedValue(false);
  mockMarkProcessed.mockResolvedValue(undefined);
  mockDispatch.mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/stripe/webhook", () => {
  it("署名ヘッダが無ければ 400", async () => {
    const res = await POST(request("{}", null));
    expect(res.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("生のボディで署名を検証し、失敗は 400", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const res = await POST(request('{"raw":true}', "sig"));

    expect(res.status).toBe(400);
    expect(mockConstructEvent).toHaveBeenCalledWith(
      '{"raw":true}',
      "sig",
      "whsec_test",
    );
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("本番の鍵でテストのイベントが来たら 400（livemode 不一致）", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_x");

    const res = await POST(request());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "livemodeMismatch" });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("処理済みのイベントは処理せず 200", async () => {
    mockHasProcessed.mockResolvedValue(true);

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: true });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("処理に成功したら処理済みとして記録し 200", async () => {
    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalledWith(EVENT);
    expect(mockMarkProcessed).toHaveBeenCalledWith(
      "evt_1",
      "checkout.session.completed",
    );
    // 記録は処理の後（失敗した再送を「処理済み」として捨てないため）
    expect(mockDispatch.mock.invocationCallOrder[0]).toBeLessThan(
      mockMarkProcessed.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("購読していない種別は処理済みとして記録しない", async () => {
    mockDispatch.mockResolvedValue(false);

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("処理が失敗したら記録せず 500（Stripe に再送させる）", async () => {
    mockDispatch.mockRejectedValue(new Error("db down"));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(mockMarkProcessed).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
