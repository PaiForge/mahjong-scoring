import { cleanup, act, fireEvent, screen } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSearchParams } from "@/test/navigation-mock";

// driver.js は実際には起動せず、「?」から渡った手順と drive() の呼び出しだけを見る
const { driverMock, driveMock } = vi.hoisted(() => {
  const drive = vi.fn();
  const driver = vi.fn((_config: { steps: readonly unknown[] }) => ({
    drive,
    destroy: vi.fn(),
    // SpotlightTour はツアー中の click を捕捉してこれを引く。無いと後続の
    // テストの click で未処理の例外になる
    getActiveElement: vi.fn<() => Element | undefined>(),
  }));
  return { driverMock: driver, driveMock: drive };
});
vi.mock("driver.js", () => ({ driver: driverMock }));

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 盤面は手牌の見せ方を決める Provider の中にある。Provider がログイン状態を読む
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
// 役の欄（YakuSelect）は features の共有フックが use-intl から辞書を読む
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "../../_actions/begin-practice-question",
  async () => await import("@/test/begin-practice-question-mock"),
);

const { beginPracticeQuestion, peekPracticeQuota } =
  await import("@/test/begin-practice-question-mock");
const { AgariScoreBoard } = await import("./agari-score-board");
const { useAgariScoreStore } = await import("../_hooks/use-agari-score-store");
const { _resetPracticeQuota, usePracticeQuotaStore } =
  await import("../../_hooks/use-practice-quota");
const { AGARI_SCORE_TOUR_ID } = await import("../_lib/tour-ids");

const LAST_FREE = {
  success: true,
  allowed: true,
  remaining: 0,
  limit: 5,
  signedIn: true,
  benefits: [],
} as const;

/**
 * React が DOM ノードに控えている props から onClick を取り出す。disabled の
 * ボタンは React が click を捨てるので、処理そのものを呼ぶときに使う
 */
function reactOnClickOf(node: Element): () => void {
  const key = Object.keys(node).find((k) => k.startsWith("__reactProps$"));
  const props = key
    ? (node as unknown as Record<string, { onClick?: () => void }>)[key]
    : undefined;
  if (!props?.onClick) throw new Error("onClick が付いていない");
  return props.onClick;
}

/** クエリを与えて盤面をマウントする（問題生成は effect 内なので act で包む） */
async function visit(query: string) {
  setSearchParams(query);
  await act(async () => {
    render(<AgariScoreBoard />);
  });
}

describe("AgariScoreBoard", () => {
  beforeEach(() => {
    driverMock.mockClear();
    driveMock.mockClear();
    cleanup();
    beginPracticeQuestion.mockClear();
    peekPracticeQuota.mockClear();
    _resetPracticeQuota();
    useAgariScoreStore.getState().setQuestion(undefined);
  });

  it("無料枠を使い切っていれば問題を作らずペイウォールを出す", async () => {
    beginPracticeQuestion.mockResolvedValueOnce({
      success: true,
      allowed: false,
      remaining: 0,
      limit: 1,
      signedIn: false,
      benefits: [],
    });
    useAgariScoreStore.getState().setQuestion(undefined);

    await visit("");

    expect(useAgariScoreStore.getState().currentQuestion).toBeUndefined();
    expect(screen.getByText("perksTitle")).toBeDefined();
    // 未ログインは先にログインを勧め、料金ページは二の次
    expect(screen.getByRole("link", { name: "signInCta" })).toBeDefined();
    expect(screen.getByRole("link", { name: "planCta" })).toBeDefined();
  });

  it("問題を作る前に無料枠の消費を 1 回だけ聞く", async () => {
    await visit("ranges=non");
    expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
    expect(beginPracticeQuestion).toHaveBeenCalledWith("agari-score");
  });

  // ゲートは重なった要求を弾かず返事を捨てるだけなので、要求が 2 回届けば
  // ログイン済みの無料枠は 2 回減る。ボタンの disabled が外れても（部品の
  // 差し替え等）処理側で止まることを確かめる。React は DOM の属性ではなく
  // props の disabled を見て click を捨てるので、属性を外して押しても
  // 処理に届かない。ボタンに付いた onClick を直接呼んで、処理自身が
  // 確認中を弾くことを見る
  it("返事を待つ間に「次の問題へ」を重ねて押しても、無料枠の消費は 1 回だけ聞く", async () => {
    await visit("");
    expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
    act(() => {
      useAgariScoreStore.getState().revealAnswer();
    });

    let release: (() => void) | undefined;
    beginPracticeQuestion.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ...LAST_FREE, remaining: 2 });
        }),
    );
    const next = screen.getByRole("button", { name: "result.next" });
    fireEvent.click(next);
    expect(beginPracticeQuestion).toHaveBeenCalledTimes(2);
    expect(next).toHaveProperty("disabled", true);

    act(() => {
      reactOnClickOf(next)();
    });
    expect(beginPracticeQuestion).toHaveBeenCalledTimes(2);

    await act(async () => release?.());
    expect(useAgariScoreStore.getState().isAnswered).toBe(false);
    expect(screen.getByText("board.questionPrompt")).toBeDefined();
  });

  it("クエリの出題条件をストアへ移してから問題を作る", async () => {
    await visit("yaku=chiitoitsu&ranges=non");

    const { options, currentQuestion } = useAgariScoreStore.getState();
    expect(options.requiredYaku).toEqual(["七対子"]);
    expect(options.allowedRanges).toEqual(["nonMangan"]);
    expect(currentQuestion).toBeDefined();
  });

  // ストアはモジュールスコープで、練習ページを離れても破棄されない。
  // 空に戻すのは設定画面の「開始」だけなので、教本のリンクから入り直す経路では
  // 必ず前回の問題が残った状態で再訪する
  it("前回の問題が残っていても、入り直せば新しい条件で作り直す", async () => {
    await visit("");
    const previous = useAgariScoreStore.getState().currentQuestion;
    expect(previous).toBeDefined();

    // 「開始」を経由せずに離脱して、教本から条件付きで入り直す
    cleanup();
    await visit("yaku=chiitoitsu&ranges=non");

    const { options, currentQuestion } = useAgariScoreStore.getState();
    expect(options.requiredYaku).toEqual(["七対子"]);
    expect(currentQuestion).not.toBe(previous);
  });

  // 生成はサーバーの許可を待ってから走る。返事が届くまでの間、前回の問題を
  // 新しい条件の盤面に出さない（遅い回線では前回の問題に答えられてしまう）
  it("入り直したら、サーバーの返事を待つ間も前回の問題を出さない", async () => {
    await visit("");
    expect(useAgariScoreStore.getState().currentQuestion).toBeDefined();

    let release: (() => void) | undefined;
    beginPracticeQuestion.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              success: true,
              allowed: true,
              remaining: "unlimited",
              limit: "unlimited",
              signedIn: true,
              benefits: [],
            });
        }),
    );
    cleanup();
    await visit("yaku=chiitoitsu&ranges=non");

    expect(useAgariScoreStore.getState().currentQuestion).toBeUndefined();
    expect(screen.queryByText("board.questionPrompt")).toBeNull();

    await act(async () => release?.());
    expect(useAgariScoreStore.getState().currentQuestion).toBeDefined();
  });

  // 同じ play のままクエリだけ変わる遷移（平和の練習 → 七対子の練習）。
  // コンポーネントは再マウントされないため、マウント一度きりの初期化では効かない
  it("マウントしたままクエリが変わっても条件を入れ替える", async () => {
    const { rerender } = render(<AgariScoreBoard />);
    await act(async () => {
      setSearchParams("yaku=pinfu");
      rerender(<AgariScoreBoard />);
    });
    expect(useAgariScoreStore.getState().options.requiredYaku).toEqual([
      "平和",
    ]);

    await act(async () => {
      setSearchParams("yaku=chiitoitsu");
      rerender(<AgariScoreBoard />);
    });
    expect(useAgariScoreStore.getState().options.requiredYaku).toEqual([
      "七対子",
    ]);
  });

  it("入り直したら前回の練習の成績は持ち越さない", async () => {
    await visit("");
    act(() => {
      useAgariScoreStore.setState({ stats: { total: 7, correct: 5 } });
    });

    cleanup();
    await visit("yaku=chiitoitsu");

    expect(useAgariScoreStore.getState().stats).toEqual({
      total: 0,
      correct: 0,
    });
  });

  // 盤面を離れて戻ってきた経路（「制限なしで続けるには」で料金ページを見て
  // ブラウザバック等）。ストアに同じ条件の問題が残っているので、消費し直さず
  // 解答中の問題を続ける
  describe("同じ条件で戻ってきたとき", () => {
    it("消費し直さず、問題・成績・残数の表示を引き継ぐ", async () => {
      beginPracticeQuestion.mockResolvedValueOnce({
        ...LAST_FREE,
        remaining: 2,
      });
      await visit("ranges=non");
      const question = useAgariScoreStore.getState().currentQuestion;
      expect(question).toBeDefined();
      act(() => {
        useAgariScoreStore.setState({ stats: { total: 2, correct: 1 } });
      });
      peekPracticeQuota.mockResolvedValueOnce({ ...LAST_FREE, remaining: 2 });

      cleanup();
      await visit("ranges=non");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
      const state = useAgariScoreStore.getState();
      expect(state.currentQuestion).toBe(question);
      expect(state.stats).toEqual({ total: 2, correct: 1 });
      expect(screen.getByText("board.questionPrompt")).toBeDefined();
      expect(screen.getByText("remaining")).toBeDefined();
    });

    it("最後の 1 問（残り 0）でも、戻ればその問題を続けられる", async () => {
      beginPracticeQuestion.mockResolvedValueOnce(LAST_FREE);
      await visit("");
      const question = useAgariScoreStore.getState().currentQuestion;

      cleanup();
      await visit("");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
      expect(useAgariScoreStore.getState().currentQuestion).toBe(question);
      expect(screen.queryByText("perksTitle")).toBeNull();
    });

    it("残数と特典は消費しない問い合わせで取り直す", async () => {
      beginPracticeQuestion.mockResolvedValueOnce({
        ...LAST_FREE,
        remaining: 2,
      });
      await visit("");
      peekPracticeQuota.mockResolvedValueOnce({
        ...LAST_FREE,
        remaining: "unlimited",
        limit: "unlimited",
        benefits: ["unlimited_practice", "practice_tools"],
      });

      cleanup();
      await visit("");

      expect(peekPracticeQuota).toHaveBeenCalledWith("agari-score");
      expect(
        usePracticeQuotaStore.getState().menus["agari-score"]?.gate,
      ).toEqual({
        kind: "open",
        remaining: "unlimited",
        limit: "unlimited",
        benefits: ["unlimited_practice", "practice_tools"],
      });
      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
    });

    it("返事を待つ間に離れても、戻ったときに聞き直さず、届いた問題を続ける", async () => {
      let release: (() => void) | undefined;
      beginPracticeQuestion.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () => resolve({ ...LAST_FREE, remaining: 2 });
          }),
      );
      await visit("");
      expect(useAgariScoreStore.getState().currentQuestion).toBeUndefined();

      cleanup();
      await visit("");
      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);

      await act(async () => release?.());
      expect(useAgariScoreStore.getState().currentQuestion).toBeDefined();
      expect(screen.getByText("board.questionPrompt")).toBeDefined();
    });

    it("上限で止まっていたら聞き直す（ペイウォールからログインして戻る経路）", async () => {
      beginPracticeQuestion.mockResolvedValueOnce({
        ...LAST_FREE,
        allowed: false,
        signedIn: false,
        limit: 1,
      });
      await visit("");
      expect(screen.getByText("perksTitle")).toBeDefined();

      cleanup();
      await visit("");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(2);
      expect(useAgariScoreStore.getState().currentQuestion).toBeDefined();
      expect(screen.queryByText("perksTitle")).toBeNull();
    });

    it("設定画面の「開始」を通れば、同じ条件でも新しい問題を作る", async () => {
      await visit("ranges=non");
      const previous = useAgariScoreStore.getState().currentQuestion;

      // 「開始」はストアを空に戻してから play へ遷移する（score-setup-form）
      cleanup();
      useAgariScoreStore.getState().setQuestion(undefined);
      await visit("ranges=non");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(2);
      expect(useAgariScoreStore.getState().currentQuestion).not.toBe(previous);
    });
  });

  // 出題文の横の「?」が照らす要素。役の欄は設定で役の回答を求めるときだけ
  // 描かれ、ツアーは無いものを飛ばす（印が無いことで飛ばされる）
  describe("ヘルプツアー", () => {
    interface DriverStep {
      readonly element: Element;
      readonly popover: { readonly description: string };
    }

    /** 「?」を押し、driver.js に渡った手順を返す */
    function startTour(): readonly DriverStep[] {
      fireEvent.click(screen.getByLabelText("label"));
      expect(driverMock).toHaveBeenCalledTimes(1);
      expect(driveMock).toHaveBeenCalledTimes(1);
      const config = driverMock.mock.calls[0]?.[0];
      if (!config) throw new Error("driver に設定が渡っていない");
      return config.steps as readonly DriverStep[];
    }

    const tourIdsOf = (steps: readonly DriverStep[]) =>
      steps.map((step) => step.element.getAttribute("data-tour-id"));

    it("既定の設定では翻数・符の欄が無く、盤面・点数・回答・開示の順に照らす", async () => {
      await visit("");

      expect(tourIdsOf(startTour())).toEqual([
        AGARI_SCORE_TOUR_ID.board,
        AGARI_SCORE_TOUR_ID.score,
        AGARI_SCORE_TOUR_ID.submit,
        AGARI_SCORE_TOUR_ID.reveal,
      ]);
    });

    it("翻数と符も答える設定では盤面・各欄・回答・開示の順に照らす", async () => {
      await visit("han_fu=1");

      expect(tourIdsOf(startTour())).toEqual([
        AGARI_SCORE_TOUR_ID.board,
        AGARI_SCORE_TOUR_ID.han,
        AGARI_SCORE_TOUR_ID.fu,
        AGARI_SCORE_TOUR_ID.score,
        AGARI_SCORE_TOUR_ID.submit,
        AGARI_SCORE_TOUR_ID.reveal,
      ]);
    });

    it("役の回答を求める設定では役の欄も照らす", async () => {
      await visit("mode=with_yaku&han_fu=1");

      expect(tourIdsOf(startTour())).toEqual([
        AGARI_SCORE_TOUR_ID.board,
        AGARI_SCORE_TOUR_ID.yaku,
        AGARI_SCORE_TOUR_ID.han,
        AGARI_SCORE_TOUR_ID.fu,
        AGARI_SCORE_TOUR_ID.score,
        AGARI_SCORE_TOUR_ID.submit,
        AGARI_SCORE_TOUR_ID.reveal,
      ]);
    });

    it("盤面の印は包む div ではなく盤面の要素に付く（<sm の負のマージンが効く）", async () => {
      await visit("");

      const board = document.querySelector(
        `[data-tour-id="${AGARI_SCORE_TOUR_ID.board}"]`,
      );
      expect(board?.className).toContain("bg-primary-800");
    });

    // 翻数と符の説明は出題設定で変わる。設定と違う操作を案内すると、
    // 従った人が回答できなくなる
    it("翻数と符を答える既定の設定では満貫以上を区分で答え、符が不要と案内する", async () => {
      await visit("han_fu=1");

      const descriptions = startTour().map((s) => s.popover.description);
      expect(descriptions).toContain("han.description");
      expect(descriptions).toContain("fu.description");
    });

    it("5翻以上も翻数で答え、満貫でも符を答える設定では、それに合わせて案内する", async () => {
      await visit("han_fu=1&exact_han=1&fu_mangan=1");

      const descriptions = startTour().map((s) => s.popover.description);
      expect(descriptions).toContain("han.descriptionExact");
      expect(descriptions).toContain("fu.descriptionRequired");
    });

    it("答え合わせの段階では「?」を出さない", async () => {
      await visit("");
      act(() => {
        useAgariScoreStore.getState().revealAnswer();
      });

      expect(screen.queryByLabelText("label")).toBeNull();
    });
  });
});
