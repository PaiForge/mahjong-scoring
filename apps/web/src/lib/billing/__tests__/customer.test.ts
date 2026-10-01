import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsert, mockCustomersCreate, selectHolder } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockCustomersCreate: vi.fn(),
  selectHolder: {} as {
    seq?: import("@/test/drizzle-mock").SelectSequenceMock;
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", async () => {
  const schema = await import("@/test/schema-mock");
  const { createSelectSequenceMock } = await import("@/test/drizzle-mock");
  const sequence = createSelectSequenceMock();
  selectHolder.seq = sequence;
  return {
    db: {
      select: sequence.select,
      insert: mockInsert,
      transaction: (run: (tx: unknown) => unknown) =>
        run({ select: sequence.select, insert: mockInsert }),
    },
    profiles: schema.profiles,
    stripeCustomers: schema.stripeCustomers,
  };
});

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

vi.mock("../stripe", () => ({
  getStripe: () => ({ customers: { create: mockCustomersCreate } }),
}));

import { createQueryChain, type SelectSequenceMock } from "@/test/drizzle-mock";

import { getOrCreateStripeCustomerId, getStripeCustomerId } from "../customer";

const USER_ID = "user-1";

function seq(): SelectSequenceMock {
  if (!selectHolder.seq) throw new Error("select mock not initialised");
  return selectHolder.seq;
}

beforeEach(() => {
  vi.clearAllMocks();
  seq().setResults();
  mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
  mockInsert.mockReturnValue(
    createQueryChain([{ stripeCustomerId: "cus_new" }]),
  );
});

describe("getStripeCustomerId", () => {
  it("行があれば ID、無ければ undefined", async () => {
    seq().setResults([{ stripeCustomerId: "cus_1" }]);
    expect(await getStripeCustomerId(USER_ID)).toBe("cus_1");
    seq().setResults([]);
    expect(await getStripeCustomerId(USER_ID)).toBeUndefined();
  });
});

describe("getOrCreateStripeCustomerId", () => {
  it("既に対応があれば Stripe を呼ばずにそれを返す", async () => {
    seq().setResults([], [{ stripeCustomerId: "cus_1" }]);

    expect(await getOrCreateStripeCustomerId(USER_ID, "a@example.com")).toBe(
      "cus_1",
    );
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("無ければ idempotency key 付きで顧客を作り、対応を保存して返す", async () => {
    seq().setResults([], []);

    const id = await getOrCreateStripeCustomerId(USER_ID, "a@example.com");

    expect(id).toBe("cus_new");
    expect(mockCustomersCreate).toHaveBeenCalledWith(
      { email: "a@example.com", metadata: { supabaseUserId: USER_ID } },
      { idempotencyKey: `customer:${USER_ID}` },
    );
    const chain = mockInsert.mock.results[0]?.value;
    expect(chain.values).toHaveBeenCalledWith({
      userId: USER_ID,
      stripeCustomerId: "cus_new",
    });
    expect(chain.onConflictDoNothing).toHaveBeenCalledWith({
      target: "user_id",
    });
  });

  it("INSERT が衝突したら（並行して先に入った）DB の行を正として返す", async () => {
    seq().setResults([], [], [{ stripeCustomerId: "cus_winner" }]);
    mockInsert.mockReturnValue(createQueryChain([]));

    expect(await getOrCreateStripeCustomerId(USER_ID, undefined)).toBe(
      "cus_winner",
    );
  });

  it("衝突したのに行が読めないときは対応を保証できないので止める", async () => {
    seq().setResults([], [], []);
    mockInsert.mockReturnValue(createQueryChain([]));

    await expect(
      getOrCreateStripeCustomerId(USER_ID, undefined),
    ).rejects.toThrow("Billing customer disappeared");
  });
});

it("退会済みユーザーの顧客を再作成しない", async () => {
  seq().setResults([{ deletedAt: new Date() }]);
  await expect(getOrCreateStripeCustomerId(USER_ID, undefined)).rejects.toThrow(
    "Deleted user",
  );
  expect(mockCustomersCreate).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
});
