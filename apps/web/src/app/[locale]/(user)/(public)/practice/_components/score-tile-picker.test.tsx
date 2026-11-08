import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { ScorePracticeAnswerForm } from "../agari-score/_components/score-practice-answer-form";
import { ScoreAnswerForm } from "./score-answer-form";

afterEach(() => {
  cleanup();
  useDisplaySettingsStore.setState({ koTsumoInput: "combined" });
});

/** 点数のタイル（切り替えのボタンを除く）の文言 */
function tileLabels(): readonly string[] {
  return screen
    .getAllByRole("button")
    .map((b) => b.textContent ?? "")
    .filter((text) => /^\d/.test(text));
}

function renderForm(
  props: Partial<React.ComponentProps<typeof ScoreAnswerForm>> = {},
) {
  const onSubmit = vi.fn();
  const view = render(
    <ScoreAnswerForm
      isOya={false}
      isTsumo={false}
      han={3}
      onSubmit={onSubmit}
      translationNamespace="x"
      autoSubmit
      {...props}
    />,
  );
  return { onSubmit, ...view };
}

describe("点数のタイル入力", () => {
  it("初めは満貫未満の側だけを並べ、切り替えると満貫以上の側に替わる", () => {
    renderForm({ scoreRange: "all" });

    expect(
      screen
        .getByRole("button", { name: "nonMangan" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(tileLabels()).toContain("7700");
    expect(tileLabels()).not.toContain("8000");

    fireEvent.click(screen.getByRole("button", { name: "manganPlus" }));

    expect(tileLabels()).toContain("8000");
    expect(tileLabels()).not.toContain("7700");
  });

  it("タイルを押した時点で回答を送る", () => {
    const { onSubmit } = renderForm({ scoreRange: "all" });

    fireEvent.click(screen.getByRole("button", { name: "manganPlus" }));
    fireEvent.click(screen.getByRole("button", { name: "8000" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ type: "ron", score: 8000 });
  });

  it("選択肢が片側にしか無いときは切り替えを出さない", () => {
    renderForm({ han: 5 });

    expect(screen.queryByRole("button", { name: "nonMangan" })).toBeNull();
    expect(tileLabels()).toContain("8000");
  });

  it("子ツモは分割入力の設定でも組のタイルで答える", () => {
    useDisplaySettingsStore.setState({ koTsumoInput: "split" });
    const { onSubmit } = renderForm({ isTsumo: true, scoreRange: "all" });

    expect(tileLabels()).toContain("2000/3900");
    fireEvent.click(screen.getByRole("button", { name: "300/500" }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: "koTsumo",
      fromKo: 300,
      fromOya: 500,
    });
  });

  it("親ツモは「オール」を添える", () => {
    renderForm({ isOya: true, isTsumo: true, scoreRange: "all" });

    expect(tileLabels()).toContain("500all");
  });

  it("隠れた側で選んだ点数を切り替えのボタンに添え、回答ボタンで送れる", () => {
    const { onSubmit } = renderForm({ scoreRange: "all", autoSubmit: false });

    fireEvent.click(screen.getByRole("button", { name: "manganPlus" }));
    fireEvent.click(screen.getByRole("button", { name: "8000" }));
    fireEvent.click(screen.getByRole("button", { name: "nonMangan" }));

    expect(
      screen.getByRole("button", { name: "manganPlus · 8000" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "answer" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "ron", score: 8000 });
  });

  it("回答直後は選んだタイルを正誤の色で染め、他を薄くする", () => {
    const { rerender } = renderForm({ scoreRange: "all" });
    fireEvent.click(screen.getByRole("button", { name: "1000" }));

    rerender(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={false}
        han={3}
        onSubmit={() => {}}
        translationNamespace="x"
        autoSubmit
        scoreRange="all"
        disabled
        showFeedback
        lastAnswerCorrect={false}
      />,
    );

    expect(screen.getByRole("button", { name: "1000" }).className).toContain(
      "border-destructive",
    );
    expect(screen.getByRole("button", { name: "1300" }).className).toContain(
      "opacity-50",
    );
  });
});

describe("点数のタイル入力（和了形・聴牌形の点数計算）", () => {
  it("翻数で満貫かどうか決まれば切り替えを引っ込め、選んだ点数で送る", () => {
    const onSubmit = vi.fn();
    render(
      <ScorePracticeAnswerForm
        onSubmit={onSubmit}
        isTsumo={false}
        isOya={false}
      />,
    );
    const han = screen.getByLabelText("form.labels.han");

    fireEvent.change(han, { target: { value: "3" } });
    expect(screen.getByRole("button", { name: "manganPlus" })).toBeDefined();

    fireEvent.change(han, { target: { value: "5" } });
    expect(screen.queryByRole("button", { name: "manganPlus" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "8000" }));
    fireEvent.click(
      screen.getByRole("button", { name: "form.buttons.answer" }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ han: 5, score: 8000 }),
    );
  });
});

describe("和了形の点数計算の選択即送信", () => {
  it("点数だけを問う設定なら、タイルを押した時点で送り、回答ボタンを出さない", () => {
    const onSubmit = vi.fn();
    render(
      <ScorePracticeAnswerForm
        onSubmit={onSubmit}
        isTsumo={false}
        isOya={false}
        requireHanFu={false}
        autoSubmit
      />,
    );
    expect(
      screen.queryByRole("button", { name: "form.buttons.answer" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "manganPlus" }));
    fireEvent.click(screen.getByRole("button", { name: "8000" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ score: 8000, han: undefined }),
    );
  });

  it("翻数と符も答える設定では、立てても回答ボタンで送る", () => {
    const onSubmit = vi.fn();
    render(
      <ScorePracticeAnswerForm
        onSubmit={onSubmit}
        isTsumo={false}
        isOya={false}
        requireHanFu
        autoSubmit
      />,
    );
    fireEvent.change(screen.getByLabelText("form.labels.han"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "8000" }));

    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "form.buttons.answer" }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ han: 5, score: 8000 }),
    );
  });
});
