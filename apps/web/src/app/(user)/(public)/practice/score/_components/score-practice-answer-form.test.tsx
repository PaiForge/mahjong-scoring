import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

function renderForm(
  props: Partial<{ requireFuForMangan: boolean; isTsumo: boolean }> = {},
) {
  render(
    <ScorePracticeAnswerForm
      onSubmit={() => {}}
      isTsumo={props.isTsumo ?? false}
      isOya={false}
      requireFuForMangan={props.requireFuForMangan ?? false}
    />,
  );
}

/** ラベルから引く（紐付いていなければ取得に失敗する） */
function select(label: string) {
  return screen.getByLabelText(label) as HTMLSelectElement;
}

function selectHan(han: number) {
  fireEvent.change(select("form.labels.han"), {
    target: { value: String(han) },
  });
}

describe("ScorePracticeAnswerForm", () => {
  it("満貫以上を選んでも符の select は残す（消すとブロックの高さが縮み、下の入力がせり上がる）", () => {
    renderForm();

    selectHan(MANGAN_MIN_HAN);

    const fu = select("form.labels.fu");
    expect(fu.disabled).toBe(true);
    expect(fu.textContent).toBe("form.messages.fuNotRequired");
  });

  it("「満貫以上も符を入力」が有効なら満貫以上でも符を選べる", () => {
    renderForm({ requireFuForMangan: true });

    selectHan(MANGAN_MIN_HAN);

    expect(select("form.labels.fu").disabled).toBe(false);
  });

  it("満貫以上から翻数を戻すと、選んでいた符が復帰する", () => {
    renderForm();

    fireEvent.change(select("form.labels.fu"), { target: { value: "40" } });
    selectHan(MANGAN_MIN_HAN);
    selectHan(3);

    expect(select("form.labels.fu").value).toBe("40");
  });

  it("子ツモの2つの点数 select は「子」「親」で名付ける（ラベルは1つしかないため）", () => {
    renderForm({ isTsumo: true });

    selectHan(3);

    expect(select("form.placeholders.fromKo")).toBeDefined();
    expect(select("form.placeholders.fromOya")).toBeDefined();
    // ラベルは 2 つの select をまとめる group の名前として使う
    expect(
      screen.getByRole("group", { name: "form.labels.score" }),
    ).toBeDefined();
  });
});

describe("ScorePracticeAnswerForm の回答ボタン", () => {
  const submitButton = () =>
    screen.getByRole("button", { name: "form.buttons.answer" });

  it("翻・符・点数が揃うまで押せない（揃っていないのに押せて何も起きない状態を作らない）", () => {
    renderForm({ isTsumo: false });
    expect(submitButton().hasAttribute("disabled")).toBe(true);

    selectHan(3);
    expect(submitButton().hasAttribute("disabled")).toBe(true);

    fireEvent.change(select("form.labels.fu"), { target: { value: "30" } });
    expect(submitButton().hasAttribute("disabled")).toBe(true);

    const scoreSelect = select("form.labels.score");
    const firstScore = Array.from(scoreSelect.options).find(
      (option) => option.value !== "",
    );
    fireEvent.change(scoreSelect, { target: { value: firstScore?.value } });
    expect(submitButton().hasAttribute("disabled")).toBe(false);
  });

  it("子ツモは子・親の両方の点数が入るまで押せない", () => {
    renderForm({ isTsumo: true });
    selectHan(3);
    fireEvent.change(select("form.labels.fu"), { target: { value: "30" } });

    const ko = select("form.placeholders.fromKo");
    const oya = select("form.placeholders.fromOya");
    const firstOf = (s: HTMLSelectElement) =>
      Array.from(s.options).find((option) => option.value !== "")?.value;
    fireEvent.change(ko, { target: { value: firstOf(ko) } });
    expect(submitButton().hasAttribute("disabled")).toBe(true);

    fireEvent.change(oya, { target: { value: firstOf(oya) } });
    expect(submitButton().hasAttribute("disabled")).toBe(false);
  });
});

describe("ScorePracticeAnswerForm 役なし", () => {
  it("noYaku を渡すとボタンが出て、押した時点で onSelect が呼ばれる（回答ボタンを経由しない）", () => {
    const onSelect = vi.fn();
    const onSubmitScore = vi.fn();
    render(
      <ScorePracticeAnswerForm
        onSubmit={onSubmitScore}
        isTsumo={false}
        isOya={false}
        reserveYakuRow
        noYaku={{ label: "役なし", onSelect }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "役なし" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSubmitScore).not.toHaveBeenCalled();
  });

  it("フォームが無効なら「役なし」も押せない", () => {
    const onSelect = vi.fn();
    render(
      <ScorePracticeAnswerForm
        onSubmit={() => {}}
        isTsumo={false}
        isOya={false}
        disabled
        reserveYakuRow
        noYaku={{ label: "役なし", onSelect }}
      />,
    );

    const button = screen.getByRole("button", { name: "役なし" });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("noYaku を渡さなければボタンは出ない（ツモのマス）", () => {
    renderForm({ isTsumo: true });
    expect(screen.queryByRole("button", { name: "役なし" })).toBeNull();
  });

  it("役の回答が不要でも reserveYakuRow なら「役」のラベル行だけ出す（高さを揃えるため）", () => {
    render(
      <ScorePracticeAnswerForm
        onSubmit={() => {}}
        isTsumo
        isOya={false}
        reserveYakuRow
      />,
    );
    expect(screen.getByText("form.labels.yaku")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "役なし" })).toBeNull();
  });
});
