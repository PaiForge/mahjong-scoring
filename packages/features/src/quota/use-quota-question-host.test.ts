// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanBenefit } from "../billing/plans";

import type { BeginPracticeQuestionResult } from "./answer";
import type { QuotaOutcome } from "./gate";
import {
  usePracticeQuotaControl,
  type PracticeQuotaSource,
} from "./use-practice-quota-control";
import { createPracticeQuotaGate } from "./use-practice-quota-gate";
import { useQuotaQuestionHost } from "./use-quota-question-host";

const ALLOWED: BeginPracticeQuestionResult = {
  allowed: true,
  remaining: 2,
  limit: 5,
  signedIn: true,
  benefits: [PlanBenefit.PracticeTools],
};

const BLOCKED: BeginPracticeQuestionResult = {
  ...ALLOWED,
  allowed: false,
  remaining: 0,
  benefits: [],
};

const gates = createPracticeQuotaGate();

/** 問い合わせ先。テストが答えを差し替える */
const ask = vi.fn<PracticeQuotaSource["ask"]>();
const source: PracticeQuotaSource = {
  ask,
  peek: vi.fn(async () => undefined),
};

const answer = (value: BeginPracticeQuestionResult): QuotaOutcome => ({
  kind: "answer",
  answer: value,
});

let serial = 0;
const generate = vi.fn(() => ({ id: ++serial }));

function renderHost() {
  return renderHook(() =>
    useQuotaQuestionHost(generate, (onAllowed) =>
      usePracticeQuotaControl(gates, "score-exam", source, onAllowed),
    ),
  );
}

/** 待っている問い合わせの返事を流す */
const settle = () => act(async () => {});

beforeEach(() => {
  gates.reset();
  serial = 0;
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("useQuotaQuestionHost", () => {
  it("開いた直後に 1 問聞き、許可されたら問題を作る", async () => {
    ask.mockResolvedValue(answer(ALLOWED));
    const { result } = renderHost();

    expect(result.current.host.question).toBeUndefined();
    await settle();

    expect(ask).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.host.question).toEqual({ id: 1 });
    expect(result.current.gate).toEqual({
      kind: "open",
      remaining: 2,
      limit: 5,
      benefits: [PlanBenefit.PracticeTools],
    });
  });

  it("次へ進むと問題を消してから聞き、許可されたら次の問題を作る", async () => {
    ask.mockResolvedValue(answer(ALLOWED));
    const { result } = renderHost();
    await settle();

    act(() => result.current.host.advance());
    expect(result.current.host.question).toBeUndefined();
    await settle();

    expect(ask).toHaveBeenCalledTimes(2);
    expect(result.current.host.question).toEqual({ id: 2 });
  });

  it("許可されなければ問題を作らず、gate は blocked になる", async () => {
    ask.mockResolvedValue(answer(BLOCKED));
    const { result } = renderHost();
    await settle();

    expect(generate).not.toHaveBeenCalled();
    expect(result.current.host.question).toBeUndefined();
    expect(result.current.gate).toMatchObject({ kind: "blocked", limit: 5 });
  });

  it("前の模試のペイウォールは開いた直後に見せず、最初の問いで消す", async () => {
    ask.mockResolvedValue(answer(BLOCKED));
    const first = renderHost();
    await settle();
    expect(first.result.current.gate?.kind).toBe("blocked");
    first.unmount();

    ask.mockResolvedValue(answer(ALLOWED));
    const { result } = renderHost();
    expect(result.current.gate).toBeUndefined();
    await settle();

    expect(result.current.gate?.kind).toBe("open");
    expect(result.current.host.question).toEqual({ id: 1 });
  });

  it("採点はその場で行い、問題が無い間は受け付けない", async () => {
    ask.mockResolvedValue(answer(ALLOWED));
    const { result } = renderHost();
    const onGraded = vi.fn();

    expect(result.current.host.grade("x", onGraded)).toBe(false);
    await settle();

    expect(result.current.host.grade("x", onGraded)).toBe(true);
    expect(onGraded).toHaveBeenCalledWith({ id: 1 });
  });
});
