import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

import { ScoreAnswerForm } from "./score-answer-form";

function firstRealOptionValue(select: HTMLElement): string {
  const opts = within(select)
    .getAllByRole("option")
    .filter((o) => (o as HTMLOptionElement).value !== "");
  return (opts[0] as HTMLOptionElement).value;
}

describe("ScoreAnswerForm autoSubmit", () => {
  it("単一選択（子ロン）は選択した時点で送信し、ボタンを表示しない", () => {
    const onSubmit = vi.fn();
    render(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={false}
        han={3}
        onSubmit={onSubmit}
        translationNamespace="x"
        autoSubmit
      />,
    );

    // 自動送信時は「回答する」ボタンを出さない
    expect(screen.queryByRole("button")).toBeNull();

    const select = screen.getByRole("combobox");
    const value = firstRealOptionValue(select);
    fireEvent.change(select, { target: { value } });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      type: "ron",
      score: Number(value),
    });
  });

  it("子ツモは2つとも選び終えた時点で1回だけ送信する", () => {
    const onSubmit = vi.fn();
    render(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={true}
        han={3}
        onSubmit={onSubmit}
        translationNamespace="x"
        autoSubmit
      />,
    );

    const [koSelect, oyaSelect] = screen.getAllByRole("combobox");
    const koValue = firstRealOptionValue(koSelect!);
    const oyaValue = firstRealOptionValue(oyaSelect!);

    // 片方だけではまだ送信しない
    fireEvent.change(koSelect!, { target: { value: koValue } });
    expect(onSubmit).not.toHaveBeenCalled();

    // 両方揃った時点で送信
    fireEvent.change(oyaSelect!, { target: { value: oyaValue } });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      type: "koTsumo",
      fromKo: Number(koValue),
      fromOya: Number(oyaValue),
    });
  });

  it("autoSubmit 無効時は選択しても送信せず、ボタンから送信する", () => {
    const onSubmit = vi.fn();
    render(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={false}
        han={3}
        onSubmit={onSubmit}
        translationNamespace="x"
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, {
      target: { value: firstRealOptionValue(select) },
    });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("ScoreAnswerForm のラベル", () => {
  function renderForm(isTsumo: boolean) {
    render(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={isTsumo}
        han={3}
        onSubmit={() => {}}
        translationNamespace="x"
      />,
    );
  }

  it("点数の select をラベルから引ける", () => {
    renderForm(false);

    expect(screen.getByLabelText("selectScore")).toBeDefined();
  });

  it("子ツモの2つの select をそれぞれのラベルから引ける", () => {
    renderForm(true);

    expect(screen.getByLabelText("fromKo")).toBeDefined();
    expect(screen.getByLabelText("fromOya")).toBeDefined();
  });
});

describe("ScoreAnswerForm の正誤フィードバック", () => {
  function renderForm(props: {
    isTsumo?: boolean;
    showFeedback?: boolean;
    lastAnswerCorrect?: boolean;
  }) {
    render(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={props.isTsumo ?? false}
        han={3}
        onSubmit={() => {}}
        translationNamespace="x"
        disabled={props.showFeedback}
        showFeedback={props.showFeedback}
        lastAnswerCorrect={props.lastAnswerCorrect}
      />,
    );
  }

  it("未回答では正誤の色を付けない", () => {
    renderForm({});

    const select = screen.getByRole("combobox");
    expect(select.className).toContain("border-ink");
    expect(select.className).not.toContain("border-success");
    expect(select.className).not.toContain("border-destructive");
  });

  it("正解の直後は緑に染まり、disabled のグレーを被せない", () => {
    renderForm({ showFeedback: true, lastAnswerCorrect: true });

    const select = screen.getByRole("combobox");
    expect(select.className).toContain("border-success");
    expect(select.className).toContain("bg-success-subtle");
    // 回答を送ると select は disabled になるため、グレーを残すと正誤の地を塗り潰す
    expect(select.className).not.toContain("disabled:bg-surface-100");
  });

  it("不正解の直後は赤に染まる", () => {
    renderForm({ showFeedback: true, lastAnswerCorrect: false });

    const select = screen.getByRole("combobox");
    expect(select.className).toContain("border-destructive");
    expect(select.className).toContain("bg-destructive-subtle");
  });

  it("無回答の正解開示中（lastAnswerCorrect が undefined）は色を付けない", () => {
    renderForm({ showFeedback: true });

    const select = screen.getByRole("combobox");
    expect(select.className).toContain("border-ink");
  });

  it("子ツモは2つの select をまとめて同じ色にする", () => {
    renderForm({ isTsumo: true, showFeedback: true, lastAnswerCorrect: false });

    for (const select of screen.getAllByRole("combobox")) {
      expect(select.className).toContain("border-destructive");
    }
  });
});
