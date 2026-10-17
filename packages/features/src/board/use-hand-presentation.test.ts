// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { StrictMode, createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HaiKind } from "@mahjong-scoring/core";

import { PlanBenefit } from "../billing/plans";
import { splitAgariHai } from "./agari-hai";
import { buildHandPresentation } from "./hand-presentation";
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

  it("希望が upright なら認証も特典も待たない", () => {
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
  const snapshot = { orientation: "random", sessionSeed: 7 } as const;

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

  it("on では確定した見せ方を理牌のまま計算する", () => {
    expect(
      renderWith(toHandPresentationContextValue(snapshot)).result.current,
    ).toEqual(buildHandPresentation(split, snapshot, "sorted"));
  });
});
