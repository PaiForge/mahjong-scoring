import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { takeToastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { useQuitConfirm } from "../use-quit-confirm";

/**
 * 中断のトーストは「何を中断したか」で文言が変わる。トレーニングの
 * 「終了する」（training-shell）と同じ文言に戻らないよう、チャレンジと試験が
 * それぞれ自分のキーを引くことを固定する。
 */
function quitAndTakeToast(
  options: Parameters<typeof useQuitConfirm>[0] & { readonly exitHref: string },
) {
  const { result } = renderHook(() => useQuitConfirm(options));

  act(() => result.current.handleQuitClick());
  act(() => result.current.handleQuitConfirm());

  return takeToastOnArrival(options.exitHref)?.message;
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
