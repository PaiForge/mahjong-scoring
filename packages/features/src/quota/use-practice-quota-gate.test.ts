// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanBenefit } from "../billing/plans";

import type { BeginPracticeQuestionResult } from "./answer";
import type { QuotaOutcome } from "./gate";
import { createPracticeQuotaGate } from "./use-practice-quota-gate";

const ALLOWED: BeginPracticeQuestionResult = {
  allowed: true,
  remaining: 2,
  limit: 3,
  signedIn: true,
  benefits: [PlanBenefit.PracticeTools],
};

const answer = (value: BeginPracticeQuestionResult): QuotaOutcome => ({
  kind: "answer",
  answer: value,
});

/** 外から resolve / reject できる Promise */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const gates = createPracticeQuotaGate();

beforeEach(() => {
  gates.reset();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("request", () => {
  it("許可されたら生成し、gate は open になる", async () => {
    const generate = vi.fn();

    await gates.request("agari-score", async () => answer(ALLOWED), generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(gates.read("agari-score")).toEqual({
      isChecking: false,
      gate: {
        kind: "open",
        remaining: 2,
        limit: 3,
        benefits: [PlanBenefit.PracticeTools],
      },
    });
  });

  it("上限到達なら生成せず、gate は blocked になる", async () => {
    const generate = vi.fn();

    await gates.request(
      "agari-score",
      async () =>
        answer({
          ...ALLOWED,
          allowed: false,
          remaining: 0,
          signedIn: false,
          benefits: [],
        }),
      generate,
    );

    expect(generate).not.toHaveBeenCalled();
    expect(gates.read("agari-score").gate).toEqual({
      kind: "blocked",
      limit: 3,
      signedIn: false,
      benefits: [],
    });
  });

  it("上限が無制限のまま止められたら limit は 0", async () => {
    await gates.request(
      "agari-score",
      async () =>
        answer({
          ...ALLOWED,
          allowed: false,
          remaining: "unlimited",
          limit: "unlimited",
        }),
      vi.fn(),
    );

    expect(gates.read("agari-score").gate).toMatchObject({
      kind: "blocked",
      limit: 0,
    });
  });

  it("レート制限は生成せず rateLimited", async () => {
    const generate = vi.fn();

    await gates.request(
      "agari-score",
      async () => ({ kind: "rateLimited" }),
      generate,
    );

    expect(generate).not.toHaveBeenCalled();
    expect(gates.read("agari-score").gate).toEqual({ kind: "rateLimited" });
  });

  it("確かめられなかった（unverified）ときは生成する（fail-open）", async () => {
    const generate = vi.fn();

    await gates.request(
      "agari-score",
      async () => ({ kind: "unverified" }),
      generate,
    );

    expect(generate).toHaveBeenCalledTimes(1);
    expect(gates.read("agari-score").gate).toEqual({ kind: "unverified" });
  });

  it("問い合わせ自体が投げても生成する（fail-open）", async () => {
    const generate = vi.fn();

    await gates.request(
      "agari-score",
      async () => {
        throw new Error("offline");
      },
      generate,
    );

    expect(generate).toHaveBeenCalledTimes(1);
    expect(gates.read("agari-score").gate).toEqual({ kind: "unverified" });
  });

  it("Pro の成功応答の後でも通信失敗時は特典を引き継がない", async () => {
    const generate = vi.fn();
    await gates.request("agari-score", async () => answer(ALLOWED), generate);

    await gates.request(
      "agari-score",
      async () => {
        throw new Error("offline");
      },
      generate,
    );

    expect(generate).toHaveBeenCalledTimes(2);
    expect(gates.read("agari-score").gate).toEqual({ kind: "unverified" });
  });

  it("生成処理自身の例外は通信失敗として扱わず、isChecking を戻して投げ直す", async () => {
    const generate = vi.fn(() => {
      throw new Error("generation failed");
    });

    await expect(
      gates.request("agari-score", async () => answer(ALLOWED), generate),
    ).rejects.toThrow("generation failed");

    expect(generate).toHaveBeenCalledTimes(1);
    expect(gates.read("agari-score").isChecking).toBe(false);
  });

  it("返事を待っている間は isChecking", async () => {
    const reply = deferred<QuotaOutcome>();

    const pending = gates.request("agari-score", () => reply.promise, vi.fn());
    expect(gates.read("agari-score").isChecking).toBe(true);

    reply.resolve(answer(ALLOWED));
    await pending;
    expect(gates.read("agari-score").isChecking).toBe(false);
  });

  it("練習ごとに別の gate を持つ", async () => {
    await gates.request("agari-score", async () => answer(ALLOWED), vi.fn());

    expect(gates.read("tenpai-score")).toEqual({
      gate: undefined,
      isChecking: false,
    });
  });
});

describe("要求の重なり", () => {
  it("後の返事だけを使う（先の返事で生成しない）", async () => {
    const first = deferred<QuotaOutcome>();
    const second = deferred<QuotaOutcome>();
    const generate = vi.fn();

    const p1 = gates.request("agari-score", () => first.promise, generate);
    const p2 = gates.request("agari-score", () => second.promise, generate);

    second.resolve(answer({ ...ALLOWED, remaining: 1 }));
    await p2;
    expect(generate).toHaveBeenCalledTimes(1);

    first.resolve(answer(ALLOWED));
    await p1;
    expect(generate).toHaveBeenCalledTimes(1);
    expect(gates.read("agari-score")).toEqual({
      isChecking: false,
      gate: expect.objectContaining({ kind: "open", remaining: 1 }),
    });
  });

  it("古い通信失敗は新しい特典判定を消さない", async () => {
    const stale = deferred<QuotaOutcome>();
    const generate = vi.fn();

    const p1 = gates.request("agari-score", () => stale.promise, generate);
    await gates.request("agari-score", async () => answer(ALLOWED), generate);
    stale.reject(new Error("stale"));
    await p1;

    expect(generate).toHaveBeenCalledTimes(1);
    expect(gates.read("agari-score").gate).toMatchObject({
      kind: "open",
      benefits: [PlanBenefit.PracticeTools],
    });
  });

  it("古い要求の完了は新しい要求の isChecking を下ろさない", async () => {
    const stale = deferred<QuotaOutcome>();
    const current = deferred<QuotaOutcome>();

    const p1 = gates.request("agari-score", () => stale.promise, vi.fn());
    const p2 = gates.request("agari-score", () => current.promise, vi.fn());
    stale.resolve(answer(ALLOWED));
    await p1;
    expect(gates.read("agari-score").isChecking).toBe(true);

    current.resolve(answer(ALLOWED));
    await p2;
    expect(gates.read("agari-score").isChecking).toBe(false);
  });
});

describe("refresh", () => {
  it("消費せずに残数と特典を取り直し、残り 0 でも open のまま", async () => {
    await gates.request("agari-score", async () => answer(ALLOWED), vi.fn());

    await gates.refresh("agari-score", async () => ({
      ...ALLOWED,
      allowed: false,
      remaining: 0,
      benefits: [],
    }));

    expect(gates.read("agari-score").gate).toEqual({
      kind: "open",
      remaining: 0,
      limit: 3,
      benefits: [],
    });
  });

  it("確かめられなかった（undefined）ときは今の gate を保つ", async () => {
    await gates.request("agari-score", async () => answer(ALLOWED), vi.fn());

    await gates.refresh("agari-score", async () => undefined);

    expect(gates.read("agari-score").gate).toMatchObject({
      kind: "open",
      remaining: 2,
    });
  });

  it("取り直している間に新しい出題が始まったら、その返事を上書きしない", async () => {
    const peek = deferred<BeginPracticeQuestionResult | undefined>();

    const refreshing = gates.refresh("agari-score", () => peek.promise);
    await gates.request(
      "agari-score",
      async () => answer({ ...ALLOWED, remaining: 1 }),
      vi.fn(),
    );
    peek.resolve(ALLOWED);
    await refreshing;

    expect(gates.read("agari-score").gate).toMatchObject({ remaining: 1 });
  });
});

describe("clear / reset", () => {
  it("clear は gate だけを消す", async () => {
    await gates.request("agari-score", async () => answer(ALLOWED), vi.fn());

    gates.clear("agari-score");

    expect(gates.read("agari-score")).toEqual({
      gate: undefined,
      isChecking: false,
    });
  });

  it("reset は全練習の状態を消す", async () => {
    await gates.request("agari-score", async () => answer(ALLOWED), vi.fn());
    await gates.request("tenpai-score", async () => answer(ALLOWED), vi.fn());

    gates.reset();

    expect(gates.read("agari-score").gate).toBeUndefined();
    expect(gates.read("tenpai-score").gate).toBeUndefined();
  });
});
