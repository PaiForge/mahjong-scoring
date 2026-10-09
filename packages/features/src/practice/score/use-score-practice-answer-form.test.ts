// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { UserAnswer } from "@mahjong-scoring/core";
import { describe, expect, it, vi } from "vitest";

import {
  useScorePracticeAnswerForm,
  type UseScorePracticeAnswerFormParams,
} from "./use-score-practice-answer-form";

function render(
  prefill?: UserAnswer,
  params: Partial<UseScorePracticeAnswerFormParams> = {},
) {
  const onSubmit = vi.fn();
  const view = renderHook(
    ({ prefill: current }: { prefill?: UserAnswer }) =>
      useScorePracticeAnswerForm({
        onSubmit,
        isTsumo: false,
        isOya: false,
        requireYaku: false,
        requireFuForMangan: false,
        kiriageMangan: false,
        allowDoubleYakuman: false,
        koTsumoInput: "combined",
        ...params,
        prefill: current,
      }),
    { initialProps: { prefill } },
  );
  return { ...view, onSubmit };
}

describe("useScorePracticeAnswerForm", () => {
  it("翻・符・点数が揃ったら送れる", () => {
    const { result, onSubmit } = render();
    act(() => result.current.setHan(2));
    act(() => result.current.setFu(30));
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.setScore(2000));
    expect(result.current.isComplete).toBe(true);

    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledWith({
      han: 2,
      fu: 30,
      score: 2000,
      yakus: [],
    });
  });

  it("満貫以上は符を問わず、送る回答にも符を持たせない", () => {
    const { result, onSubmit } = render();
    act(() => result.current.setHan(5));
    expect(result.current.isFuRequired).toBe(false);
    act(() => result.current.setScore(8000));
    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledWith({
      han: 5,
      fu: undefined,
      score: 8000,
      yakus: [],
    });
  });

  it("触る前は prefill の変化に追従し、触った後は追従しない", () => {
    const { result, rerender } = render();
    rerender({ prefill: { han: 3, fu: 40, score: 5200, yakus: [] } });
    expect(result.current.han).toBe(3);

    act(() => result.current.setHan(1));
    rerender({ prefill: { han: 4, fu: 30, score: 7700, yakus: [] } });
    expect(result.current.han).toBe(1);
  });

  describe("子ツモ", () => {
    const koTsumo = { isTsumo: true } as const;

    it("まとめた select で組を選ぶと子から・親からの両方を送る", () => {
      const { result, onSubmit } = render(undefined, koTsumo);
      act(() => result.current.setHan(1));
      act(() => result.current.setFu(30));
      expect(result.current.availableScores.type).toBe("koTsumoCombined");
      act(() =>
        result.current.setKoTsumoPayment({
          type: "koTsumo",
          fromKo: 300,
          fromOya: 500,
        }),
      );
      expect(result.current.koTsumoPayment).toMatchObject({
        fromKo: 300,
        fromOya: 500,
      });
      act(() => result.current.submit());
      expect(onSubmit).toHaveBeenCalledWith({
        han: 1,
        fu: 30,
        scoreFromKo: 300,
        scoreFromOya: 500,
        yakus: [],
      });
    });

    it("分割入力では 2 つとも選ぶまで揃わない", () => {
      const { result } = render(undefined, {
        ...koTsumo,
        koTsumoInput: "split",
      });
      act(() => result.current.setHan(1));
      act(() => result.current.setFu(30));
      act(() => result.current.setScoreFromKo(300));
      expect(result.current.isComplete).toBe(false);
      act(() => result.current.setScoreFromOya(500));
      expect(result.current.isComplete).toBe(true);
    });

    it("実在しない組を読み込んでも、まとめた select では未選択として扱い送らない", () => {
      const { result, onSubmit } = render(
        { han: 1, fu: 30, scoreFromKo: 300, scoreFromOya: 1000, yakus: [] },
        koTsumo,
      );
      expect(result.current.koTsumoPayment).toBeUndefined();
      expect(result.current.scoreFromKo).toBeUndefined();
      expect(result.current.isComplete).toBe(false);
      act(() => result.current.submit());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("翻数を変えて選んだ組が選択肢から外れたら、選び直すまで送れない", () => {
      const { result, onSubmit } = render(undefined, koTsumo);
      act(() => result.current.setHan(1));
      act(() => result.current.setFu(30));
      act(() =>
        result.current.setKoTsumoPayment({
          type: "koTsumo",
          fromKo: 300,
          fromOya: 500,
        }),
      );
      act(() => result.current.setHan(5));
      expect(result.current.koTsumoPayment).toBeUndefined();
      expect(result.current.isComplete).toBe(false);
      act(() => result.current.submit());
      expect(onSubmit).not.toHaveBeenCalled();

      // 選択肢が戻れば選択も戻る（入力値は消さない）
      act(() => result.current.setHan(1));
      expect(result.current.isComplete).toBe(true);
    });

    it("分割入力でも選択肢から外れた片側は未選択として扱う", () => {
      const { result } = render(undefined, {
        ...koTsumo,
        koTsumoInput: "split",
      });
      act(() => result.current.setHan(1));
      act(() => result.current.setFu(30));
      act(() => result.current.setScoreFromKo(300));
      act(() => result.current.setScoreFromOya(500));
      act(() => result.current.setHan(5));
      expect(result.current.scoreFromKo).toBeUndefined();
      expect(result.current.isComplete).toBe(false);
    });
  });
});
