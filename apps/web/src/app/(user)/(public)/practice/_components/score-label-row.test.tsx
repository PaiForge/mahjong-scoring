import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { ScoreLabelRow } from "./score-label-row";

beforeEach(() => {
  useDisplaySettingsStore.setState({ scoreInput: "tiles" });
});

describe("ScoreLabelRow の入力方式の切り替えボタン", () => {
  it("タイルのときは切り替え先（選択欄）を名乗り、押すと設定が select に変わって名乗りも反転する", () => {
    render(
      <ScoreLabelRow>
        <span>score</span>
      </ScoreLabelRow>,
    );

    const button = screen.getByRole("button", { name: "switchToSelect" });
    expect(button.getAttribute("title")).toBe("switchToSelect");
    expect(button.getAttribute("type")).toBe("button");

    fireEvent.click(button);

    expect(useDisplaySettingsStore.getState().scoreInput).toBe("select");
    expect(screen.getByRole("button", { name: "switchToTiles" })).toBeDefined();
  });

  it("選択欄のときに押すとタイルへ戻る", () => {
    useDisplaySettingsStore.setState({ scoreInput: "select" });
    render(
      <ScoreLabelRow>
        <span>score</span>
      </ScoreLabelRow>,
    );

    fireEvent.click(screen.getByRole("button", { name: "switchToTiles" }));

    expect(useDisplaySettingsStore.getState().scoreInput).toBe("tiles");
  });

  it("disabled なら押しても設定は変わらない", () => {
    render(
      <ScoreLabelRow disabled>
        <span>score</span>
      </ScoreLabelRow>,
    );

    const button = screen.getByRole("button", { name: "switchToSelect" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);

    expect(useDisplaySettingsStore.getState().scoreInput).toBe("tiles");
  });

  it("tourId を渡すとボタンに data-tour-id が付く", () => {
    render(
      <ScoreLabelRow tourId="score-input-mode">
        <span>score</span>
      </ScoreLabelRow>,
    );

    expect(
      screen
        .getByRole("button", { name: "switchToSelect" })
        .getAttribute("data-tour-id"),
    ).toBe("score-input-mode");
  });
});
