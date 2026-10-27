import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  begin: vi.fn(),
  answer: vi.fn(),
  pause: vi.fn(),
  reveal: vi.fn(),
  generated: vi.fn(),
  onAnswer: vi.fn(),
  recorded: vi.fn(),
  expired: vi.fn(),
}));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("@/lib/challenge/actions", () => ({
  beginChallenge: mocks.begin,
  answerChallenge: mocks.answer,
  pauseChallenge: mocks.pause,
  revealExpiredChallenge: mocks.reveal,
}));
import {
  VerifiedChallengeProvider,
  useVerifiedChallenge,
} from "./use-verified-challenge";
import { useFuChoiceBoard } from "@mahjong-scoring/features/practice/use-fu-choice-board";
import { usePresentQuestion } from "@mahjong-scoring/features/practice/use-present-question";

const hidden = { id: "question-1", tiles: [], agariHai: 0, answer: 20 };
const answered = { ...hidden, answer: 2 };
function identity<T>(value: T) {
  return value;
}
/** 記録された問題と符をそのまま並べる */
function pair<T>(question: T, fu: number | undefined) {
  return fu === undefined ? [question] : [question, fu];
}
function Board() {
  const challenge = useVerifiedChallenge();
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: mocks.generated,
    options: [0, 2],
    toResult: pair,
    showFeedback: false,
    onAnswer: mocks.onAnswer,
    onRecordResult: mocks.recorded,
  });
  usePresentQuestion(question, identity, mocks.recorded);
  return (
    <div>
      <p data-testid="answer">{question?.answer}</p>
      <p data-testid="selected">{selectedFu}</p>
      <p data-testid="grading">{String(challenge?.isGrading ?? false)}</p>
      <p data-testid="clock">{challenge?.clock?.elapsedMs}</p>
      <button onClick={() => handleSelect(1)}>answer</button>
      <button onClick={() => handleSelect(0)}>answer-other</button>
      <button onClick={challenge?.advance}>next</button>
      <button onClick={() => challenge?.expire(mocks.expired)}>expire</button>
      <p data-testid="reconnect">{challenge?.reconnect?.message ?? ""}</p>
      <button onClick={() => challenge?.reconnect?.onPress()}>reconnect</button>
    </div>
  );
}
function mount() {
  render(
    <VerifiedChallengeProvider slug="machi-fu">
      <Board />
    </VerifiedChallengeProvider>,
  );
}

describe("server-graded challenge UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.begin.mockResolvedValue({
      attempt: { id: "attempt-1", question: hidden, sequence: 0 },
    });
    mocks.answer.mockResolvedValue({
      answered,
      correct: true,
      question: { ...hidden, id: "question-2" },
      sequence: 1,
      elapsedMs: 12_345,
    });
    mocks.generated.mockReturnValue(answered);
    mocks.reveal.mockResolvedValue({ question: answered });
  });
  afterEach(cleanup);
  it("サーバー出題を表示し、ローカルでは生成・正解判定しない", async () => {
    mount();
    await screen.findByText("20");
    expect(mocks.generated).not.toHaveBeenCalled();
    expect(mocks.recorded).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("answer"));
    await waitFor(() =>
      expect(mocks.onAnswer).toHaveBeenCalledWith(true, expect.any(Function)),
    );
    expect(mocks.answer).toHaveBeenCalledWith("attempt-1", 0, 2);
    expect(mocks.recorded).toHaveBeenCalledWith([answered, 2]);
    expect(screen.getByTestId("answer").textContent).toBe("2");
    fireEvent.click(screen.getByText("next"));
    expect(screen.getByTestId("answer").textContent).toBe("20");
  });
  it("通信待ち・回答済みの連打を二重送信しない", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.answer.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount();
    await screen.findByText("20");
    fireEvent.click(screen.getByText("answer"));
    fireEvent.click(screen.getByText("answer"));
    await waitFor(() => expect(mocks.answer).toHaveBeenCalledTimes(1));
    await act(async () =>
      resolve({
        answered,
        correct: true,
        question: hidden,
        sequence: 1,
        elapsedMs: 0,
      }),
    );
    fireEvent.click(screen.getByText("answer"));
    expect(mocks.answer).toHaveBeenCalledTimes(1);
  });
  it("採点待ちの間は押した選択肢を立てたまま時計を止め、応答でサーバーの時計に合わせる", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.answer.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount();
    await screen.findByText("20");
    expect(screen.getByTestId("grading").textContent).toBe("false");
    fireEvent.click(screen.getByText("answer"));
    await waitFor(() =>
      expect(screen.getByTestId("grading").textContent).toBe("true"),
    );
    // 押した瞬間に印が立ち、受け付けなかった連打で別の選択肢へ動かない
    expect(screen.getByTestId("selected").textContent).toBe("2");
    fireEvent.click(screen.getByText("answer-other"));
    expect(screen.getByTestId("selected").textContent).toBe("2");
    expect(screen.getByTestId("clock").textContent).toBe("");
    await act(async () =>
      resolve({
        answered,
        correct: true,
        question: { ...hidden, id: "question-2" },
        sequence: 1,
        elapsedMs: 12_345,
      }),
    );
    expect(screen.getByTestId("grading").textContent).toBe("false");
    expect(screen.getByTestId("clock").textContent).toBe("12345");
    expect(mocks.onAnswer).toHaveBeenCalledTimes(1);
  });
  it("通信失敗ではローカル採点へ切り替えない", async () => {
    mocks.begin.mockRejectedValue(new Error("offline"));
    mount();
    await screen.findByRole("alert");
    expect(mocks.generated).not.toHaveBeenCalled();
    expect(mocks.onAnswer).not.toHaveBeenCalled();
  });
  it("匿名とサーバーが判定したときだけ非記録モードを使う", async () => {
    mocks.begin.mockResolvedValue({ error: "unauthorized" });
    mount();
    await screen.findByText("2");
    fireEvent.click(screen.getByText("answer"));
    expect(mocks.onAnswer).toHaveBeenCalledWith(true, expect.any(Function));
    expect(mocks.answer).not.toHaveBeenCalled();
  });
  it("時間切れ後に開示した未回答問題を結果に残す", async () => {
    mount();
    await screen.findByText("20");
    fireEvent.click(screen.getByText("expire"));
    await waitFor(() => expect(mocks.expired).toHaveBeenCalledTimes(1));
    expect(mocks.recorded).toHaveBeenCalledWith(answered);
  });
  describe("送り直し", () => {
    /**
     * 送り直しの待ち時間（500ms → 1s → 2s）を実時間で待たない。開始の往復は
     * 実時間のまま待ち（`findByText`）、押してから時計を偽物にする —
     * `waitFor` は偽の時計の下では進まないため、以降は `act` で時間を進めて
     * 直接確かめる
     */
    async function mountAndFakeTimers() {
      mount();
      await screen.findByText("20");
      vi.useFakeTimers();
    }
    afterEach(() => {
      vi.useRealTimers();
    });
    const graded = {
      answered,
      correct: true,
      question: { ...hidden, id: "question-2" },
      sequence: 1,
      elapsedMs: 12_345,
    };

    it("枠・不通・例外で弾かれた回答は同じ番号・同じ回答で送り直し、採点は 1 回", async () => {
      mocks.answer
        .mockResolvedValueOnce({ error: "rateLimited" })
        .mockResolvedValueOnce({ error: "authUnavailable" })
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValue(graded);
      await mountAndFakeTimers();
      fireEvent.click(screen.getByText("answer"));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(mocks.answer).toHaveBeenCalledTimes(1);
      // 送り直しを待つ間も採点待ちのまま（時計は止まり、選択肢は押せない）
      expect(screen.getByTestId("grading").textContent).toBe("true");
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(mocks.answer).toHaveBeenCalledTimes(2);
      await act(() => vi.advanceTimersByTimeAsync(1_000));
      expect(mocks.answer).toHaveBeenCalledTimes(3);
      expect(screen.getByTestId("grading").textContent).toBe("true");
      await act(() => vi.advanceTimersByTimeAsync(2_000));
      expect(mocks.answer).toHaveBeenCalledTimes(4);
      for (const call of mocks.answer.mock.calls)
        expect(call).toEqual(["attempt-1", 0, 2]);
      expect(mocks.onAnswer).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("grading").textContent).toBe("false");
      expect(screen.getByTestId("clock").textContent).toBe("12345");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("送り直しても通らなければ再接続の案内を出し、押すと同じ回答を送り直す", async () => {
      mocks.answer.mockResolvedValue({ error: "rateLimited" });
      await mountAndFakeTimers();
      fireEvent.click(screen.getByText("answer"));
      await act(() => vi.advanceTimersByTimeAsync(3_500));
      expect(mocks.answer).toHaveBeenCalledTimes(4);
      // 盤面ごと止めず（alert ではなく）、採点待ちのまま押されるのを待つ
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByTestId("reconnect").textContent).toBe(
        "connectionLost",
      );
      expect(screen.getByTestId("grading").textContent).toBe("true");
      expect(mocks.onAnswer).not.toHaveBeenCalled();
      // 案内のボタンは無効な fieldset の中にあってはならない（ブラウザは
      // 無効な fieldset の中のボタンを押させない。jsdom は伝播させない）
      expect(screen.getByText("reconnect").closest("fieldset")?.disabled).toBe(
        false,
      );
      // 待っている間は送らない
      await act(() => vi.advanceTimersByTimeAsync(10_000));
      expect(mocks.answer).toHaveBeenCalledTimes(4);

      mocks.answer.mockResolvedValue(graded);
      fireEvent.click(screen.getByText("reconnect"));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(screen.getByTestId("reconnect").textContent).toBe("");
      expect(mocks.answer).toHaveBeenCalledTimes(5);
      expect(mocks.answer.mock.lastCall).toEqual(["attempt-1", 0, 2]);
      expect(mocks.onAnswer).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("grading").textContent).toBe("false");
    });

    it("再接続を押してもまだ通らなければ、数回送り直してからまた案内を出す", async () => {
      mocks.answer.mockResolvedValue({ error: "authUnavailable" });
      await mountAndFakeTimers();
      fireEvent.click(screen.getByText("answer"));
      await act(() => vi.advanceTimersByTimeAsync(3_500));
      fireEvent.click(screen.getByText("reconnect"));
      await act(() => vi.advanceTimersByTimeAsync(3_500));
      expect(mocks.answer).toHaveBeenCalledTimes(8);
      expect(screen.getByTestId("reconnect").textContent).toBe(
        "connectionLost",
      );
    });

    it.each(["rejected", "unauthorized", "banned"] as const)(
      "受け付けられなかった回答（%s）は送り直さずに止める",
      async (error) => {
        mocks.answer.mockResolvedValue({ error });
        await mountAndFakeTimers();
        fireEvent.click(screen.getByText("answer"));
        await act(() => vi.advanceTimersByTimeAsync(3_500));
        expect(mocks.answer).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("alert")).toBeDefined();
      },
    );

    it("時間切れの開示の一時的な失敗は同じ挑戦 ID で読み直す", async () => {
      mocks.reveal
        .mockResolvedValueOnce({ error: "unexpectedError" })
        .mockResolvedValueOnce({ remainingMs: 100 })
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValue({ question: answered });
      await mountAndFakeTimers();
      fireEvent.click(screen.getByText("expire"));
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(mocks.reveal).toHaveBeenCalledTimes(2);
      // 期限前なら残り時間だけ待ってから読み直す。その読み直しも送り直す
      await act(() => vi.advanceTimersByTimeAsync(120));
      expect(mocks.reveal).toHaveBeenCalledTimes(3);
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(mocks.reveal).toHaveBeenCalledTimes(4);
      for (const call of mocks.reveal.mock.calls)
        expect(call).toEqual(["attempt-1"]);
      expect(mocks.expired).toHaveBeenCalledTimes(1);
      expect(mocks.recorded).toHaveBeenCalledWith(answered);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("開示の送り直しが尽きたら再接続の案内を出し、押すと読み直す", async () => {
      mocks.reveal.mockResolvedValue({ error: "unexpectedError" });
      await mountAndFakeTimers();
      fireEvent.click(screen.getByText("expire"));
      await act(() => vi.advanceTimersByTimeAsync(3_500));
      expect(mocks.reveal).toHaveBeenCalledTimes(4);
      expect(screen.getByTestId("reconnect").textContent).toBe(
        "connectionLost",
      );
      expect(mocks.expired).not.toHaveBeenCalled();
      mocks.reveal.mockResolvedValue({ question: answered });
      fireEvent.click(screen.getByText("reconnect"));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(mocks.expired).toHaveBeenCalledTimes(1);
      expect(mocks.recorded).toHaveBeenCalledWith(answered);
    });

    it("開示を受け付けなかったら送り直さずに止める", async () => {
      mocks.reveal.mockResolvedValue({ error: "rejected" });
      await mountAndFakeTimers();
      fireEvent.click(screen.getByText("expire"));
      await act(() => vi.advanceTimersByTimeAsync(3_500));
      expect(mocks.reveal).toHaveBeenCalledTimes(1);
      expect(mocks.expired).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("期限を過ぎて届いた回答は加点せず、結果表示に進める", async () => {
    mocks.answer.mockResolvedValue({ expired: true });
    mount();
    await screen.findByText("20");
    fireEvent.click(screen.getByText("answer"));
    await waitFor(() => expect(mocks.answer).toHaveBeenCalledTimes(1));
    expect(mocks.onAnswer).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
