import { screen, fireEvent, cleanup, within } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";

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

/** 子だけを出す盤面（子ツモの回答欄を引くため） */
const ChildBoard = createScoreExamBoard({
  translationNamespace: "x",
  generateOptions: { includeParent: false },
  scoreRange: "all",
});

/**
 * 子ツモの問題が出るまで盤面を描き直す（ツモ / ロンは出題ごとにランダム）
 *
 * @param isKoTsumo 描いた回答欄が子ツモのものか
 */
function renderKoTsumoBoard(
  onAnswer: () => void,
  isKoTsumo: (selects: readonly HTMLElement[]) => boolean,
): readonly HTMLElement[] {
  for (let i = 0; i < 100; i++) {
    const { unmount } = render(
      <ChildBoard
        showFeedback={false}
        lastAnswerCorrect={undefined}
        onAnswer={onAnswer}
      />,
    );
    const selects = screen.getAllByRole("combobox");
    if (isKoTsumo(selects)) return selects;
    unmount();
  }
  throw new Error("子ツモの問題が出なかった");
}

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

  afterEach(() => {
    useDisplaySettingsStore.setState({ koTsumoInput: "combined" });
  });

  it("子ツモは組の select 1 つで、選んだ時点で 1 回だけ送信する", () => {
    const onAnswer = vi.fn();
    const selects = renderKoTsumoBoard(onAnswer, (found) =>
      firstRealOptionValue(found[0]!).includes("/"),
    );
    expect(selects).toHaveLength(1);

    fireEvent.change(selects[0]!, {
      target: { value: firstRealOptionValue(selects[0]!) },
    });
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("子ツモの分割入力は 2 つとも選んだ時点で 1 回だけ送信する", () => {
    useDisplaySettingsStore.setState({ koTsumoInput: "split" });
    const onAnswer = vi.fn();
    const [ko, oya] = renderKoTsumoBoard(
      onAnswer,
      (found) => found.length === 2,
    );

    fireEvent.change(ko!, { target: { value: firstRealOptionValue(ko!) } });
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.change(oya!, { target: { value: firstRealOptionValue(oya!) } });
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("「回答する」ボタンを持たず、select を選んだ時点で回答が確定する", () => {
    const onAnswer = vi.fn();
    renderBoard({ onAnswer });

    expect(screen.queryByRole("button", { name: "answer" })).toBeNull();

    // 子ツモの分割入力（表示設定）なら select が 2 つ。全部選び終えた時点で
    // 1 回だけ送信する
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
