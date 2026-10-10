// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnswerOutcome } from "../results/result-schemas";
import { useQuestionBoard } from "./use-question-board";
import { QuestionHostProvider, type QuestionHost } from "./use-question-host";

interface Question {
  readonly id: number;
  readonly answer: number;
}

/** 回答が正解と一致するかで顛末を決める */
function toResult(question: Question, answer: number | undefined) {
  return {
    id: question.id,
    answer,
    outcome:
      answer === undefined
        ? AnswerOutcome.TimeUp
        : answer === question.answer
          ? AnswerOutcome.Correct
          : AnswerOutcome.Incorrect,
  };
}

let nextId = 0;
const generateQuestion = (): Question => ({ id: nextId++, answer: 3 });

function setup(wrapper?: (props: { children: ReactNode }) => ReactNode) {
  const onAnswer = vi.fn();
  const onRecordResult = vi.fn();
  const onPresentQuestion = vi.fn();
  const view = renderHook(
    () =>
      useQuestionBoard({
        generateQuestion,
        toResult,
        showFeedback: false,
        onAnswer,
        onRecordResult,
        onPresentQuestion,
      }),
    { wrapper },
  );
  return { ...view, onAnswer, onRecordResult, onPresentQuestion };
}

describe("useQuestionBoard", () => {
  it("ホストが無ければ自分で出題し、その場で採点して記録する", () => {
    const { result, onAnswer, onRecordResult, onPresentQuestion } = setup();
    const question = result.current.question!;
    expect(onPresentQuestion).toHaveBeenLastCalledWith(
      toResult(question, undefined),
    );

    act(() => result.current.handleSubmit(3));

    expect(onRecordResult).toHaveBeenCalledWith(toResult(question, 3));
    expect(onAnswer).toHaveBeenCalledWith(true, result.current.advanceQuestion);
  });

  it("次の問題へ進むと問題を差し替えて出題番号を進める", () => {
    const { result } = setup();
    const first = result.current.question;
    act(() => result.current.advanceQuestion());
    expect(result.current.question).not.toEqual(first);
    expect(result.current.questionIndex).toBe(1);
  });

  it("出題に、それまでに出した問題を古い順に渡す", () => {
    const generate = vi.fn(
      (asked: readonly Question[]): Question => ({
        id: asked.length,
        answer: 3,
      }),
    );
    const { result } = renderHook(() =>
      useQuestionBoard({
        generateQuestion: generate,
        toResult,
        showFeedback: false,
        onAnswer: vi.fn(),
      }),
    );
    expect(generate).toHaveBeenLastCalledWith([]);

    act(() => result.current.advanceQuestion());
    act(() => result.current.advanceQuestion());

    expect(generate).toHaveBeenLastCalledWith([
      { id: 0, answer: 3 },
      { id: 1, answer: 3 },
    ]);
    expect(result.current.question).toEqual({ id: 2, answer: 3 });
  });

  it("ホストがあればホストの問題を出し、採点済みの問題で結果を組む", () => {
    const hosted: Question = { id: 100, answer: 0 };
    const graded: Question = { id: 100, answer: 5 };
    let pendingGrade: ((question: unknown) => void) | undefined;
    const host: QuestionHost = {
      question: hosted,
      advance: vi.fn(),
      grade: vi.fn((_answer, onGraded) => {
        pendingGrade = onGraded;
        return true;
      }),
      registerUnanswered: vi.fn(),
    };
    const { result, onAnswer, onRecordResult, onPresentQuestion } = setup(
      ({ children }) =>
        createElement(QuestionHostProvider, { value: host, children }),
    );
    expect(result.current.question).toBe(hosted);
    // ホストは時間切れの問題を自分で渡してくるので、盤面からは届け出ない
    expect(onPresentQuestion).not.toHaveBeenCalled();
    expect(host.registerUnanswered).toHaveBeenCalled();

    act(() => result.current.handleSubmit(5));
    expect(host.grade).toHaveBeenCalledWith(5, expect.any(Function));
    expect(onAnswer).not.toHaveBeenCalled();

    act(() => pendingGrade?.(graded));
    expect(onRecordResult).toHaveBeenCalledWith(toResult(graded, 5));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Function));

    act(() => result.current.advanceQuestion());
    expect(host.advance).toHaveBeenCalled();
  });
});
