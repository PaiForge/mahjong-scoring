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
    // 最初の回答には直前の往復が無い
    expect(mocks.answer).toHaveBeenCalledWith("attempt-1", 0, 2, {
      previous: undefined,
    });
    expect(mocks.recorded).toHaveBeenCalledWith([answered, 2]);
    expect(screen.getByTestId("answer").textContent).toBe("2");
    fireEvent.click(screen.getByText("next"));
    expect(screen.getByTestId("answer").textContent).toBe("20");
  });
  it("直前の回答の問題番号と往復時間を次の回答に添える（観測のための申告）", async () => {
    mount();
    await screen.findByText("20");
    fireEvent.click(screen.getByText("answer"));
    await waitFor(() => expect(mocks.onAnswer).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("answer"));
    await waitFor(() => expect(mocks.answer).toHaveBeenCalledTimes(2));
    expect(mocks.answer).toHaveBeenLastCalledWith("attempt-1", 1, 2, {
      previous: { sequence: 0, roundTripMs: expect.any(Number) },
    });
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
