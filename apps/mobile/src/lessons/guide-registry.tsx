import type { ReactNode } from "react";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

import { isLessonPorted, type PortedLessonSlug } from "./ported-lessons";
import { AboutThisAppGuide } from "./guides/about-this-app-guide";
import { JantouFuGuide, MachiFuGuide, MentsuFuGuide } from "./guides/fu-guides";
import {
  ManganKoRonGuide,
  ManganKoTsumoGuide,
  ManganOyaRonGuide,
  ManganOyaTsumoGuide,
} from "./guides/mangan-guides";
import {
  ChiitoitsuScoreGuide,
  FuroScoreGuide,
  MenzenMentsuScoreGuide,
  PinfuScoreGuide,
} from "./guides/score-guides";
import {
  FuDoublingGuide,
  RonToTsumoGuide,
  TsumoPaymentsGuide,
} from "./guides/memorization-guides";
import { TehaiFuGuide } from "./guides/tehai-fu-guide";
import { WhyScoringIsComplexGuide } from "./guides/why-scoring-is-complex-guide";
import { YakuGuide } from "./guides/yaku-guide";

/**
 * 章 slug → 章の本文
 * レッスン本文レジストリ
 *
 * どの章を移植したかは `ported-lessons.ts` が持ち、ここはその全章の本文を持つ
 * （`Record` なので、移植済みに足した章の本文を書くまで型検査が通らない）。
 */
const LESSON_GUIDES: Readonly<Record<PortedLessonSlug, () => ReactNode>> = {
  "about-this-app": () => <AboutThisAppGuide />,
  "why-scoring-is-complex": () => <WhyScoringIsComplexGuide />,
  "mangan-ko-ron": () => <ManganKoRonGuide />,
  "mangan-ko-tsumo": () => <ManganKoTsumoGuide />,
  "mangan-oya-ron": () => <ManganOyaRonGuide />,
  "mangan-oya-tsumo": () => <ManganOyaTsumoGuide />,
  yaku: () => <YakuGuide />,
  "jantou-fu": () => <JantouFuGuide />,
  "mentsu-fu": () => <MentsuFuGuide />,
  "machi-fu": () => <MachiFuGuide />,
  "tehai-fu": () => <TehaiFuGuide />,
  "chiitoitsu-score": () => <ChiitoitsuScoreGuide />,
  "pinfu-score": () => <PinfuScoreGuide />,
  "menzen-mentsu-score": () => <MenzenMentsuScoreGuide />,
  "furo-score": () => <FuroScoreGuide />,
  "fu-doubling": () => <FuDoublingGuide />,
  "ron-to-tsumo": () => <RonToTsumoGuide />,
  "tsumo-payments": () => <TsumoPaymentsGuide />,
};

/**
 * 章の本文を描く（モバイルに未移植なら undefined）
 * レッスン本文
 *
 * @param slug 章の slug
 */
export function renderLessonGuide(
  slug: CurriculumChapterSlug,
): ReactNode | undefined {
  return isLessonPorted(slug) ? LESSON_GUIDES[slug]() : undefined;
}
