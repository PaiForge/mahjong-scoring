import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Toast } from "react-hot-toast";

import { ToastCard } from "./toast-card";

function makeToast(overrides: Partial<Toast> = {}): Toast {
  return {
    type: "blank",
    id: "1",
    message: "練習を終了しました",
    pauseDuration: 0,
    ariaProps: { role: "status", "aria-live": "polite" },
    createdAt: 0,
    visible: true,
    dismissed: false,
    ...overrides,
  } as Toast;
}

describe("ToastCard", () => {
  it("メッセージと支援技術向けの role を出す", () => {
    render(<ToastCard toast={makeToast()} />);
    expect(screen.getByRole("status").textContent).toContain(
      "練習を終了しました",
    );
  });

  it("成功・失敗は状態色トークンで塗り分ける", () => {
    const { container: success } = render(
      <ToastCard toast={makeToast({ type: "success", message: "正解！" })} />,
    );
    expect(success.firstElementChild?.className).toContain("bg-success");

    const { container: error } = render(
      <ToastCard toast={makeToast({ type: "error", message: "失敗" })} />,
    );
    expect(error.firstElementChild?.className).toContain("bg-destructive");
  });

  it("種類ごとのアイコンを図形で描く（文字の字形に依存しない）", () => {
    const { container } = render(<ToastCard toast={makeToast()} />);
    const path = container.querySelector("svg path");
    // 丸で囲った記号。丸（弧）を含むことまで見て、字形との取り違えを防ぐ
    expect(path?.getAttribute("d")).toContain("a9 9 0");
  });

  it("退出中は下へ引いて消える", () => {
    const { container } = render(
      <ToastCard toast={makeToast({ visible: false })} />,
    );
    expect(container.firstElementChild?.className).toContain("opacity-0");
  });
});
