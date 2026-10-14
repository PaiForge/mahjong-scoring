import type { PracticeMenuSlug } from "../practice-menu-types";
import { RANK_REGISTRY, type RankSlug } from "../ranks/registry";
import { listedPracticeMenus, practiceMenuFromCatalog } from "./catalog";

/**
 * 練習が属する段級位
 * 練習の段級位
 *
 * @description
 * 練習一覧の級の絞り込み（`/practice?rank=kyu-5`）が、どのカードを残すかに
 * 使う。属する級はカタログの `rank`（その練習を最初に必要とする級。カードの
 * 級のピル）だけで、どの級にも属さない練習は空。
 *
 * @design 行程（黒帯への道）の「練習する」は数えない
 * 以前は、その級の前提章が送っている練習も属する級に加えていた。点数表早引きは
 * カタログでは 3級（満貫未満の行まで引く完全版の級）だが、5級の章も満貫以上の
 * 範囲で送っているため、5級で絞ると「3級」のピルを付けたカードが並び、
 * なぜ 5級の一覧にあるのかが読めなかった。範囲を絞った版をカードにする案も
 * あったが、5級の一覧に同じ練習が 2 枚並ぶ。点数表早引きは「すべて」と 3級の
 * 一覧に残り、5級の行程からは道場とレッスンが範囲付きで直接送るので、導線は
 * 失われない。
 */
export function practiceRanks(slug: PracticeMenuSlug): readonly RankSlug[] {
  const rank = practiceMenuFromCatalog(slug)?.rank;
  return rank === undefined ? [] : [rank];
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
