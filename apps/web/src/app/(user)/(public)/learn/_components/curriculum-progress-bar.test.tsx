import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CurriculumProgressBar } from "./curriculum-progress-bar";

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, values?: Record<string, string | number>) => {
      if (values) {
        return `${key}:${JSON.stringify(values)}`;
      }
      return key;
    }),
}));

describe("CurriculumProgressBar", () => {
  it("renders 0% when nothing is read", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 0,
        totalCount: 7,
        allCompleted: false,
      }),
    );
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).not.toBeNull();
    expect(progress?.getAttribute("aria-valuenow")).toBe("0");
    expect(container.textContent).toContain("0%");
  });

  it("renders rounded percentage based on read/total", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 2,
        totalCount: 7,
        allCompleted: false,
      }),
    );
    // 2/7 ≒ 28.57 → 29%
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuenow")).toBe("29");
    expect(container.textContent).toContain("29%");
  });

  it("renders 100% when all chapters are read", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 7,
        totalCount: 7,
        allCompleted: true,
      }),
    );
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuenow")).toBe("100");
    expect(container.textContent).toContain("100%");
  });

  it("renders 0% safely when totalCount is 0", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 0,
        totalCount: 0,
        allCompleted: false,
      }),
    );
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("passes read/total counts to the i18n progressLabel", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 3,
        totalCount: 7,
        allCompleted: false,
      }),
    );
    // The mock serializes values to JSON for inspection
    expect(container.textContent).toContain("progressLabel");
    expect(container.textContent).toContain('"read":3');
    expect(container.textContent).toContain('"total":7');
  });

  it("uses the primary-500 bar when all chapters are completed", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 7,
        totalCount: 7,
        allCompleted: true,
      }),
    );
    const bar = container.querySelector('[role="progressbar"] > div');
    expect(bar?.className).toContain("bg-primary-500");
  });

  it("uses the primary-400 bar when not all chapters are completed", async () => {
    const { container } = render(
      await CurriculumProgressBar({
        readCount: 1,
        totalCount: 7,
        allCompleted: false,
      }),
    );
    const bar = container.querySelector('[role="progressbar"] > div');
    expect(bar?.className).toContain("bg-primary-400");
  });
});
