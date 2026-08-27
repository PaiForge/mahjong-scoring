import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

/** フォームに並ぶ select は上から 翻数・符・点数 の順 */
const HAN = 0;
const FU = 1;

function renderForm(requireFuForMangan = false) {
  render(
    <ScorePracticeAnswerForm
      onSubmit={() => {}}
      isTsumo={false}
      isOya={false}
      requireFuForMangan={requireFuForMangan}
    />,
  );
  return screen.getAllByRole("combobox") as HTMLSelectElement[];
}

describe("ScorePracticeAnswerForm", () => {
  it("満貫以上を選んでも符の select は残す（消すとブロックの高さが縮み、下の入力がせり上がる）", () => {
    const selects = renderForm();

    fireEvent.change(selects[HAN]!, {
      target: { value: String(MANGAN_MIN_HAN) },
    });

    const fu = screen.getAllByRole("combobox")[FU]!;
    expect(fu.disabled).toBe(true);
    expect(fu.textContent).toBe("form.messages.fuNotRequired");
  });

  it("「満貫以上も符を入力」が有効なら満貫以上でも符を選べる", () => {
    const selects = renderForm(true);

    fireEvent.change(selects[HAN]!, {
      target: { value: String(MANGAN_MIN_HAN) },
    });

    const fu = screen.getAllByRole("combobox")[FU]!;
    expect(fu.disabled).toBe(false);
  });

  it("満貫以上から翻数を戻すと、選んでいた符が復帰する", () => {
    const selects = renderForm();

    fireEvent.change(selects[FU]!, { target: { value: "40" } });
    fireEvent.change(selects[HAN]!, {
      target: { value: String(MANGAN_MIN_HAN) },
    });
    fireEvent.change(selects[HAN]!, { target: { value: "3" } });

    expect(screen.getAllByRole("combobox")[FU]!.value).toBe("40");
  });
});
