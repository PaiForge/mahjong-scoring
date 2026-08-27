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
