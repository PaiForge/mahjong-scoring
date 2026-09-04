import { describe, expect, it } from "vitest";
import { countDoraInTehai } from "@mahjong-scoring/core";
import type { ScoreQuestion, YakuDetail } from "@mahjong-scoring/core";

import { CHIITOITSU_EXAM_DEMO } from "@/app/(user)/(public)/exam/chiitoitsu/_components/chiitoitsu-exam-how-to-play";
import { FU_SCORE_EXAM_DEMO } from "@/app/(user)/(public)/exam/fu-score/_components/fu-score-exam-how-to-play";
import { MANGAN_EXAM_DEMO } from "@/app/(user)/(public)/exam/mangan/_components/mangan-exam-how-to-play";
import { PINFU_EXAM_DEMO } from "@/app/(user)/(public)/exam/pinfu/_components/pinfu-exam-how-to-play";
import { SCORE_EXAM_DEMO } from "@/app/(user)/(public)/exam/score/_components/score-exam-how-to-play";
import type { ScoreExamHowToPlayConfig } from "@/app/(user)/(public)/exam/_lib/create-exam-how-to-play";

import { HAN_COUNT_DEMO_QUESTION } from "../../han-count/_components/han-count-how-to-play";
import { MANGAN_SCORE_CALCULATION_DEMO_QUESTION } from "../../mangan-score-calculation/_components/mangan-score-calculation-how-to-play";
import { SCORE_CALCULATION_DEMO_QUESTION } from "../../score-calculation/_components/score-calculation-how-to-play";
import { buildDemoScoreQuestion } from "../demo-score-question";

/** 昇級試験のデモ設定から出題を組む（ファクトリと同じ手順） */
function examDemoQuestion(config: ScoreExamHowToPlayConfig): ScoreQuestion {
  const { translationNamespace: _namespace, ...options } = config;
  return buildDemoScoreQuestion(options);
}

/**
 * 各デモが TSDoc で主張している「ドラが何枚乗るか」
 *
 * デモの牌姿は複数のデモで共有しているため、1 か所の牌姿を変えると別の
 * デモの主張（「ドラは乗らない」「ドラ 1 で 5 翻」）が黙って崩れる。
 * 主張をここに写し、牌姿と表示牌の組が今もそのとおりかを検査する。
 */
const DEMOS: readonly {
  readonly name: string;
  readonly question: ScoreQuestion;
  readonly doraHan: number;
}[] = [
  {
    name: "点数計算ドリル",
    question: SCORE_CALCULATION_DEMO_QUESTION,
    doraHan: 0,
  },
  {
    name: "満貫以上ドリル",
    question: MANGAN_SCORE_CALCULATION_DEMO_QUESTION,
    doraHan: 1,
  },
  { name: "翻数即答", question: HAN_COUNT_DEMO_QUESTION, doraHan: 0 },
  {
    name: "昇級試験（満貫以上）",
    question: examDemoQuestion(MANGAN_EXAM_DEMO),
    doraHan: 1,
  },
  {
    name: "昇級試験（平和）",
    question: examDemoQuestion(PINFU_EXAM_DEMO),
    doraHan: 0,
  },
  {
    name: "昇級試験（30〜50符）",
    question: examDemoQuestion(FU_SCORE_EXAM_DEMO),
    doraHan: 0,
  },
  {
    name: "昇段試験（点数計算）",
    question: examDemoQuestion(SCORE_EXAM_DEMO),
    doraHan: 0,
  },
  {
    name: "昇級試験（七対子）",
    question: examDemoQuestion(CHIITOITSU_EXAM_DEMO),
    doraHan: 2,
  },
];

describe("遊び方デモの牌姿とドラ", () => {
  it.each(DEMOS)(
    "$name: 表ドラは TSDoc の主張どおりに乗る",
    ({ question, doraHan }) => {
      expect(countDoraInTehai(question.tehai, question.doraMarkers)).toBe(
        doraHan,
      );
    },
  );

  it.each(DEMOS)("$name: 裏ドラは手牌に乗らない", ({ question }) => {
    // どのデモも翻数の説明を裏ドラ抜きで書いている
    expect(
      countDoraInTehai(question.tehai, question.uraDoraMarkers ?? []),
    ).toBe(0);
  });

  it.each(DEMOS)(
    "$name: リーチの手だけが裏ドラ表示牌を持つ",
    ({ question }) => {
      expect(question.uraDoraMarkers !== undefined).toBe(
        question.isRiichi === true,
      );
    },
  );

  it("役一覧を出すデモは、内訳のドラ翻と盤面のドラ枚数が一致する", () => {
    const question = MANGAN_SCORE_CALCULATION_DEMO_QUESTION;
    const doraDetail = question.yakuDetails?.find(
      (detail: YakuDetail) => detail.name === "ドラ",
    );

    expect(doraDetail?.han).toBe(
      countDoraInTehai(question.tehai, question.doraMarkers),
    );
  });
});
