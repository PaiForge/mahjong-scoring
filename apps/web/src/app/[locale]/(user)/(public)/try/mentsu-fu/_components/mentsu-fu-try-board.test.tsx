import { cleanup, fireEvent, screen } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

const { MentsuFuTryBoard } = await import("./mentsu-fu-try-board");

/**
 * 選択肢のボタン。辞書のモックは引数を埋めず、どの選択肢も同じ文言になるので
 * 並び（符の小さい順: 0, 2, 4, 8, 16, 32）で引く
 */
function choice(fu: number) {
  const index = [0, 2, 4, 8, 16, 32].indexOf(fu);
  return screen.getAllByRole("button", { name: "choiceLabels.fu" })[index];
}

describe("MentsuFuTryBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("解く前は導線を出さず、ヒントを出せる", () => {
    render(<MentsuFuTryBoard afterAnswer={<p>after</p>} />);

    expect(screen.queryByText("after")).toBeNull();
    expect(screen.queryByTestId("lesson-hint")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "showHint" }));
    expect(screen.getByTestId("lesson-hint")).toBeTruthy();
  });

  it("選択肢を選ぶと正誤と導線を出し、ヒントのボタンを消す", () => {
    render(<MentsuFuTryBoard afterAnswer={<p>after</p>} />);

    fireEvent.click(choice(8));

    // 么九牌の暗刻は 8 符（「incorrect」も「correct」を含むので両方見る）
    const judgement = screen.getByTestId("lesson-judgement").textContent;
    expect(judgement).toContain("correct");
    expect(judgement).not.toContain("incorrect");
    expect(screen.getByText("after")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "showHint" })).toBeNull();
  });
});
