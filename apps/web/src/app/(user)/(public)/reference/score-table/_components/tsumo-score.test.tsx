import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TsumoScore } from "./tsumo-score";

describe("TsumoScore", () => {
  it("子ツモは子から・親からを上下に積む", () => {
    const { container } = render(
      <TsumoScore payment={{ type: "koTsumo", fromKo: 400, fromOya: 700 }} />,
    );

    expect(screen.getByText("400")).toBeDefined();
    expect(screen.getByText("700")).toBeDefined();
    // 区切り線は装飾なので、読み上げ用に「/」を残す
    expect(container.textContent).toContain("/");
  });

  it("親ツモは点数の下に ALL を添える（∀ は使わない）", () => {
    const { container } = render(
      <TsumoScore payment={{ type: "oyaTsumo", all: 2000 }} />,
    );

    expect(screen.getByText("2000")).toBeDefined();
    expect(screen.getByText("ALL")).toBeDefined();
    expect(container.textContent).not.toContain("∀");
  });
});
