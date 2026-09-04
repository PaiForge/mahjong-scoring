import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { toast } from "react-hot-toast";

let pathname = "/practice/jantou-fu/play";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { GlobalToaster } from "./global-toaster";
import { toastOnArrival } from "./_lib/toast-on-arrival";

/** 出したいトーストを預けたうえで、`to` へ遷移したことにする */
function navigateTo(to: string, rerender: (ui: React.ReactElement) => void) {
  pathname = to;
  rerender(<GlobalToaster />);
}

afterEach(() => {
  // react-hot-toast のストアはモジュール全体で 1 つ。持ち越すと次のテストに出る
  toast.remove();
});

describe("GlobalToaster 遷移してから出すトースト", () => {
  it("預けただけでは出さず、着地して pathname が変わってから出す", async () => {
    pathname = "/practice/jantou-fu/play";
    const { rerender } = render(<GlobalToaster />);

    toastOnArrival("/practice/jantou-fu", "練習を終了しました");
    expect(screen.queryByText("練習を終了しました")).toBeNull();

    navigateTo("/practice/jantou-fu", rerender);
    expect(await screen.findByText("練習を終了しました")).toBeTruthy();
  });

  it("預けた先とは違うページへ着いたら出さない", async () => {
    pathname = "/practice/jantou-fu/play";
    const { rerender } = render(<GlobalToaster />);

    toastOnArrival("/practice/jantou-fu", "練習を終了しました");
    navigateTo("/mypage", rerender);

    await Promise.resolve();
    expect(screen.queryByText("練習を終了しました")).toBeNull();
  });
});
