import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HaiKind } from "@mahjong-scoring/core";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

// 牌画像そのものは検証対象ではないため、牌IDだけ持つスタブに差し替える。
// グループ分け（4面子 + 1雀頭）の構造を DOM から数えられれば足りる。
vi.mock("@pai-forge/mahjong-react-ui", () => ({
  Hai: ({ hai }: { hai: number }) => <span data-testid="hai">{hai}</span>,
}));

/** 234m 456p 678s 白白白 + 99m（白の役あり・ツモ） */
const MENTSU_TEHAI = {
  closed: [
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.PinZu4,
    HaiKind.PinZu5,
    HaiKind.PinZu6,
    HaiKind.SouZu6,
    HaiKind.SouZu7,
    HaiKind.SouZu8,
    HaiKind.Haku,
    HaiKind.Haku,
    HaiKind.Haku,
    HaiKind.ManZu9,
    HaiKind.ManZu9,
  ],
  exposed: [],
} as const;

/** 七対子（ツモ） */
const CHIITOI_TEHAI = {
  closed: [
    HaiKind.ManZu1,
    HaiKind.ManZu1,
    HaiKind.ManZu3,
    HaiKind.ManZu3,
    HaiKind.PinZu2,
    HaiKind.PinZu2,
    HaiKind.PinZu4,
    HaiKind.PinZu4,
    HaiKind.SouZu5,
    HaiKind.SouZu5,
    HaiKind.SouZu7,
    HaiKind.SouZu7,
    HaiKind.Haku,
    HaiKind.Haku,
  ],
  exposed: [],
} as const;

const CONTEXT = {
  agariHai: HaiKind.ManZu4,
  isTsumo: true,
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
} as const;

describe("TehaiMentsuBreakdown", () => {
  it("既定は閉じており、トグルで4面子1雀頭が開く", () => {
    render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);

    const toggle = screen.getByRole("button", {
      name: "mentsuBreakdownShow",
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryAllByTestId("hai")).toHaveLength(0);

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // 手牌14枚が過不足なく描画される
    expect(screen.getAllByTestId("hai")).toHaveLength(14);
    // 4面子（順子3 + 刻子1）と雀頭のラベル
    expect(screen.getAllByText("shuntsu")).toHaveLength(3);
    expect(screen.getAllByText("koutsu")).toHaveLength(1);
    expect(screen.getAllByText("jantou")).toHaveLength(1);
  });

  it("変則手（七対子）ではトグルごと描画しない", () => {
    const { container } = render(
      <TehaiMentsuBreakdown
        tehai={CHIITOI_TEHAI}
        context={{ ...CONTEXT, agariHai: HaiKind.Haku }}
      />,
    );
    expect(container.childElementCount).toBe(0);
  });
});
