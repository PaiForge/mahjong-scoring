import type { RankSlug } from "./registry";

/**
 * 段級位の帯色 1 色分（用途ごとの Tailwind クラス）
 * 帯色クラス組
 *
 * 塗りと枠を別々の定数に分けず 1 つの組で持つ。Tailwind の JIT は
 * `` `border-${color}` `` のように組み立てたクラス名を見つけられないため
 * どちらもリテラルで書く必要があり、別々に置くと `bg-orange-500` と
 * `border-sky-500` のような食い違いが黙って通ってしまう。
 */
interface BeltColorClasses {
  /** 帯そのものの塗り（バッジの円・カード上端の帯・段級位ピル） */
  readonly bg: string;
  /** 帯色でカードを縁取るときの枠 */
  readonly border: string;
  /**
   * 帯色のボタン（`buttonClasses({ variant: "belt" })`）が読む CSS 変数。
   *
   * ボタンは塗り・hover・文字・枠とハードシャドウの 4 箇所を帯色で塗り分ける
   * ため、クラスを並べると級が増えるたびに 4 箇所へ同じ色を書くことになる。
   * どこをどう塗るかはボタン側の知識なので、ここは色の値だけを変数で渡す。
   *
   * - `--belt-fill` 塗り（100 — 帯色の淡い側）
   * - `--belt-fill-hover` hover の塗り（200）
   * - `--belt-text` 淡い塗りに載せる文字（800）
   * - `--belt-edge` 枠とハードシャドウ（500 — 帯そのものの色）
   *
   * 塗りが帯そのもの（`bg` の 500）ではなく 100 なのは、白いカードの中で
   * 500 の面が濃く浮くため。帯の色は枠とハードシャドウが持ち、面は同じ色相の
   * 淡い側に寝かせる。文字は 800 で、静止時 6.4:1（orange）/ 7.2:1（blue）、
   * hover でも 5.4:1 / 6.2:1 と AA を保つ。
   */
  readonly buttonVars: string;
}

/**
 * 段級位の帯色 — 段級位 UI の配色の単一の真実のソース
 * 段級位帯色
 *
 * @description
 * 道場の現在の段級位バッジ・昇級試験カード・マイページの段級位ピルが引く。
 * 参考プロジェクト（blindfold-chess）の帯色体系に合わせており、5級は
 * オレンジ・4級は青。級が増えるたびにここへ 1 行足す（`Record<RankSlug, ...>` なので
 * 追加漏れはコンパイルで落ちる）。
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
export const RANK_BELT_CLASSES: Readonly<Record<RankSlug, BeltColorClasses>> = {
  "kyu-5": {
    bg: "bg-orange-500",
    border: "border-orange-500",
    buttonVars:
      "[--belt-fill:var(--color-orange-100)] [--belt-fill-hover:var(--color-orange-200)] [--belt-text:var(--color-orange-800)] [--belt-edge:var(--color-orange-500)]",
  },
  "kyu-4": {
    bg: "bg-blue-500",
    border: "border-blue-500",
    buttonVars:
      "[--belt-fill:var(--color-blue-100)] [--belt-fill-hover:var(--color-blue-200)] [--belt-text:var(--color-blue-800)] [--belt-edge:var(--color-blue-500)]",
  },
};

/**
 * 段級位を持たない状態（無級）の帯色。
 *
 * 参考プロジェクトの白帯にあたる。白は白背景のカード上で消えるため、
 * 「色が付いていない」ことが読み取れる淡いグレーに置き換えている。
 */
const UNRANKED_BELT_CLASSES: BeltColorClasses = {
  bg: "bg-surface-200",
  border: "border-surface-300",
  // 塗りと枠が別の濃さなのは、淡いグレーの円を淡いグレーで縁取ると輪郭が
  // 消えるため。ボタンも同じ理由で、面（surface-100）より枠（surface-300）を
  // 濃くする
  buttonVars:
    "[--belt-fill:var(--color-surface-100)] [--belt-fill-hover:var(--color-surface-200)] [--belt-text:var(--color-surface-700)] [--belt-edge:var(--color-surface-300)]",
};

function classesFor(slug: RankSlug | undefined): BeltColorClasses {
  return slug === undefined ? UNRANKED_BELT_CLASSES : RANK_BELT_CLASSES[slug];
}

/**
 * 帯そのものの塗りのクラス。未取得（無級）なら淡いグレー。
 * 帯色取得
 *
 * @param slug 段級位スラッグ。未取得なら undefined
 */
export function beltClass(slug: RankSlug | undefined): string {
  return classesFor(slug).bg;
}

/**
 * 帯色でカードを縁取るときの枠のクラス。
 * 帯枠色取得
 *
 * 段級位に属するカード（昇級試験カード）は、このアプリ既定の ink（緑）では
 * なくこれで縁取る。級の名前を掲げたカードが別の色の枠を着ていると、枠の色が
 * その級の色に見えてしまう（5級のカードが緑枠だと緑帯に読める）。
 *
 * @param slug 段級位スラッグ。未取得なら undefined
 */
export function beltBorderClass(slug: RankSlug | undefined): string {
  return classesFor(slug).border;
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

/**
 * 帯色のボタン（`buttonClasses({ variant: "belt" })`）に渡す CSS 変数のクラス。
 * 帯ボタン色
 *
 * ボタン自身の `className` に添えて使う。色・枠・影を上書きするクラスでは
 * なく変数の定義だけなので、「className で色を上書きしない」という約束は
 * 破っていない — 何をどう塗るかは `belt` variant が持ったままになる。
 *
 * @param slug 段級位スラッグ。未取得なら undefined
 */
export function beltButtonVarsClass(slug: RankSlug | undefined): string {
  return classesFor(slug).buttonVars;
}
