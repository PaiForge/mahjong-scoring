import {
  type CurriculumChapter,
  pickNextChapter,
} from "../curriculum/registry";
import {
  buildJourney,
  type BuildJourneyInput,
  type Journey,
} from "../journey/journey";

/** ホーム（ダッシュボード）の学習導線 */
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
  readonly showAgariScorePractice: boolean;
}

/** {@link selectDashboardGuidance} の任意の指定 */
export interface DashboardGuidanceOptions {
  /**
   * 「レッスンの続き」の候補から外すレッスン（章）。モバイルに本文を移植して
   * いない章のように、その場で開けない章を渡す。行程（`buildJourney`）には
   * 効かない — 完了の扱いを変えるのではなく、勧める先から外すだけ
   */
  readonly unavailableLessonSlugs?: Iterable<string>;
}

/**
 * レッスンの完了・練習履歴・取得済みの級からホーム（ダッシュボード）に出す導線を決める。
 * 学習導線の選択
 *
 * @description
 * web のダッシュボードとモバイルのホームが同じ判断で出し分けるための純粋関数。
 *
 * 行程が進行中（取る級が残っている）なら、主導線は「次にやること」だけ（黒帯への
 * 道の中で今やること 1 つ。`buildJourney`）。候補を並べず 1 つに
 * 絞る — ホームは「今すること」を答える場で、全体の道筋は道場が持つ。
 * 行程の外のレッスンは出さない。以前は完了の印だけから「次に読む章」を別に
 * 計算して「続き」として並べていたが、行程と別の再開先が同じ重さで並んだ。
 * レッスンの目次はナビゲーション（タブバー・サイドバー）から常に行けるので、
 * 級に属さないレッスン（「はじめに」のセクション・点数記憶術）へもそこから行ける。
 *
 * 行程を終えた（全級取得）ユーザーには「次にやること」が無いので、代わりに
 * 「レッスンの続き」（完了していない最初のレッスン）と、終わりのない
 * 和了形の点数計算を出す。
 *
 * @param input 行程の材料（レッスンの完了・チャレンジを終えた練習・取得済みの級）
 * @param options 「レッスンの続き」の候補から外す章
 */
export function selectDashboardGuidance(
  input: BuildJourneyInput,
  options: DashboardGuidanceOptions = {},
): DashboardGuidance {
  const journey = buildJourney(input);
  const journeyDone = journey.nextStep === undefined;

  return {
    journey,
    nextChapter: journeyDone
      ? pickNextChapter(
          new Set([
            ...input.completedLessonSlugs,
            ...(options.unavailableLessonSlugs ?? []),
          ]),
        )
      : undefined,
    showAgariScorePractice: journeyDone,
  };
}
