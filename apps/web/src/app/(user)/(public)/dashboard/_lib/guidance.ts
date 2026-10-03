import {
  type CurriculumChapter,
  pickNextChapter,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  buildJourney,
  type BuildJourneyInput,
  type Journey,
} from "@mahjong-scoring/features/journey/journey";
import { chaptersLearnedByLessons } from "@mahjong-scoring/features/lessons/registry";

/** ダッシュボードの学習導線 */
export interface DashboardGuidance {
  /**
   * 黒帯への道（段級位の行程）。「次の一歩」カードが読む。
   * `nextStep` が undefined なら全級取得済み
   */
  readonly journey: Journey;
  /**
   * 行程が進行中のとき、教本を補助リンク（目次への 1 行）として添えるか。
   * 行程が終わったら「教本の続き」に替わるので出さない
   */
  readonly showTextbookLink: boolean;
  /**
   * 全級取得済みのユーザーに出す「教本の続き」の次の章。読了でもレッスンでも
   * 学んでいない最初の章。行程が進行中、または全章学習済みなら undefined
   */
  readonly nextChapter: CurriculumChapter | undefined;
  /** 全級取得済みのユーザーに、終わりのない総合演習を出すか */
  readonly showComprehensivePractice: boolean;
}

/**
 * 読了状況・レッスン・練習履歴・取得済みの級からダッシュボードに出す導線を決める。
 * 学習導線の選択
 *
 * @description
 * 行程が進行中（取る級が残っている）なら、主導線は「次の一歩」だけ（黒帯への
 * 道の中で今やること 1 つ。features の `buildJourney`）。候補を並べず 1 つに
 * 絞る — ホームは「今すること」を答える場で、全体の道筋は道場が持つ。
 * 教本はその横に目次への補助リンクとしてだけ添える。以前は読了だけから
 * 「次に読む章」を別に計算して「教本の続き」として並べていたが、行程と別の
 * 再開先が同じ重さで並び、レッスンで学んだ章を読み直せと勧めることもあった。
 * 基礎のセクションや点数記憶術のように級に属さない章へは、目次から行ける。
 *
 * 行程を終えた（全級取得）ユーザーには「次の一歩」が無いので、代わりに
 * 「教本の続き」（読了・レッスンのどちらでも学んでいない最初の章）と、
 * 終わりのない総合演習を出す。レッスンで学んだ章を外すのは表示の計算だけで、
 * 読了の印（`learn_chapter_reads`）には触らない。
 */
export function selectDashboardGuidance(
  input: BuildJourneyInput,
): DashboardGuidance {
  const journey = buildJourney(input);
  const journeyDone = journey.nextStep === undefined;

  const learnedSlugs = new Set<string>([
    ...input.readSlugs,
    ...chaptersLearnedByLessons(input.completedLessonSlugs),
  ]);

  return {
    journey,
    showTextbookLink: !journeyDone,
    nextChapter: journeyDone ? pickNextChapter(learnedSlugs) : undefined,
    showComprehensivePractice: journeyDone,
  };
}
