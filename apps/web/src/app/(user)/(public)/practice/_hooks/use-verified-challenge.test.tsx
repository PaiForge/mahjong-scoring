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
import { useFuChoiceBoard } from "./use-fu-choice-board";
import { usePresentQuestion } from "./use-present-question";

const hidden = { id: "question-1", tiles: [], agariHai: 0, answer: 20 };
const answered = { ...hidden, answer: 2 };
function identity<T>(value: T) {
  return value;
}
function Board() {
  const challenge = useVerifiedChallenge();
  const { question, handleSelect } = useFuChoiceBoard({
    generateQuestion: mocks.generated,
    options: [0, 2],
    showFeedback: false,
    onAnswer: mocks.onAnswer,
    onRecordResult: mocks.recorded,
  });
  usePresentQuestion(question, identity, mocks.recorded);
  return (
    <div>
      <p data-testid="answer">{question?.answer}</p>
      <button onClick={() => handleSelect(1)}>answer</button>
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
    expect(mocks.recorded).toHaveBeenCalledWith(answered, 2);
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
      resolve({ answered, correct: true, question: hidden, sequence: 1 }),
    );
    fireEvent.click(screen.getByText("answer"));
    expect(mocks.answer).toHaveBeenCalledTimes(1);
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
