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
  practiceQuotaSource,
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

/**
 * 問い合わせ先の答えだけを確かめる。答えをゲートへ写す規則（fail-open・
 * 古い返事の破棄・取り直し）は features の `createPracticeQuotaGate` のテスト
 */
const ask = (menu: "agari-score" | "tenpai-score" = "agari-score") =>
  practiceQuotaSource.ask(menu);

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

    const outcome = await ask();

    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();
    expect(mocks.fetchPlan).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      kind: "answer",
      answer: {
        allowed: true,
        remaining: "unlimited",
        limit: "unlimited",
        signedIn: true,
        benefits: [],
      },
    });
  });

  it("販売していなければ無制限。ログイン中は特典を /plan から読む", async () => {
    mocks.offers = [];
    mocks.userId = "user-a";
    mocks.fetchPlan.mockResolvedValue({
      value: { benefits: [PlanBenefit.PracticeTools] },
    });

    const outcome = await ask();

    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();
    expect(mocks.fetchPlan).toHaveBeenCalledWith("user-a");
    expect(outcome).toEqual({
      kind: "answer",
      answer: {
        allowed: true,
        remaining: "unlimited",
        limit: "unlimited",
        signedIn: true,
        benefits: [PlanBenefit.PracticeTools],
      },
    });

    // 2 問目は /plan を読まない
    await ask();
    expect(mocks.fetchPlan).toHaveBeenCalledTimes(1);

    // プランが変わった合図の後は読み直す
    invalidatePlan();
    await ask();
    expect(mocks.fetchPlan).toHaveBeenCalledTimes(2);
  });

  it("販売していない間に /plan を読めなければ控えず、次の問いで読み直す", async () => {
    mocks.offers = [];
    mocks.userId = "user-a";

    await ask();
    const outcome = await ask();

    expect(mocks.fetchPlan).toHaveBeenCalledTimes(2);
    expect(outcome).toMatchObject({ answer: { benefits: [] } });
  });

  it("販売していないゲストは特典なしの無制限", async () => {
    mocks.offers = [];

    const outcome = await ask();

    expect(mocks.fetchPlan).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      kind: "answer",
      answer: {
        allowed: true,
        remaining: "unlimited",
        signedIn: false,
        benefits: [],
      },
    });
  });

  it("ログイン中はサーバーで数える", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue(ALLOWED);

    const outcome = await ask();

    expect(mocks.beginPracticeQuota).toHaveBeenCalledWith(
      "user-a",
      "agari-score",
    );
    expect(outcome).toEqual({
      kind: "answer",
      answer: {
        allowed: true,
        remaining: 2,
        limit: 5,
        signedIn: true,
        benefits: [PlanBenefit.PracticeTools],
      },
    });
  });

  it("ログイン中にサーバーが上限と答えたらそのまま（宛先はログイン中）", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({
      value: { allowed: false, remaining: 0, limit: 5, benefits: [] },
    });

    const outcome = await ask();

    expect(outcome).toEqual({
      kind: "answer",
      answer: {
        allowed: false,
        remaining: 0,
        limit: 5,
        signedIn: true,
        benefits: [],
      },
    });
  });

  it("ゲストは端末で数え、上限（1 問）の次で止める", async () => {
    expect(await ask()).toEqual({
      kind: "answer",
      answer: {
        allowed: true,
        remaining: 0,
        limit: 1,
        signedIn: false,
        benefits: [],
      },
    });

    expect(await ask()).toMatchObject({
      answer: { allowed: false, remaining: 0, limit: 1, signedIn: false },
    });
    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();
  });

  it("ユーザー名を決めていなければゲストと同じ数え方に落とす", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "usernameRequired" });

    expect(await ask("tenpai-score")).toMatchObject({
      answer: { allowed: true, remaining: 0, limit: 1, signedIn: true },
    });
    expect(await ask("tenpai-score")).toMatchObject({
      answer: { allowed: false, remaining: 0, limit: 1, signedIn: true },
    });
  });

  it("通信が失敗したら確かめられなかった扱い（unverified）", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "network" });

    expect(await ask()).toEqual({ kind: "unverified" });
  });

  it("サーバーが要求を受け付けない 4xx（rejected）も確かめられなかった扱い", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "rejected" });

    expect(await ask()).toEqual({ kind: "unverified" });
  });

  it("問い合わせ自体が例外を投げたらそのまま投げる（ゲートが fail-open に畳む）", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockRejectedValue(new Error("boom"));

    await expect(ask()).rejects.toThrow("boom");
  });

  it("レート制限は rateLimited", async () => {
    mocks.userId = "user-a";
    mocks.beginPracticeQuota.mockResolvedValue({ error: "rateLimited" });

    expect(await ask()).toEqual({ kind: "rateLimited" });
  });
});

describe("残数の読み込み", () => {
  it("ログイン中は消費しない問い合わせで読み、失敗・レート制限なら undefined", async () => {
    mocks.userId = "user-a";
    mocks.peekPracticeQuota.mockResolvedValueOnce({
      value: { allowed: false, remaining: 0, limit: 5, benefits: [] },
    });

    expect(await peekPracticeQuotaAnswer("agari-score")).toEqual({
      allowed: false,
      remaining: 0,
      limit: 5,
      signedIn: true,
      benefits: [],
    });
    expect(mocks.peekPracticeQuota).toHaveBeenCalledWith(
      "user-a",
      "agari-score",
    );
    expect(mocks.beginPracticeQuota).not.toHaveBeenCalled();

    mocks.peekPracticeQuota.mockResolvedValueOnce({ error: "network" });
    expect(await peekPracticeQuotaAnswer("agari-score")).toBeUndefined();
    mocks.peekPracticeQuota.mockResolvedValueOnce({ error: "rateLimited" });
    expect(await peekPracticeQuotaAnswer("agari-score")).toBeUndefined();
  });

  it("ゲストの残数は消費せずに端末の数から読む", async () => {
    expect(await peekPracticeQuotaAnswer("agari-score")).toMatchObject({
      allowed: true,
      remaining: 1,
      limit: 1,
      signedIn: false,
    });
    await ask();
    expect(await peekPracticeQuotaAnswer("agari-score")).toMatchObject({
      allowed: false,
      remaining: 0,
    });
    expect(await peekPracticeQuotaAnswer("agari-score")).toMatchObject({
      remaining: 0,
    });
  });

  it("問い合わせが投げても undefined（盤面は今の表示を保つ）", async () => {
    mocks.userId = "user-a";
    mocks.peekPracticeQuota.mockRejectedValueOnce(new Error("boom"));

    expect(await peekPracticeQuotaAnswer("agari-score")).toBeUndefined();
  });
});
