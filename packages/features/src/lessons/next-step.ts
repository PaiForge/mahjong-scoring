import type { JourneyStep } from "../journey/journey";
import type { QuizLessonSlug } from "./registry";

/**
 * 完了画面で送る次の一歩の選び方
 * 次の一歩の選択
 */
export interface LessonNextStep {
  /**
   * 道筋の順の一歩に従うか。本人の進み具合の一歩が無いか、道筋の順の次の
   * レッスン（プレビューを描いてあるレッスン）と同じなら従う
   */
  readonly usePlanned: boolean;
  /** 送る先。道筋の順の一歩か本人の進み具合の一歩 */
  readonly step: JourneyStep | undefined;
}

/**
 * 道筋の順の一歩と本人の進み具合の一歩から、完了画面で送る先を決める
 * 次の一歩の解決
 *
 * 完了画面は道筋の順の次のレッスンの冒頭のプレビューを持っている。本人の
 * 進み具合の一歩がそのレッスンを指すなら道筋の順に従ってプレビューを出し、
 * 別の所を指す（済ませた先の項目を飛ばす等）ならそちらへボタンで送る。
 * web（サーバーが返した一歩）とアプリ（端末で求めた一歩）が同じ規則で選ぶ。
 *
 * @param planned - 道筋の順の一歩（`stepAfterLesson`）
 * @param progressStep - 本人の進み具合を踏まえた一歩。求まらなければ undefined
 * @param previewLessonSlug - プレビューを描いてあるレッスン。無ければ undefined
 */
export function resolveLessonNextStep(
  planned: JourneyStep | undefined,
  progressStep: JourneyStep | undefined,
  previewLessonSlug: QuizLessonSlug | undefined,
): LessonNextStep {
  const usePlanned =
    progressStep === undefined ||
    (progressStep.kind === "lesson" &&
      progressStep.chapterSlug === previewLessonSlug);
  return { usePlanned, step: usePlanned ? planned : progressStep };
}
