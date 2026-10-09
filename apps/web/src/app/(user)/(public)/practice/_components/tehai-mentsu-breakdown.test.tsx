import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { FuroType, HaiKind, MentsuType, Tacha } from "@mahjong-scoring/core";
import type { CompletedMentsu, HaiKindId } from "@mahjong-scoring/core";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

// 牌画像そのものは検証対象ではないため、牌IDだけ持つスタブに差し替える。
// グループ分け（4面子 + 1雀頭）と、和了牌の枠・副露の並べ方を
// DOM から読めれば足りる。
vi.mock("@pai-forge/mahjong-react-ui", () => ({
  Hai: ({ hai, highlighted }: { hai: number; highlighted?: boolean }) => (
    <span data-testid="hai" data-highlighted={highlighted === true}>
      {hai}
    </span>
  ),
  Furo: ({
    mentsu,
    furo,
  }: {
    mentsu: CompletedMentsu;
    furo?: { type: string };
  }) => (
    <span data-testid="furo" data-furo-type={furo?.type ?? "none"}>
      {mentsu.hais.map((hai, i) => (
        <span key={i} data-testid="hai" data-highlighted={false}>
          {hai}
        </span>
      ))}
    </span>
  ),
}));

/** 234m 456p 678s 白白白 + 99m（白の役あり） */
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

/** モーダルを開く */
function openModal() {
  fireEvent.click(screen.getByRole("button", { name: "mentsuBreakdown" }));
}

/**
 * 分解の表
 *
 * モーダルは表の上に分ける前の手牌も並べるため、分解の検証は表の中に絞る
 */
function breakdownTable() {
  return within(screen.getByRole("table"));
}

/** 分解の表で枠が付いている牌の牌種一覧 */
function highlightedHais(): number[] {
  return breakdownTable()
    .getAllByTestId("hai")
    .filter((el) => el.dataset.highlighted === "true")
    .map((el) => Number(el.textContent));
}

describe("TehaiMentsuBreakdown", () => {
  it("リンクを押すとモーダルで4面子1雀頭が開く", () => {
    render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);

    // 既定はモーダルが閉じており、牌は描画されない
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryAllByTestId("hai")).toHaveLength(0);

    openModal();

    expect(screen.getByRole("dialog")).toBeTruthy();
    // 分ける前の手牌と分解の表の両方に、手牌14枚が過不足なく描画される
    expect(screen.getAllByTestId("hai")).toHaveLength(28);
    expect(breakdownTable().getAllByTestId("hai")).toHaveLength(14);
    // 4面子（順子3 + 暗刻1）と雀頭のラベル
    expect(screen.getAllByText("shuntsu")).toHaveLength(3);
    expect(screen.getAllByText("ankou")).toHaveLength(1);
    expect(screen.getAllByText("jantou")).toHaveLength(1);
  });

  it("閉じるボタンでモーダルが閉じる", () => {
    render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);

    openModal();
    fireEvent.click(screen.getByRole("button", { name: "close" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("隣の行やボタンへの押し間違いを防ぐタップ領域（min-h-11）を確保する", () => {
    render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);
    expect(
      screen.getByRole("button", { name: "mentsuBreakdown" }).className,
    ).toContain("min-h-11");
  });

  it("変則手（七対子）では導線ごと描画しない", () => {
    const { container } = render(
      <TehaiMentsuBreakdown
        tehai={CHIITOI_TEHAI}
        context={{ ...CONTEXT, agariHai: HaiKind.Haku }}
      />,
    );
    expect(container.childElementCount).toBe(0);
  });

  describe("和了牌のハイライト", () => {
    it("ツモ牌に枠が付くのは1箇所だけ", () => {
      render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);
      openModal();

      expect(highlightedHais()).toEqual([HaiKind.ManZu4]);
    });

    it("単騎待ちのロン牌は雀頭に付く", () => {
      // 234m 456p 678s 中中中 + 白白 で白の単騎ロン
      const tehai = {
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
          HaiKind.Chun,
          HaiKind.Chun,
          HaiKind.Chun,
          HaiKind.Haku,
          HaiKind.Haku,
        ] as readonly HaiKindId[],
        exposed: [],
      };

      render(
        <TehaiMentsuBreakdown
          tehai={tehai}
          context={{ ...CONTEXT, agariHai: HaiKind.Haku, isTsumo: false }}
        />,
      );
      openModal();

      expect(highlightedHais()).toEqual([HaiKind.Haku]);
    });
  });

  describe("手牌での形", () => {
    /** ポンした白の刻子 */
    const PON_HAKU: CompletedMentsu = {
      type: MentsuType.Koutsu,
      hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
      furo: { type: FuroType.Pon, from: Tacha.Toimen, nakiHai: HaiKind.Haku },
    };

    it("副露した刻子は明刻子として、鳴きの並びで見せる", () => {
      const tehai = {
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
          HaiKind.ManZu9,
          HaiKind.ManZu9,
        ] as readonly HaiKindId[],
        exposed: [PON_HAKU],
      };

      render(<TehaiMentsuBreakdown tehai={tehai} context={CONTEXT} />);
      openModal();

      expect(screen.getByText("minkou")).toBeTruthy();
      expect(screen.queryByText("ankou")).toBeNull();
      expect(breakdownTable().getByTestId("furo").dataset.furoType).toBe(FuroType.Pon);
    });

    it("ロンで完成した刻子は明刻子とし、その旨を注記する", () => {
      // 234m 456p 678s 白白白 + 中中 で白をロン（シャンポン）
      const tehai = {
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
          HaiKind.Chun,
          HaiKind.Chun,
        ] as readonly HaiKindId[],
        exposed: [],
      };

      render(
        <TehaiMentsuBreakdown
          tehai={tehai}
          context={{ ...CONTEXT, agariHai: HaiKind.Haku, isTsumo: false }}
        />,
      );
      openModal();

      expect(screen.getByText("minkou")).toBeTruthy();
      // 鳴いていないので卓に晒す並びにはしない
      expect(breakdownTable().queryByTestId("furo")).toBeNull();
      expect(screen.getByText("mentsuBreakdownMinkouNote")).toBeTruthy();
    });

    it("暗刻だけの手では明刻子の注記を出さない", () => {
      render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);
      openModal();

      expect(screen.queryByText("mentsuBreakdownMinkouNote")).toBeNull();
    });

    it("暗槓は暗槓子として、伏せ牌を含む並びで見せる", () => {
      // 234m 456p 中中中 + 99m + 白暗槓
      const tehai = {
        closed: [
          HaiKind.ManZu2,
          HaiKind.ManZu3,
          HaiKind.ManZu4,
          HaiKind.PinZu4,
          HaiKind.PinZu5,
          HaiKind.PinZu6,
          HaiKind.Chun,
          HaiKind.Chun,
          HaiKind.Chun,
          HaiKind.ManZu9,
          HaiKind.ManZu9,
        ] as readonly HaiKindId[],
        exposed: [
          {
            type: MentsuType.Kantsu,
            hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
          } as CompletedMentsu,
        ],
      };

      render(<TehaiMentsuBreakdown tehai={tehai} context={CONTEXT} />);
      openModal();

      expect(screen.getByText("ankan")).toBeTruthy();
      expect(breakdownTable().getByTestId("furo").dataset.furoType).toBe("none");
    });
  });

  describe("解釈の候補", () => {
    /** 345m 345m 55m 123s 456s: 5m は雀頭にも順子にも入る */
    const TWO_WAYS_TEHAI = {
      closed: [
        HaiKind.ManZu3,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu5,
        HaiKind.ManZu5,
        HaiKind.ManZu5,
        HaiKind.SouZu1,
        HaiKind.SouZu2,
        HaiKind.SouZu3,
        HaiKind.SouZu4,
        HaiKind.SouZu5,
        HaiKind.SouZu6,
      ] as readonly HaiKindId[],
      exposed: [],
    };
    const RON_5M = { ...CONTEXT, agariHai: HaiKind.ManZu5, isTsumo: false };

    /** 候補の切り替えボタン（文言は「⭐ 符 翻」の形） */
    function candidateButtons() {
      return screen
        .getAllByRole("button")
        .filter((el) => el.textContent?.includes("mentsuBreakdownCandidateFu"));
    }

    /** 雀頭の行に枠付きの牌があるか */
    function jantouHighlighted(): boolean {
      const row = screen.getByText("jantou").closest("tr");
      if (!row) throw new Error("雀頭の行が見つからない");
      return Array.from(row.querySelectorAll("[data-testid=hai]")).some(
        (el) => (el as HTMLElement).dataset.highlighted === "true",
      );
    }

    it("解釈が 1 つの手では切り替えを出さない", () => {
      render(<TehaiMentsuBreakdown tehai={MENTSU_TEHAI} context={CONTEXT} />);
      openModal();

      expect(candidateButtons()).toHaveLength(0);
      expect(screen.queryByText("mentsuBreakdownBest")).toBeNull();
    });

    it("解釈が分かれる手では候補を高点法の順に並べ、最高点にバッジを付ける", () => {
      render(<TehaiMentsuBreakdown tehai={TWO_WAYS_TEHAI} context={RON_5M} />);
      openModal();

      const buttons = candidateButtons();
      expect(buttons).toHaveLength(2);
      // 先頭（平和 + 一盃口 2翻30符）だけが最高点
      expect(buttons[0]?.textContent).toContain("mentsuBreakdownBest");
      expect(buttons[1]?.textContent).not.toContain("mentsuBreakdownBest");
    });

    it("候補を切り替えると分解と和了牌の位置が変わる", () => {
      render(<TehaiMentsuBreakdown tehai={TWO_WAYS_TEHAI} context={RON_5M} />);
      openModal();

      // 既定は最高点の解釈: 5m は順子（両面）に入り、雀頭には付かない
      expect(highlightedHais()).toEqual([HaiKind.ManZu5]);
      expect(jantouHighlighted()).toBe(false);

      fireEvent.click(candidateButtons()[1]!);

      // 単騎の解釈: 5m は雀頭に付く
      expect(highlightedHais()).toEqual([HaiKind.ManZu5]);
      expect(jantouHighlighted()).toBe(true);
    });
  });
});
