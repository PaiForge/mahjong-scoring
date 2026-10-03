import {
  type CurriculumChapter,
  pickNextChapter,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  buildJourney,
  type BuildJourneyInput,
  type Journey,
} from "@mahjong-scoring/features/journey/journey";

/** ダッシュボードの学習導線 */
export interface DashboardGuidance {
  /**
   * 黒帯への道（段級位の行程）。「次の一歩」カードが読む。
   * `nextStep` が undefined なら全級取得済み
   */
  readonly journey: Journey;
  /** 次に読む章。全章読了済みなら undefined */
  readonly nextChapter: CurriculumChapter | undefined;
  /** 教本も行程も勧めるものが無いとき、総合演習へ誘導するか */
  readonly showComprehensivePractice: boolean;
}

/**
 * 読了状況・レッスン・練習履歴・取得済みの級からダッシュボードに出す導線を決める。
 * 学習導線の選択
 *
 * @description
 * 主役は「次の一歩」（黒帯への道の中で今やること 1 つ。features の
 * `buildJourney`）。候補を並べず 1 つに絞る — ホームは「今すること」を
 * 答える場で、全体の道筋は道場が持つ。
 *
 * 「教本の続き」は行程とは別に残す。行程が数えるのは級の前提章だけで、
 * 基礎のセクションや点数記憶術のように級に属さない章は、読む位置を
 * ここでしか示せないため。
 *
 * 勧めるものが本当に何も無いとき（全級取得・全章読了）だけ、終わりのない
 * 総合演習をフォールバックとして出す。
 */
export function selectDashboardGuidance(
  input: BuildJourneyInput,
): DashboardGuidance {
  const journey = buildJourney(input);
  const nextChapter = pickNextChapter(input.readSlugs);

  return {
    journey,
    nextChapter,
    showComprehensivePractice:
      journey.nextStep === undefined && nextChapter === undefined,
  };
}
