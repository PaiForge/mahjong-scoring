import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { select: mockSelect, insert: mockInsert },
  stripeWebhookEvents: {
    _name: "stripe_webhook_events",
    eventId: "event_id",
    eventType: "event_type",
  },
}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { createQueryChain } from "@/test/drizzle-mock";

import {
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
} from "../webhook-events-log";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hasProcessedWebhookEvent", () => {
  it("行があれば true、無ければ false", async () => {
    mockSelect.mockReturnValue(createQueryChain([{ eventId: "evt_1" }]));
    expect(await hasProcessedWebhookEvent("evt_1")).toBe(true);
    mockSelect.mockReturnValue(createQueryChain([]));
    expect(await hasProcessedWebhookEvent("evt_1")).toBe(false);
  });
});

describe("markWebhookEventProcessed", () => {
  it("event_id の衝突は無視して入れる", async () => {
    const chain = createQueryChain(undefined);
    chain.onConflictDoNothing.mockResolvedValue(undefined);
    mockInsert.mockReturnValue(chain);

    await markWebhookEventProcessed("evt_1", "charge.refunded");

    expect(chain.values).toHaveBeenCalledWith({
      eventId: "evt_1",
      eventType: "charge.refunded",
    });
    expect(chain.onConflictDoNothing).toHaveBeenCalledWith({
      target: "event_id",
    });
  });
});
