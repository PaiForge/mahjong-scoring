// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { StrictMode, createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HaiKind } from "@mahjong-scoring/core";

import { PlanBenefit } from "../billing/plans";
import { splitAgariHai } from "./agari-hai";
import {
  buildHandPresentation,
  DEFAULT_HAND_PRESENTATION_SETTINGS,
  presentTehai,
} from "./hand-presentation";
import {
  HAND_PRESENTATION_DEADLINE_MS,
  HAND_PRESENTATION_OFF,
  HandPresentationContext,
  toHandPresentationContextValue,
  useHandPresentation,
  useHandPresentationPreparation,
  type HandPresentationBenefitsResult,
  type HandPresentationInputs,
} from "./use-hand-presentation";

/** 手で完了させる特典の取得 */
function createDeferredFetcher() {
  const calls: {
    readonly userId: string;
    readonly resolve: (result: HandPresentationBenefitsResult) => void;
    readonly reject: (error: unknown) => void;
  }[] = [];
  const fetchBenefits = vi.fn(
    (userId: string) =>
      new Promise<HandPresentationBenefitsResult>((resolve, reject) => {
        calls.push({ userId, resolve, reject });
      }),
  );
  return { fetchBenefits, calls };
}

const PRO: HandPresentationBenefitsResult = {
  ok: true,
  benefits: [PlanBenefit.PracticeTools],
};
const FREE: HandPresentationBenefitsResult = { ok: true, benefits: [] };

function baseInputs(
  overrides: Partial<HandPresentationInputs> = {},
): HandPresentationInputs {
  return {
    supported: true,
    settingsStatus: "ready",
    savedOrientation: "random",
    savedOrder: "sorted",
    auth: { kind: "signedIn", userId: "a" },
    fetchBenefits: () => Promise.resolve(PRO),
    ...overrides,
  };
}

function renderPreparation(
  initial: HandPresentationInputs,
  options: { readonly strict?: boolean } = {},
) {
  return renderHook(
    (inputs: HandPresentationInputs) => useHandPresentationPreparation(inputs),
    {
      initialProps: initial,
      wrapper: options.strict
        ? ({ children }: { readonly children: ReactNode }) =>
            createElement(StrictMode, undefined, children)
        : undefined,
    },
  );
}

/** 保留中の Promise の後続を流す */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useHandPresentationPreparation の判定順", () => {
  it("対象外のプラットフォームは設定・認証を待たず、特典も読まずに upright", () => {
    const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
    const { result } = renderPreparation(
      baseInputs({
        supported: false,
        settingsStatus: "pending",
        auth: { kind: "loading" },
        fetchBenefits,
      }),
    );
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: undefined,
    });
    expect(fetchBenefits).not.toHaveBeenCalled();
  });

  it("設定の復元中は待ち、メモリ上の upright を保存値と見なさない", () => {
    const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
    const { result } = renderPreparation(
      baseInputs({
        settingsStatus: "pending",
        savedOrientation: "upright",
        fetchBenefits,
      }),
    );
    expect(result.current.status).toBe("pending");
  });

  it("設定の復元に失敗したら upright（案内あり）", () => {
    const { result } = renderPreparation(
      baseInputs({ settingsStatus: "failed" }),
    );
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: "settingsFailed",
    });
  });

  it("向きも並べ方も既定を希望していれば認証も特典も待たない", () => {
    const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
    const { result } = renderPreparation(
      baseInputs({
        savedOrientation: "upright",
        auth: { kind: "loading" },
        fetchBenefits,
      }),
    );
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: undefined,
    });
    expect(fetchBenefits).not.toHaveBeenCalled();
  });

  it("random の希望で認証の読み込み中は待つ", () => {
    const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
    const { result } = renderPreparation(
      baseInputs({ auth: { kind: "loading" }, fetchBenefits }),
    );
    expect(result.current.status).toBe("pending");
    expect(fetchBenefits).not.toHaveBeenCalled();
  });

  it("未ログインは upright（案内なし）", () => {
    const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
    const { result } = renderPreparation(
      baseInputs({ auth: { kind: "signedOut" }, fetchBenefits }),
    );
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: undefined,
    });
    expect(fetchBenefits).not.toHaveBeenCalled();
  });

  it("特典ありなら random", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result } = renderPreparation(baseInputs({ fetchBenefits }));
    expect(result.current.status).toBe("pending");
    expect(calls.map((call) => call.userId)).toEqual(["a"]);
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "random" },
      fallbackReason: undefined,
    });
  });

  it("特典なしなら upright（案内なし）", async () => {
    const { result } = renderPreparation(
      baseInputs({ fetchBenefits: () => Promise.resolve(FREE) }),
    );
    await flush();
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: undefined,
    });
  });

  it("取得不能なら upright（案内あり）", async () => {
    const { result } = renderPreparation(
      baseInputs({ fetchBenefits: () => Promise.resolve({ ok: false }) }),
    );
    await flush();
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: "benefitsUnavailable",
    });
  });

  it("reject・同期の例外も取得不能として受け止める", async () => {
    const rejected = renderPreparation(
      baseInputs({ fetchBenefits: () => Promise.reject(new Error("x")) }),
    );
    const thrown = renderPreparation(
      baseInputs({
        fetchBenefits: () => {
          throw new Error("sync");
        },
      }),
    );
    await flush();
    expect(rejected.result.current).toMatchObject({
      fallbackReason: "benefitsUnavailable",
    });
    expect(thrown.result.current).toMatchObject({
      fallbackReason: "benefitsUnavailable",
    });
  });
});

describe("useHandPresentationPreparation の期限", () => {
  it("設定の復元が終わらなければ期限で upright（案内あり）", () => {
    const { result } = renderPreparation(
      baseInputs({ settingsStatus: "pending" }),
    );
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS - 1));
    expect(result.current.status).toBe("pending");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toMatchObject({
      status: "ready",
      snapshot: { orientation: "upright" },
      fallbackReason: "settingsTimeout",
    });
  });

  it("認証が終わらなければ期限で upright（案内あり）", () => {
    const { result } = renderPreparation(
      baseInputs({ auth: { kind: "loading" } }),
    );
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
    expect(result.current).toMatchObject({ fallbackReason: "authTimeout" });
  });

  it("特典の取得が終わらなければ期限で upright（案内あり）", () => {
    const { fetchBenefits } = createDeferredFetcher();
    const { result } = renderPreparation(baseInputs({ fetchBenefits }));
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
    expect(result.current).toMatchObject({
      snapshot: { orientation: "upright" },
      fallbackReason: "benefitsTimeout",
    });
  });

  it("入力が変わっても期限を延ばさない", () => {
    const { fetchBenefits } = createDeferredFetcher();
    const { result, rerender } = renderPreparation(
      baseInputs({ settingsStatus: "pending", fetchBenefits }),
    );
    act(() => vi.advanceTimersByTime(2000));
    rerender(baseInputs({ auth: { kind: "loading" }, fetchBenefits }));
    act(() => vi.advanceTimersByTime(500));
    rerender(baseInputs({ fetchBenefits }));
    act(() => vi.advanceTimersByTime(499));
    expect(result.current.status).toBe("pending");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toMatchObject({ fallbackReason: "benefitsTimeout" });
  });

  it("期限の直前に届いた成功は採る", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result } = renderPreparation(baseInputs({ fetchBenefits }));
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS - 1));
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current).toMatchObject({
      snapshot: { orientation: "random" },
      fallbackReason: undefined,
    });
  });

  it("期限の後に届いた成功で向きと案内を取り消さない", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result } = renderPreparation(baseInputs({ fetchBenefits }));
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
    const decided = result.current;
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current).toBe(decided);
    expect(result.current).toMatchObject({
      snapshot: { orientation: "upright" },
      fallbackReason: "benefitsTimeout",
    });
  });

  it("タイマーが遅れても、期限を過ぎて届いた成功は採らない", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result } = renderPreparation(baseInputs({ fetchBenefits }));
    // タイマーを動かさずに時計だけ進める（バックグラウンドでタイマーが止まった状態）
    vi.setSystemTime(Date.now() + HAND_PRESENTATION_DEADLINE_MS + 100);
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current).toMatchObject({
      snapshot: { orientation: "upright" },
      fallbackReason: "benefitsTimeout",
    });
  });
});

describe("useHandPresentationPreparation の要求", () => {
  it("同じ認証状態の間は 1 度だけ読み、通常の再描画で増やさない", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { rerender } = renderPreparation(baseInputs({ fetchBenefits }));
    // auth オブジェクトの参照だけが変わる再描画
    rerender(baseInputs({ fetchBenefits }));
    rerender(baseInputs({ fetchBenefits }));
    expect(calls).toHaveLength(1);
  });

  it("A → B → A と変わったら、最初の A の応答は採らない", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result, rerender } = renderPreparation(
      baseInputs({ fetchBenefits }),
    );
    rerender(
      baseInputs({ auth: { kind: "signedIn", userId: "b" }, fetchBenefits }),
    );
    rerender(baseInputs({ fetchBenefits }));
    expect(calls.map((call) => call.userId)).toEqual(["a", "b", "a"]);

    await act(async () => calls[0]?.resolve(PRO));
    await act(async () => calls[1]?.resolve(PRO));
    expect(result.current.status).toBe("pending");
    await act(async () => calls[2]?.resolve(FREE));
    expect(result.current).toMatchObject({
      snapshot: { orientation: "upright" },
      fallbackReason: undefined,
    });
  });

  it("アンマウント後の応答は無視する", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result, unmount } = renderPreparation(
      baseInputs({ fetchBenefits }),
    );
    unmount();
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current.status).toBe("pending");
  });

  it("StrictMode の effect のやり直しでも、生きている要求の応答を受け取る", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result } = renderPreparation(baseInputs({ fetchBenefits }), {
      strict: true,
    });
    expect(calls.length).toBeGreaterThanOrEqual(1);
    // 生きているのは最後の要求
    await act(async () => calls.at(-1)?.resolve(PRO));
    expect(result.current).toMatchObject({
      snapshot: { orientation: "random" },
    });
  });

  it("StrictMode でも期限は延びない", () => {
    const { result } = renderPreparation(
      baseInputs({ settingsStatus: "pending" }),
      { strict: true },
    );
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
    expect(result.current).toMatchObject({ fallbackReason: "settingsTimeout" });
  });
});

/** Pro の見せ方の希望の組み合わせ（どれでも認証と特典を待つ） */
const PRO_WISHES = [
  { name: "向きだけ", savedOrientation: "random", savedOrder: "sorted" },
  { name: "並べ方だけ", savedOrientation: "upright", savedOrder: "unsorted" },
  { name: "両方", savedOrientation: "random", savedOrder: "unsorted" },
] as const;

const DEFAULT_SNAPSHOT = DEFAULT_HAND_PRESENTATION_SETTINGS;

describe.each(PRO_WISHES)(
  "Pro の見せ方の希望（$name）",
  ({ savedOrientation, savedOrder }) => {
    const wish = (overrides: Partial<HandPresentationInputs> = {}) =>
      baseInputs({ savedOrientation, savedOrder, ...overrides });

    it("認証の読み込み中は待ち、特典を読まない", () => {
      const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
      const { result } = renderPreparation(
        wish({ auth: { kind: "loading" }, fetchBenefits }),
      );
      expect(result.current.status).toBe("pending");
      expect(fetchBenefits).not.toHaveBeenCalled();
    });

    it("特典ありなら希望どおり", async () => {
      const { fetchBenefits, calls } = createDeferredFetcher();
      const { result } = renderPreparation(wish({ fetchBenefits }));
      expect(result.current.status).toBe("pending");
      await act(async () => calls[0]?.resolve(PRO));
      expect(result.current).toMatchObject({
        status: "ready",
        snapshot: { orientation: savedOrientation, order: savedOrder },
        fallbackReason: undefined,
      });
    });

    it("特典なし・未ログインは両方既定（案内なし）", async () => {
      const free = renderPreparation(
        wish({ fetchBenefits: () => Promise.resolve(FREE) }),
      );
      const signedOut = renderPreparation(
        wish({ auth: { kind: "signedOut" } }),
      );
      await flush();
      for (const { result } of [free, signedOut]) {
        expect(result.current).toMatchObject({
          status: "ready",
          snapshot: DEFAULT_SNAPSHOT,
          fallbackReason: undefined,
        });
      }
    });

    it("取得不能・reject・同期の例外は両方既定（案内あり）", async () => {
      const rendered = [
        renderPreparation(
          wish({ fetchBenefits: () => Promise.resolve({ ok: false }) }),
        ),
        renderPreparation(
          wish({ fetchBenefits: () => Promise.reject(new Error("x")) }),
        ),
        renderPreparation(
          wish({
            fetchBenefits: () => {
              throw new Error("sync");
            },
          }),
        ),
      ];
      await flush();
      for (const { result } of rendered) {
        expect(result.current).toMatchObject({
          snapshot: DEFAULT_SNAPSHOT,
          fallbackReason: "benefitsUnavailable",
        });
      }
    });

    it("期限で認証待ちは authTimeout、特典待ちは benefitsTimeout（両方既定）", () => {
      const auth = renderPreparation(wish({ auth: { kind: "loading" } }));
      const benefits = renderPreparation(
        wish({ fetchBenefits: createDeferredFetcher().fetchBenefits }),
      );
      act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
      expect(auth.result.current).toMatchObject({
        snapshot: DEFAULT_SNAPSHOT,
        fallbackReason: "authTimeout",
      });
      expect(benefits.result.current).toMatchObject({
        snapshot: DEFAULT_SNAPSHOT,
        fallbackReason: "benefitsTimeout",
      });
    });

    it("期限の後・タイマーの遅れの後に届いた成功は採らない", async () => {
      const late = createDeferredFetcher();
      const lateRender = renderPreparation(
        wish({ fetchBenefits: late.fetchBenefits }),
      );
      act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
      const decided = lateRender.result.current;
      await act(async () => late.calls[0]?.resolve(PRO));
      expect(lateRender.result.current).toBe(decided);

      const delayed = createDeferredFetcher();
      const delayedRender = renderPreparation(
        wish({ fetchBenefits: delayed.fetchBenefits }),
      );
      vi.setSystemTime(Date.now() + HAND_PRESENTATION_DEADLINE_MS + 100);
      await act(async () => delayed.calls[0]?.resolve(PRO));
      expect(delayedRender.result.current).toMatchObject({
        snapshot: DEFAULT_SNAPSHOT,
        fallbackReason: "benefitsTimeout",
      });
    });

    it("入力が変わっても期限を延ばさない", () => {
      const { fetchBenefits } = createDeferredFetcher();
      const { result, rerender } = renderPreparation(
        wish({ settingsStatus: "pending", fetchBenefits }),
      );
      act(() => vi.advanceTimersByTime(2000));
      rerender(wish({ auth: { kind: "loading" }, fetchBenefits }));
      act(() => vi.advanceTimersByTime(999));
      rerender(wish({ fetchBenefits }));
      expect(result.current.status).toBe("pending");
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toMatchObject({
        fallbackReason: "benefitsTimeout",
      });
    });

    it("A → B → A と変わったら、最初の A の応答は採らない", async () => {
      const { fetchBenefits, calls } = createDeferredFetcher();
      const { result, rerender } = renderPreparation(wish({ fetchBenefits }));
      rerender(
        wish({ auth: { kind: "signedIn", userId: "b" }, fetchBenefits }),
      );
      rerender(wish({ fetchBenefits }));
      await act(async () => calls[0]?.resolve(PRO));
      await act(async () => calls[1]?.resolve(PRO));
      expect(result.current.status).toBe("pending");
      await act(async () => calls[2]?.resolve(FREE));
      expect(result.current).toMatchObject({ snapshot: DEFAULT_SNAPSHOT });
    });

    it("アンマウント後の応答は無視する", async () => {
      const { fetchBenefits, calls } = createDeferredFetcher();
      const { result, unmount } = renderPreparation(wish({ fetchBenefits }));
      unmount();
      await act(async () => calls[0]?.resolve(PRO));
      expect(result.current.status).toBe("pending");
    });

    it("StrictMode でも生きている要求の応答を受け取り、期限は延びない", async () => {
      const { fetchBenefits, calls } = createDeferredFetcher();
      const { result } = renderPreparation(wish({ fetchBenefits }), {
        strict: true,
      });
      await act(async () => calls.at(-1)?.resolve(PRO));
      expect(result.current).toMatchObject({
        snapshot: { orientation: savedOrientation, order: savedOrder },
      });

      const timed = renderPreparation(wish({ auth: { kind: "loading" } }), {
        strict: true,
      });
      act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS));
      expect(timed.result.current).toMatchObject({
        fallbackReason: "authTimeout",
      });
    });

    it("対象外のプラットフォームは待たず、特典も読まずに両方既定", () => {
      const fetchBenefits = vi.fn(() => Promise.resolve(PRO));
      const { result } = renderPreparation(
        wish({
          supported: false,
          settingsStatus: "pending",
          auth: { kind: "loading" },
          fetchBenefits,
        }),
      );
      expect(result.current).toMatchObject({
        status: "ready",
        snapshot: DEFAULT_SNAPSHOT,
        fallbackReason: undefined,
      });
      expect(fetchBenefits).not.toHaveBeenCalled();
    });

    it("確定後の設定・権利・ログインの変化では両軸とも変えない", async () => {
      const { result, rerender } = renderPreparation(wish());
      await flush();
      const decided = result.current;
      expect(decided).toMatchObject({
        snapshot: { orientation: savedOrientation, order: savedOrder },
      });
      rerender(
        baseInputs({ savedOrientation: "upright", savedOrder: "sorted" }),
      );
      rerender(wish({ fetchBenefits: () => Promise.resolve(FREE) }));
      rerender(wish({ auth: { kind: "signedOut" } }));
      act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS * 2));
      expect(result.current).toBe(decided);
    });
  },
);

describe("useHandPresentationPreparation の取得中の希望の変化", () => {
  it("random + sorted → random + unsorted では古い要求を捨て、今の希望を採る", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result, rerender } = renderPreparation(
      baseInputs({ fetchBenefits }),
    );
    rerender(baseInputs({ savedOrder: "unsorted", fetchBenefits }));
    expect(calls).toHaveLength(2);
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current.status).toBe("pending");
    await act(async () => calls[1]?.resolve(PRO));
    expect(result.current).toMatchObject({
      snapshot: { orientation: "random", order: "unsorted" },
    });
  });

  it("取得中に両方既定へ戻すと即確定し、遅い成功で Pro の見せ方に戻らない", async () => {
    const { fetchBenefits, calls } = createDeferredFetcher();
    const { result, rerender } = renderPreparation(
      baseInputs({ savedOrder: "unsorted", fetchBenefits }),
    );
    rerender(
      baseInputs({
        savedOrientation: "upright",
        savedOrder: "sorted",
        fetchBenefits,
      }),
    );
    const decided = result.current;
    expect(decided).toMatchObject({
      status: "ready",
      snapshot: DEFAULT_SNAPSHOT,
      fallbackReason: undefined,
    });
    await act(async () => calls[0]?.resolve(PRO));
    expect(result.current).toBe(decided);
  });

  it("再マウントでは今の希望を採る", async () => {
    const first = renderPreparation(baseInputs());
    await flush();
    first.unmount();
    const second = renderPreparation(
      baseInputs({ savedOrientation: "upright", savedOrder: "unsorted" }),
    );
    await flush();
    expect(second.result.current).toMatchObject({
      snapshot: { orientation: "upright", order: "unsorted" },
    });
  });
});

describe("useHandPresentationPreparation の確定後", () => {
  it("確定後の設定・権利・ログインの変化では変えない", async () => {
    const { result, rerender } = renderPreparation(baseInputs());
    await flush();
    const decided = result.current;
    expect(decided).toMatchObject({ snapshot: { orientation: "random" } });

    rerender(baseInputs({ savedOrientation: "upright" }));
    rerender(baseInputs({ fetchBenefits: () => Promise.resolve(FREE) }));
    rerender(baseInputs({ auth: { kind: "signedOut" } }));
    rerender(baseInputs({ settingsStatus: "failed" }));
    act(() => vi.advanceTimersByTime(HAND_PRESENTATION_DEADLINE_MS * 2));
    expect(result.current).toBe(decided);
  });

  it("同じ実行環境では Provider をまたいで同じ種を使う", async () => {
    const first = renderPreparation(baseInputs());
    await flush();
    first.unmount();
    const second = renderPreparation(
      baseInputs({ savedOrientation: "upright" }),
    );
    const seedOf = (value: typeof first.result.current) =>
      value.status === "ready" ? value.snapshot.sessionSeed : undefined;
    expect(seedOf(second.result.current)).toBeDefined();
    expect(seedOf(second.result.current)).toBe(seedOf(first.result.current));
  });
});

describe("useHandPresentation", () => {
  const split = splitAgariHai(
    [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.Ton, HaiKind.Ton],
    HaiKind.Ton,
  );
  const snapshot = {
    orientation: "random",
    order: "sorted",
    sessionSeed: 7,
  } as const;

  function renderWith(
    value:
      | Parameters<typeof HandPresentationContext.Provider>[0]["value"]
      | undefined,
  ) {
    return renderHook(() => useHandPresentation(split), {
      wrapper:
        value === undefined
          ? undefined
          : ({ children }: { readonly children: ReactNode }) =>
              createElement(
                HandPresentationContext.Provider,
                { value },
                children,
              ),
    });
  }

  it("Provider の外と off では従来の表示（undefined）", () => {
    expect(renderWith(undefined).result.current).toBeUndefined();
    expect(renderWith(HAND_PRESENTATION_OFF).result.current).toBeUndefined();
  });

  it("on では確定した見せ方を計算する（sorted なら理牌のまま）", () => {
    expect(
      renderWith(toHandPresentationContextValue(snapshot)).result.current,
    ).toEqual(buildHandPresentation(split, snapshot));
  });

  it("コンテキストの order を使う（sorted を直書きしない）", () => {
    // 種 2 は理牌と違う並び（3,0,2,1）になる。種 7 は偶然恒等置換になる
    const unsorted = {
      ...snapshot,
      order: "unsorted",
      sessionSeed: 2,
    } as const;
    const presentation = renderWith(toHandPresentationContextValue(unsorted))
      .result.current;
    expect(presentation).toEqual(buildHandPresentation(split, unsorted));
    expect(presentation?.closedOrder).toEqual([3, 0, 2, 1]);
    expect(
      presentTehai(split, presentation).closed.map((tile) => tile.hai),
    ).not.toEqual(split.closedTiles);
  });
});
