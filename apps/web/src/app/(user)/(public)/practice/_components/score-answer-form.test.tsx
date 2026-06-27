import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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
        questionKey="q1"
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
        questionKey="q1"
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
      scoreFromKo: Number(koValue),
      scoreFromOya: Number(oyaValue),
    });
  });

  it("autoSubmit 無効時は選択しても送信せず、ボタンから送信する", () => {
    const onSubmit = vi.fn();
    render(
      <ScoreAnswerForm
        isOya={false}
        isTsumo={false}
        han={3}
        questionKey="q1"
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
