import type { RankSlug } from "./registry";

/**
 * 段級位の帯色 — 段級位 UI の配色の単一の真実のソース
 * 段級位帯色
 *
 * @description
 * 道場の現在の段級位バッジ・昇級試験カードの帯・マイページの段級位ピルが
 * 引く。参考プロジェクト（blindfold-chess）の帯色体系に合わせており、
 * 5級はオレンジ。級が増えるたびにここへ 1 行足す（`Record<RankSlug, string>`
 * なので追加漏れはコンパイルで落ちる）。
 *
 * @design セマンティックトークンではなく Tailwind の既定色を直接使う理由
 *
 * `globals.css` は success / warning / destructive のような「意味を持つ色」を
 * トークン化し、Tailwind 既定の green-* / amber-* を直接書くことを禁じている。
 * ただし同じコメントが「章カテゴリや順位メダルのような区別のための色は対象外」
 * と断っている通り、帯色はそちら側 — 級どうしを見分けるための色であって、
 * 成功や警告のような状態を表さない。教本のセクション色
 * （`SECTION_CATEGORY_COLOR_CLASS`）と同じ扱いで、同じ書き方に揃えている。
 */
export const RANK_BELT_CLASS: Readonly<Record<RankSlug, string>> = {
  "kyu-5": "bg-orange-500",
};

/**
 * 段級位を持たない状態（無級）の帯色。
 *
 * 参考プロジェクトの白帯にあたる。白は白背景のカード上で消えるため、
 * 「色が付いていない」ことが読み取れる淡いグレーに置き換えている
 * （このアプリの帯は必ず ink の枠が付くので、輪郭は枠が担保する）。
 */
export const UNRANKED_BELT_CLASS = "bg-surface-200";

/**
 * 段級位の帯色クラスを返す。未取得（無級）なら `UNRANKED_BELT_CLASS`。
 * 帯色取得
 *
 * @param slug 段級位スラッグ。未取得なら undefined
 */
export function beltClass(slug: RankSlug | undefined): string {
  return slug === undefined ? UNRANKED_BELT_CLASS : RANK_BELT_CLASS[slug];
}

/**
 * 帯の上に載せるアイコン・文字の色クラス。
 * 帯前景色
 *
 * 色付きの帯には白を載せる。無級の淡いグレーの上では白が読めないため、
 * グレーの文字色に切り替える。
 */
export function beltForegroundClass(slug: RankSlug | undefined): string {
  return slug === undefined ? "text-surface-500" : "text-white";
}
