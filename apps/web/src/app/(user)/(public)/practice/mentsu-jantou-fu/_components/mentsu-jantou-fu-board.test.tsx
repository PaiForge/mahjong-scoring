import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { MentsuJantouFuBoard } = await import("./mentsu-jantou-fu-board");

/** 出題が描かれるまで待ってから、行ごとの符ボタンの先頭を返す */
async function findFirstFuButtonPerRow(): Promise<readonly HTMLElement[]> {
  const buttons = await screen.findAllByRole("button", { name: "0" });
  return buttons;
}

describe("MentsuJantouFuBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("「回答する」ボタンを持たず、最後の行を選んだ時点で 1 回だけ送信する", async () => {
    const onAnswer = vi.fn();
    render(<MentsuJantouFuBoard showFeedback={false} onAnswer={onAnswer} />);

    const rows = await findFirstFuButtonPerRow();
    expect(rows.length).toBeGreaterThan(1);
    expect(screen.queryByRole("button", { name: "answerButton" })).toBeNull();
    expect(screen.queryByRole("button", { name: "checkButton" })).toBeNull();

    // 最後の行を選ぶまでは送信しない
    for (const button of rows.slice(0, -1)) fireEvent.click(button);
    expect(onAnswer).not.toHaveBeenCalled();

    fireEvent.click(rows[rows.length - 1]!);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("最後の行を選ぶ前なら、選んだ行を選び直しても送信しない", async () => {
    const onAnswer = vi.fn();
    render(<MentsuJantouFuBoard showFeedback={false} onAnswer={onAnswer} />);

    const rows = await findFirstFuButtonPerRow();
    fireEvent.click(rows[0]!);
    fireEvent.click(rows[0]!);
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
