import { rankBySlug, type RankSlug } from "./ranks/registry";
import type { CurriculumChapterSlug } from "./curriculum/registry";
import {
  DEFAULT_VARIANT,
  menuTypeToSlug,
  practiceMenuBySlug,
  resolvePracticeVariant,
  type PracticeMenuSlug,
} from "./practice-menu-types";

/**
 * 画面のパス — web とモバイルで共有する遷移先
 * 画面パス
 *
 * @description
 * 練習・昇級試験・教本の章のパスを slug から組み立てる。web（Next の
 * App Router）とモバイル（expo-router）は同じパス体系を持つ前提で、
 * どちらもここを通してリンクを作る。パスの形を変えるときはこの 1 か所を
 * 直せば両方が追随する。
 *
 * @design 置くのは両方にある遷移先だけ
 * 練習一覧の絞り込みクエリや説明ページ内のアンカーのように、web の
 * 画面構成に結び付いたパスは web 側に置く。ここに置くのは、どちらの
 * プラットフォームでも同じ画面を指すパスだけ。
 *
 * @design バリアントの URL パラメータ
 * バリアントを持つ練習（レジストリの `variants`）は、説明ページで選んだ
 * バリアントを `?variant=<key>` で play / training / result へ運ぶ。語彙は
 * レジストリのキーそのもので、URL・`leaderboard_key`・辞書キーで同じ文字列を
 * 使う（変換の表を持たない）。読む側は必ず `resolvePracticeVariant` で
 * 正規化する — 未指定・不正値はその練習の既定（先頭）に落ちるので、
 * 盤面・保存・結果ページが同じ土俵に着地する。
 */

/** バリアントを指定するクエリパラメータ名 */
export const VARIANT_PARAM = "variant";

/**
 * バリアント付きのクエリ文字列（先頭の `?` を含む。設定を持たない練習は空）
 * バリアントクエリ
 *
 * 設定を持たない練習では常に空文字を返すので、呼び出し側が練習ごとに
 * 分岐しなくてよい。
 */
export function variantQuery(slug: PracticeMenuSlug, variant: string): string {
  if (!practiceMenuBySlug(slug).hasSetup) return "";
  return `?${VARIANT_PARAM}=${encodeURIComponent(resolvePracticeVariant(slug, variant))}`;
}

/**
 * 章ページのパスを返す。
 * 章パス
 *
 * `/learn/<slug>` の組み立てをこの 1 箇所に閉じる。目次・前後章ナビ・練習からの
 * 導線がそれぞれ文字列を組み立てると、ルートを変えたときに追随漏れが出る。
 *
 * @param slug 対象章のスラッグ
 */
export function chapterHref(slug: CurriculumChapterSlug): string {
  return `/learn/${slug}`;
}

/**
 * 練習ページのパス
 *
 * 原則 `/practice/<slug>` だが、昇級試験のように別の URL 名前空間に置く
 * 練習はレジストリの `basePath` が上書きする。パスを直に組み立てず
 * 必ずここを通すこと（play / result は `practicePlayHref` 等を使う）。
 */
export function practiceHref(slug: PracticeMenuSlug, variant?: string): string {
  const { basePath } = practiceMenuBySlug(slug);
  // バリアントを渡されたときだけ付ける（説明ページはバリアント無しでも開ける。
  // 選択パネルが URL のバリアントを初期選択にする）
  return variant === undefined
    ? basePath
    : `${basePath}${variantQuery(slug, variant)}`;
}

/**
 * 段級位のピルを押した先 — その級の昇級試験の説明ページ
 * 段級位の行き先
 *
 * 練習カードの段級位ピルが「4級」と名乗っている以上、押した先はその級の
 * 話をしていなければならない。このアプリで級そのものを説明している場所は
 * 試験の説明ページで、合格条件と出題形式がそこに揃っている（道場は
 * 「次に取る級」しか出さないため、5級を持たない人が4級のピルを押すと
 * 5級の話に着地してしまう）。
 *
 * @param slug 段級位スラッグ
 */
export function rankExamHref(slug: RankSlug): string {
  const rank = rankBySlug(slug);
  if (rank === undefined) return "/dojo";
  return practiceHref(menuTypeToSlug(rank.exam.menuType));
}

/** 段級位一覧のパス */
export const RANKS_PATH = "/dojo/ranks";

/**
 * 段級位の詳細ページのパス
 * 段級位詳細パス
 *
 * 一覧・道場・sitemap がそれぞれ文字列を組み立てると、ルートを変えたときに
 * 追随漏れが出るため、組み立てをここに閉じる。
 *
 * @param slug 段級位スラッグ
 */
export function rankHref(slug: RankSlug): string {
  return `${RANKS_PATH}/${slug}`;
}

/**
 * 練習のプレイページのパス
 * プレイページパス
 *
 * バリアントを持つ練習は `?variant=` を付ける（省略時はその練習の既定）。
 * 持たない練習では `variant` を渡しても付かない。
 */
export function practicePlayHref(
  slug: PracticeMenuSlug,
  variant?: string,
): string {
  return `${practiceHref(slug)}/play${variantQuery(slug, variant ?? DEFAULT_VARIANT)}`;
}

/** 練習のトレーニングページのパス（バリアントの扱いは {@link practicePlayHref} と同じ） */
export function practiceTrainingHref(
  slug: PracticeMenuSlug,
  variant?: string,
): string {
  return `${practiceHref(slug)}/training${variantQuery(slug, variant ?? DEFAULT_VARIANT)}`;
}

/** 練習の結果ページのパス */
export function practiceResultHref(slug: PracticeMenuSlug): string {
  return `${practiceHref(slug)}/result`;
}

/**
 * 記録を取らない総合演習（`/practice/score`）のパス。
 *
 * チャレンジではなく無限に解ける訓練なので `PRACTICE_MENU_REGISTRY` にも
 * カタログにも載らない。練習一覧のバナーとダッシュボードのフォールバックが参照する。
 */
export const COMPREHENSIVE_PRACTICE_HREF = "/practice/score";

/**
 * 記録を取らない待ち別点数計算（`/practice/machi-score`）のパス。
 *
 * 総合演習と同じく無限に解ける訓練で、レジストリにもカタログにも載らない。
 * 練習一覧のバナーが参照する。
 */
export const MACHI_SCORE_PRACTICE_HREF = "/practice/machi-score";
