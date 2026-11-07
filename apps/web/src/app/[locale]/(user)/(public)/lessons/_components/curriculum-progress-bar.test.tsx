import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CurriculumProgressBar } from "./curriculum-progress-bar";

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      if (values) {
        return `${key}:${JSON.stringify(values)}`;
      }
      return key;
    },
}));

/**
 * サーバーの呼び出し元（ダッシュボード）が使う入口。Provider の無い場所なので
 * props の値がそのまま出る。
 */
describe("CurriculumProgressBar", () => {
  it("renders 0% when nothing is read", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={0}
        totalCount={7}
        allCompleted={false}
      />,
    );
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).not.toBeNull();
    expect(progress?.getAttribute("aria-valuenow")).toBe("0");
    expect(container.textContent).toContain("0%");
  });

  it("renders rounded percentage based on read/total", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={2}
        totalCount={7}
        allCompleted={false}
      />,
    );
    // 2/7 ≒ 28.57 → 29%
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuenow")).toBe("29");
    expect(container.textContent).toContain("29%");
  });

  it("renders 100% when all chapters are read", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={7}
        totalCount={7}
        allCompleted={true}
      />,
    );
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuenow")).toBe("100");
    expect(container.textContent).toContain("100%");
  });

  it("renders 0% safely when totalCount is 0", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={0}
        totalCount={0}
        allCompleted={false}
      />,
    );
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("passes read/total counts to the i18n progressLabel", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={3}
        totalCount={7}
        allCompleted={false}
      />,
    );
    // The mock serializes values to JSON for inspection
    expect(container.textContent).toContain("progressLabel");
    expect(container.textContent).toContain('"done":3');
    expect(container.textContent).toContain('"total":7');
  });

  it("uses the solid success bar when all chapters are completed", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={7}
        totalCount={7}
        allCompleted={true}
      />,
    );
    const bar = container.querySelector('[role="progressbar"] > div');
    expect(bar?.className).toContain("bg-success");
    expect(bar?.className).not.toContain("bg-success/70");
  });

  it("uses the translucent success bar when not all chapters are completed", () => {
    const { container } = render(
      <CurriculumProgressBar
        completedCount={1}
        totalCount={7}
        allCompleted={false}
      />,
    );
    const bar = container.querySelector('[role="progressbar"] > div');
    expect(bar?.className).toContain("bg-success/70");
  });
});
