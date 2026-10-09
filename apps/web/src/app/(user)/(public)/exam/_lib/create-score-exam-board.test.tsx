import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 符の内訳の文字列は features の共有フックが use-intl から引く
vi.mock("use-intl", async () => await import("@/test/intl-mock"));

const { createScoreExamBoard } = await import("./create-score-exam-board");
const { TrainingModeProvider } =
  await import("@mahjong-scoring/features/practice/use-training-mode");

/** 出題条件を絞らない盤面（生成の試行回数を抑えるため） */
const Board = createScoreExamBoard({
  translationNamespace: "x",
  generateOptions: {},
  scoreRange: "all",
});

/** 満貫未満だけを出す盤面（符の内訳が出る側） */
const NonManganBoard = createScoreExamBoard({
  translationNamespace: "x",
  generateOptions: { allowedRanges: ["nonMangan"] },
  scoreRange: "nonMangan",
});

/** 満貫以上だけを出す盤面（符が点数に効かない側） */
const ManganPlusBoard = createScoreExamBoard({
  translationNamespace: "x",
  generateOptions: { allowedRanges: ["manganPlus"] },
  scoreRange: "all",
});

/** 模試の回答後の停止中として盤面を描く */
function renderHolding(BoardComponent: typeof Board) {
  return render(
    <TrainingModeProvider
      value={{ isRevealed: false, isHolding: true, registerAdvance: () => {} }}
    >
      <BoardComponent
        showFeedback
        lastAnswerCorrect={undefined}
        onAnswer={() => {}}
      />
    </TrainingModeProvider>,
  );
}

/**
 * @param holding 模試の回答後の停止中として描くか。
 *   省略するとコンテキストごと与えず、本番の試験と同じ条件になる
 */
function renderBoard(
  props: {
    readonly showFeedback?: boolean;
    readonly onAnswer?: (isCorrect: boolean, advance: () => void) => void;
  } = {},
  holding?: boolean,
) {
  const board = (
    <Board
      showFeedback={props.showFeedback ?? false}
      lastAnswerCorrect={undefined}
      onAnswer={props.onAnswer ?? (() => {})}
    />
  );

  if (holding === undefined) return render(board);

  return render(
    <TrainingModeProvider
      value={{
        isRevealed: false,
        isHolding: holding,
        registerAdvance: () => {},
      }}
    >
      {board}
    </TrainingModeProvider>,
  );
}

function firstRealOptionValue(select: HTMLElement): string {
  const opts = within(select)
    .getAllByRole("option")
    .filter((o) => (o as HTMLOptionElement).value !== "");
  return (opts[0] as HTMLOptionElement).value;
}

describe("createScoreExamBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("「回答する」ボタンを持たず、select を選んだ時点で回答が確定する", () => {
    const onAnswer = vi.fn();
    renderBoard({ onAnswer });

    expect(screen.queryByRole("button", { name: "answer" })).toBeNull();

    // 子ツモは select が 2 つ。全部選び終えた時点で 1 回だけ送信する
    const selects = screen.getAllByRole("combobox");
    for (const select of selects) {
      fireEvent.change(select, {
        target: { value: firstRealOptionValue(select) },
      });
    }

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("本番の試験では翻数の内訳を出さない（読ませる間もタイマーが進むため）", () => {
    renderBoard({ showFeedback: true });

    expect(screen.queryByRole("button", { name: "title" })).toBeNull();
  });

  it("模試の答え合わせでは、回答欄の下に閉じた内訳が出る", () => {
    renderBoard({ showFeedback: true }, true);

    const toggle = screen.getByRole("button", { name: "title" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    // 回答欄より後ろ＝上の手牌と select の色を動かさずに下へ伸びる
    const selects = screen.getAllByRole("combobox");
    const lastSelect = selects[selects.length - 1]!;
    expect(
      lastSelect.compareDocumentPosition(toggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("模試の答え合わせでは、満貫未満なら符の内訳も閉じて出る", () => {
    renderHolding(NonManganBoard);

    const toggle = screen.getByRole("button", { name: "breakdownTitle" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("満貫以上の問題では符の内訳を出さない（符が点数に効かないため）", () => {
    renderHolding(ManganPlusBoard);

    expect(screen.queryByRole("button", { name: "breakdownTitle" })).toBeNull();
    expect(screen.getByRole("button", { name: "title" })).toBeDefined();
  });

  it("本番の試験では符の内訳も出さない", () => {
    render(
      <NonManganBoard
        showFeedback
        lastAnswerCorrect={undefined}
        onAnswer={() => {}}
      />,
    );

    expect(screen.queryByRole("button", { name: "breakdownTitle" })).toBeNull();
  });

  it("模試でも回答前は内訳を出さない（答えの先出しになるため）", () => {
    renderBoard({}, false);

    expect(screen.queryByRole("button", { name: "title" })).toBeNull();
  });
});
