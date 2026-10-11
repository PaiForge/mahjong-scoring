import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MobilePracticeQuotaResponse } from "@mahjong-scoring/features/billing/mobile-api";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

import type { PlanApiResult } from "../../billing/plan-api";

const mocks = vi.hoisted(() => ({
  iapAvailable: true,
  offers: [] as { key: "pass"; productId: string }[],
  userId: undefined as string | undefined,
  storage: new Map<string, string>(),
  fetchPlan: vi.fn(),
  beginPracticeQuota: vi.fn(),
  peekPracticeQuota: vi.fn(),
}));

vi.mock("expo-router", () => ({ useFocusEffect: () => undefined }));
vi.mock("../../auth/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: {
          session:
            mocks.userId === undefined ? null : { user: { id: mocks.userId } },
        },
      }),
    },
  },
}));
vi.mock("../../billing/iap-availability", () => ({
  get IAP_AVAILABLE() {
    return mocks.iapAvailable;
  },
}));
vi.mock("../../billing/plan-api", () => ({ fetchPlan: mocks.fetchPlan }));
vi.mock("../../billing/use-plan-offers", () => ({
  loadPlanOffers: async () => mocks.offers,
}));
vi.mock("./quota-api", () => ({
  beginPracticeQuota: mocks.beginPracticeQuota,
  peekPracticeQuota: mocks.peekPracticeQuota,
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => mocks.storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mocks.storage.set(key, value);
    },
  },
}));

import {
  _resetPracticeQuota,
  peekPracticeQuotaAnswer,
  readPracticeQuotaGate,
  refreshPracticeQuota,
  requestPracticeQuestion,
} from "./use-practice-quota";
import { invalidatePlan } from "../../billing/use-plan";

type Reply = PlanApiResult<MobilePracticeQuotaResponse>;

const ALLOWED: Reply = {
  value: {
    allowed: true,
    remaining: 2,
    limit: 5,
    benefits: [PlanBenefit.PracticeTools],
  },
};

/** 外から resolve できる Promise */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetPracticeQuota();
  mocks.iapAvailable = true;
  mocks.offers = [{ key: "pass", productId: "pass30" }];
  mocks.userId = undefined;
  mocks.storage.clear();
  mocks.fetchPlan.mockResolvedValue({ error: "network" });
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("答えの出どころ", () => {
  it("アプリ内課金の無い端末では回数を数えず無制限", async () => {
    mocks.iapAvailable = false;
    mocks.userId = "user-a";
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();
    expect(mocks.fetchPlan).not.toHaveBeenCalled();
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "open",
      remaining: "unlimited",
      limit: "unlimited",
      benefits: [],
    });
  });

  it("販売していなければ無制限。ログイン中は特典を /plan から読む", async () => {
    mocks.offers = [];
    mocks.userId = "user-a";
    mocks.fetchPlan.mockResolvedValue({
      value: { benefits: [PlanBenefit.PracticeTools] },
    });
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();
    expect(mocks.fetchPlan).toHaveBeenCalledWith("user-a");
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "open",
      remaining: "unlimited",
      limit: "unlimited",
      benefits: [PlanBenefit.PracticeTools],
    });

    // 2 問目は /plan を読まない
    await requestPracticeQuestion("agari-score", generate);
    expect(mocks.fetchPlan).toHaveBeenCalledTimes(1);

    // プランが変わった合図の後は読み直す
    invalidatePlan();
    await requestPracticeQuestion("agari-score", generate);
    expect(mocks.fetchPlan).toHaveBeenCalledTimes(2);
  });

  it("販売していない間に /plan を読めなければ控えず、次の問いで読み直す", async () => {
    mocks.offers = [];
    mocks.userId = "user-a";

    await requestPracticeQuestion("agari-score", vi.fn());
    await requestPracticeQuestion("agari-score", vi.fn());

    expect(mocks.fetchPlan).toHaveBeenCalledTimes(2);
    expect(readPracticeQuotaGate("agari-score")).toMatchObject({
      benefits: [],
    });
  });

  it("販売していないゲストは特典なしの無制限", async () => {
    mocks.offers = [];
    await requestPracticeQuestion("agari-score", vi.fn());
    expect(mocks.fetchPlan).not.toHaveBeenCalled();
    expect(readPracticeQuotaGate("agari-score")).toMatchObject({
      kind: "open",
      remaining: "unlimited",
      benefits: [],
    });
  });

  it("ログイン中はサーバーで数える", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue(ALLOWED);
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(mocks.beginPracticeQuota).toHaveBeenCalledWith(
      "user-a",
      "agari-score",
    );
    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "open",
      remaining: 2,
      limit: 5,
      benefits: [PlanBenefit.PracticeTools],
    });
  });

  it("ログイン中にサーバーが上限と答えたらペイウォール（宛先はログイン中）", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({
      value: { allowed: false, remaining: 0, limit: 5, benefits: [] },
    });
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).not.toHaveBeenCalled();
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "blocked",
      limit: 5,
      signedIn: true,
      benefits: [],
    });
  });

  it("ゲストは端末で数え、上限（1 問）の次でペイウォール", async () => {
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "open",
      remaining: 0,
      limit: 1,
      benefits: [],
    });

    await requestPracticeQuestion("agari-score", generate);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "blocked",
      limit: 1,
      signedIn: false,
      benefits: [],
    });
    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();
  });

  it("ユーザー名を決めていなければゲストと同じ数え方に落とす", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "usernameRequired" });
    const generate = vi.fn();

    await requestPracticeQuestion("tenpai-score", generate);
    await requestPracticeQuestion("tenpai-score", generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("tenpai-score")).toEqual({
      kind: "blocked",
      limit: 1,
      signedIn: true,
      benefits: [],
    });
  });

  it("通信が失敗したら生成し、gate は unverified（fail-open）", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "network" });
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "unverified",
    });
  });

  it("サーバーが要求を受け付けない 4xx（rejected）でも生成する（fail-open）", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "rejected" });
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "unverified",
    });
  });

  it("問い合わせ自体が例外を投げても生成する", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockRejectedValue(new Error("boom"));
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "unverified",
    });
  });

  it("レート制限は生成せず rateLimited", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "rateLimited" });
    const generate = vi.fn();

    await requestPracticeQuestion("agari-score", generate);

    expect(generate).not.toHaveBeenCalled();
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "rateLimited",
    });
  });
});

describe("要求の重なり", () => {
  it("後の返事だけを使う（先の返事で生成しない）", async () => {
    mocks.userId = "user-a";
    const first = deferred<Reply>();
    const second = deferred<Reply>();
    mocks.beginPracticeQuota
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const generate = vi.fn();

    const p1 = requestPracticeQuestion("agari-score", generate);
    const p2 = requestPracticeQuestion("agari-score", generate);
    // 問い合わせはセッションを読んでから送るので、送られるまで待つ
    await vi.waitFor(() =>
      expect(mocks.beginPracticeQuota).toHaveBeenCalledTimes(2),
    );

    second.resolve({ value: { ...ALLOWED.value, remaining: 1 } });
    await p2;
    expect(generate).toHaveBeenCalledTimes(1);

    first.resolve(ALLOWED);
    await p1;
    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toMatchObject({
      kind: "open",
      remaining: 1,
    });
  });

  it("古い通信失敗は新しい特典判定を消さない", async () => {
    mocks.userId = "user-a";
    const stale = deferred<Reply>();
    mocks.beginPracticeQuota
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(ALLOWED);
    const generate = vi.fn();

    const p1 = requestPracticeQuestion("agari-score", generate);
    await requestPracticeQuestion("agari-score", generate);
    stale.resolve({ error: "network" });
    await p1;

    expect(generate).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toMatchObject({
      kind: "open",
      benefits: [PlanBenefit.PracticeTools],
    });
  });
});

describe("残数の取り直し", () => {
  it("消費せずに残数と特典を取り直し、残り 0 でも open のまま", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue(ALLOWED);
    await requestPracticeQuestion("agari-score", vi.fn());
    mocks.peekPracticeQuota.mockResolvedValueOnce({
      value: { allowed: false, remaining: 0, limit: 5, benefits: [] },
    });

    await refreshPracticeQuota("agari-score");

    expect(mocks.beginPracticeQuota).toHaveBeenCalledTimes(1);
    expect(readPracticeQuotaGate("agari-score")).toEqual({
      kind: "open",
      remaining: 0,
      limit: 5,
      benefits: [],
    });
  });

  it("失敗・レート制限のときは今の gate を保つ", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue(ALLOWED);
    await requestPracticeQuestion("agari-score", vi.fn());

    mocks.peekPracticeQuota.mockResolvedValueOnce({ error: "network" });
    await refreshPracticeQuota("agari-score");
    mocks.peekPracticeQuota.mockResolvedValueOnce({ error: "rateLimited" });
    await refreshPracticeQuota("agari-score");

    expect(readPracticeQuotaGate("agari-score")).toMatchObject({
      kind: "open",
      remaining: 2,
    });
  });

  it("取り直している間に新しい出題が始まったら、その返事を上書きしない", async () => {
    mocks.userId = "user-a";
    const peek = deferred<Reply>();
    mocks.peekPracticeQuota.mockReturnValueOnce(peek.promise);
    mocks.beginPracticeQuota.mockResolvedValue({
      value: { ...ALLOWED.value, remaining: 1 },
    });

    const refreshing = refreshPracticeQuota("agari-score");
    await requestPracticeQuestion("agari-score", vi.fn());
    peek.resolve(ALLOWED);
    await refreshing;

    expect(readPracticeQuotaGate("agari-score")).toMatchObject({
      remaining: 1,
    });
  });

  it("ゲストの残数は消費せずに端末の数から読む", async () => {
    expect(await peekPracticeQuotaAnswer("agari-score")).toMatchObject({
      allowed: true,
      remaining: 1,
      limit: 1,
      signedIn: false,
    });
    await requestPracticeQuestion("agari-score", vi.fn());
    expect(await peekPracticeQuotaAnswer("agari-score")).toMatchObject({
      allowed: false,
      remaining: 0,
    });
    expect(await peekPracticeQuotaAnswer("agari-score")).toMatchObject({
      remaining: 0,
    });
  });
});
