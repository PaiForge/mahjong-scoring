import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

import { takeToastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { routerPush } from "@/test/navigation-mock";
import { useQuitConfirm } from "../use-quit-confirm";

/**
 * 中断のトーストは「何を中断したか」で文言が変わる。トレーニングの
 * 「終了する」（training-shell）と同じ文言に戻らないよう、チャレンジと試験が
 * それぞれ自分のキーを引くことを固定する。
 */
function quitAndTakeToast({
  exitHref,
  ...options
}: Omit<Parameters<typeof useQuitConfirm>[0], "resolveExitHref"> & {
  readonly exitHref: string;
}) {
  const { result } = renderHook(() =>
    useQuitConfirm({ ...options, resolveExitHref: () => exitHref }),
  );

  act(() => result.current.handleQuitClick());
  act(() => result.current.handleQuitConfirm());

  return takeToastOnArrival(exitHref)?.message;
}

describe("useQuitConfirm 中断のトースト", () => {
  it("チャレンジはチャレンジの文言を出す", () => {
    expect(quitAndTakeToast({ exitHref: "/practice/jantou-fu" })).toBe(
      "quit.practice.toast",
    );
  });

  it("昇級試験は試験の文言を出す", () => {
    expect(quitAndTakeToast({ exitHref: "/exam/fu", variant: "exam" })).toBe(
      "quit.exam.toast",
    );
  });
});

describe("useQuitConfirm 遷移先", () => {
  it("遷移先は確定の瞬間に解決し、その値へ遷移する", () => {
    // 今の URL の出題設定（バリアント）を説明ページに載せて戻すため、
    // 描画時ではなく「やめる」を確定した時点で読む
    routerPush.mockClear();
    const resolveExitHref = vi.fn(() => "/practice/yaku-han?variant=all");
    const { result } = renderHook(() => useQuitConfirm({ resolveExitHref }));
    expect(resolveExitHref).not.toHaveBeenCalled();

    act(() => result.current.handleQuitClick());
    act(() => result.current.handleQuitConfirm());

    expect(resolveExitHref).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith("/practice/yaku-han?variant=all");
    // 着地の判定はパスだけなので、クエリ付きで預けても説明ページで出る
    expect(takeToastOnArrival("/practice/yaku-han")?.message).toBe(
      "quit.practice.toast",
    );
  });
});
