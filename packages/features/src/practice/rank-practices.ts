import { buildJourneyPath } from "../journey/journey";
import { menuTypeToSlug, type PracticeMenuSlug } from "../practice-menu-types";
import { RANK_REGISTRY, type RankSlug } from "../ranks/registry";
import { listedPracticeMenus, practiceMenuFromCatalog } from "./catalog";

/** 進み具合を持たない入力。行程の並びだけを引く */
const NO_PROGRESS = {
  completedLessonSlugs: new Set<string>(),
  attemptedPractices: [],
  achievedRankSlugs: [],
} as const;

/** 級ごとの、行程に「練習する」として並ぶ練習（バリアント違いは 1 つに畳む） */
const journeyPracticeSlugs: ReadonlyMap<
  RankSlug,
  ReadonlySet<PracticeMenuSlug>
> = new Map(
  RANK_REGISTRY.map((rank) => [
    rank.slug,
    new Set(
      buildJourneyPath(
        rank.learnChapterSlugs,
        menuTypeToSlug(rank.exam.menuType),
        NO_PROGRESS,
      ).flatMap((item) => (item.kind === "practice" ? [item.slug] : [])),
    ),
  ]),
);

/**
 * 練習が属する段級位（レジストリの順）
 * 練習の段級位
 *
 * @description
 * 練習一覧の級の絞り込み（`/practice?rank=kyu-5`）が、どのカードを残すかに
 * 使う。属する級は次の 2 つの和集合。
 *
 * - その級の行程（黒帯への道）で「練習する」に並ぶ練習 — 前提章が送っている
 *   練習。道場やダッシュボードの「練習する」から絞り込んだ一覧へ来た人が、
 *   行程に並んでいた練習をそこで見つけられるように
 * - カタログの `rank`（その練習を最初に必要とする級。カードの級のピル）
 *
 * カタログの `rank` だけでは足りない。点数表早引きはカタログでは 3級
 * （満貫未満の行を引く最初の級）だが、5級の章も満貫以上の範囲で送っており、
 * 5級で絞ると行程にある練習が一覧から消えていた。逆に行程だけでも足りない。
 * 3級・2級の章は練習へ送っておらず、行程だけから導くとこの 2 つの級が
 * 絞り込みの選択肢から消える。
 */
export function practiceRanks(slug: PracticeMenuSlug): readonly RankSlug[] {
  const catalogRank = practiceMenuFromCatalog(slug)?.rank;
  return RANK_REGISTRY.map((rank) => rank.slug).filter(
    (rankSlug) =>
      rankSlug === catalogRank ||
      (journeyPracticeSlugs.get(rankSlug)?.has(slug) ?? false),
  );
}

/**
 * 練習一覧の級の絞り込みに出す段級位を、レジストリの順（学習順）で返す。
 * 一覧掲載段級位
 *
 * 全段級位ではなく、一覧に並ぶ練習を 1 つ以上持つ級（{@link practiceRanks}）
 * だけを返す。段級位は昇級試験だけで完結するものがあり（1級 — 前提章の
 * 2 つはどちらも専用の練習を持たない）、`RANK_SLUGS` をそのまま選択肢に
 * すると押しても 0 件のタブが並ぶ。選択肢は一覧の中身から導く。
 */
export function listedPracticeRanks(): readonly RankSlug[] {
  const listed = new Set(
    listedPracticeMenus().flatMap((menu) => practiceRanks(menu.slug)),
  );
  return RANK_REGISTRY.map((rank) => rank.slug).filter((slug) =>
    listed.has(slug),
  );
}
