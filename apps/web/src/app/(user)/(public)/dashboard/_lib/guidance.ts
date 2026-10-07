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
   * 黒帯への道（段級位の行程）。「次にやること」カードが読む。
   * `nextStep` が undefined なら全級取得済み
   */
  readonly journey: Journey;
  /**
   * 全級取得済みのユーザーに出す「レッスンの続き」の次のレッスン（章）。
   * 完了していない最初のレッスン。行程が進行中、またはすべて完了なら undefined
   */
  readonly nextChapter: CurriculumChapter | undefined;
  /** 全級取得済みのユーザーに、終わりのない和了形の点数計算を出すか */
  readonly showScorePractice: boolean;
}

/**
 * レッスンの完了・練習履歴・取得済みの級からダッシュボードに出す導線を決める。
 * 学習導線の選択
 *
 * @description
 * 行程が進行中（取る級が残っている）なら、主導線は「次にやること」だけ（黒帯への
 * 道の中で今やること 1 つ。features の `buildJourney`）。候補を並べず 1 つに
 * 絞る — ホームは「今すること」を答える場で、全体の道筋は道場が持つ。
 * 行程の外のレッスンは出さない。以前は完了の印だけから「次に読む章」を別に
 * 計算して「続き」として並べていたが、行程と別の再開先が同じ重さで並んだ。
 * レッスンの目次はナビゲーション（タブバー・サイドバー）から常に行けるので、
 * 級に属さないレッスン（基礎のセクション・点数記憶術）へもそこから行ける。
 *
 * 行程を終えた（全級取得）ユーザーには「次にやること」が無いので、代わりに
 * 「レッスンの続き」（完了していない最初のレッスン）と、終わりのない
 * 和了形の点数計算を出す。
 */
export function selectDashboardGuidance(
  input: BuildJourneyInput,
): DashboardGuidance {
  const journey = buildJourney(input);
  const journeyDone = journey.nextStep === undefined;

  return {
    journey,
    nextChapter: journeyDone
      ? pickNextChapter(input.completedLessonSlugs)
      : undefined,
    showScorePractice: journeyDone,
  };
}
