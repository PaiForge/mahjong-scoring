import type { RankSlug } from "./ranks/registry";
import type { CurriculumChapterSlug } from "./curriculum/registry";
import type { LeaderboardPeriod } from "./leaderboard/boards";
import {
  DEFAULT_VARIANT,
  menuTypeToSlug,
  practiceMenuBySlug,
  resolvePracticeVariant,
  type PracticeBoard,
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
 *
 * @design パスの単数・複数
 * 同じ種類の文書が並ぶ一覧（1 件 = 1 ページ）は複数形にする（`/lessons`,
 * `/announcements`, `/dojo/ranks`）。活動の場・コーナーの名前は単数形にする
 * （`/practice`, `/exam`, `/dojo`, `/reference`, `/leaderboard`）。練習は
 * 複数の練習を一覧にしているが、`/practices` にはしない — 数えない名詞の
 * "practice"（練習すること）を複数形にすると「慣行」（best practices）の
 * 意味に寄るため。
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
 * レッスン（= 章）のページ。`/lessons/<slug>` の組み立てをこの 1 箇所に閉じる。
 * 目次・前後のナビ・練習からの導線・ダッシュボードの「次にやること」・道場の
 * 行程がそれぞれ文字列を組み立てると、ルートを変えたときに追随漏れが出る。
 *
 * @param slug 対象章のスラッグ
 */
export function chapterHref(slug: CurriculumChapterSlug): string {
  return `/lessons/${slug}`;
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

/** 練習一覧のパス */
export const PRACTICE_PATH = "/practice";

/** レッスン一覧（教本の目次）のパス */
export const LESSONS_PATH = "/lessons";

/** お知らせ一覧のパス */
export const ANNOUNCEMENTS_PATH = "/announcements";

/**
 * お知らせ 1 件のパス
 * お知らせパス
 *
 * @param slug - お知らせの slug
 */
export function announcementHref(slug: string): string {
  return `${ANNOUNCEMENTS_PATH}/${encodeURIComponent(slug)}`;
}

/** 設定のパス */
export const PREFERENCES_PATH = "/preferences";

/**
 * 役の並び順のパス（設定の子ページ）
 *
 * 項目が多く設定ページ本体には収まらないため、別ページにしている。
 */
export const YAKU_ORDER_PATH = "/preferences/yaku-order";

/** 早見表（点数表・役一覧・用語集の入口）のパス */
export const REFERENCE_PATH = "/reference";

/** 役一覧（早見表）のパス */
export const REFERENCE_YAKU_PATH = "/reference/yaku";

/** 道場（黒帯への道の全行程）のパス */
export const DOJO_PATH = "/dojo";

/**
 * 段級位の詳細ページの親パス
 *
 * この URL 自体にページは無い（以前あった段級位一覧は道場（{@link DOJO_PATH}）
 * に吸収され、`/dojo/ranks` は `/dojo` へリダイレクトする）。詳細ページの
 * パスを組み立てる土台としてだけ残している。
 */
export const RANKS_PATH = "/dojo/ranks";

/**
 * 段級位の詳細ページのパス
 * 段級位詳細パス
 *
 * 道場・練習カードの段級位ピル・sitemap がそれぞれ文字列を組み立てると、
 * ルートを変えたときに追随漏れが出るため、組み立てをここに閉じる。
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

/** マイレコード（チャレンジの成績）のパス */
export const MY_RECORD_PATH = "/mypage/challenges";

/**
 * マイレコードを、ある土俵（練習 × バリアント）を選んだ状態で開くパス
 * マイレコード土俵パス
 *
 * 練習の結果画面の「マイレコードで推移を見る」が使う。クエリの語彙は
 * `menu`（menuType）と `variant`（`my-record/requested-board.ts` が読む）。
 */
export function myRecordHref(board: PracticeBoard): string {
  const params = new URLSearchParams({
    menu: board.menuType,
    variant: board.variant,
  });
  return `${MY_RECORD_PATH}?${params.toString()}`;
}

/** ランキング（土俵の一覧）のパス */
export const LEADERBOARD_PATH = "/leaderboard";

/**
 * ある土俵・期間のランキングのパス
 * ランキング詳細パス
 *
 * バリアントを持つ練習だけクエリで土俵を指す。持たない練習に付けても
 * 意味が無く、URL が長くなるだけ。
 */
export function leaderboardHref(
  period: LeaderboardPeriod,
  board: PracticeBoard,
): string {
  const slug = menuTypeToSlug(board.menuType);
  return `${LEADERBOARD_PATH}/${period}/${slug}${variantQuery(slug, board.variant)}`;
}

/**
 * 公開プロフィールのパス
 * 公開プロフィールパス
 *
 * @param username - 公開のユーザー名
 */
export function publicProfileHref(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}

/** 練習の結果ページのパス */
export function practiceResultHref(slug: PracticeMenuSlug): string {
  return `${practiceHref(slug)}/result`;
}

/**
 * 記録を取らない和了形の点数計算（`/practice/agari-score`）のパス。
 *
 * チャレンジではなく無限に解ける訓練なので `PRACTICE_MENU_REGISTRY` にも
 * カタログにも載らない。練習一覧のバナーとダッシュボードのフォールバックが参照する。
 */
export const AGARI_SCORE_PRACTICE_HREF = "/practice/agari-score";

/**
 * 記録を取らない聴牌形の点数計算（`/practice/tenpai-score`）のパス。
 *
 * 和了形の点数計算と同じく無限に解ける訓練で、レジストリにもカタログにも載らない。
 * 練習一覧のバナーが参照する。
 */
export const TENPAI_SCORE_PRACTICE_HREF = "/practice/tenpai-score";
