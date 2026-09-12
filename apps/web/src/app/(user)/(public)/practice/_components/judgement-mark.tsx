/** 正誤 */
export type JudgementVerdict = "correct" | "incorrect";

/** 線画のパス（`CheckIcon` / `XMarkIcon` と同じ形） */
const MARK_PATHS: Readonly<Record<JudgementVerdict, string>> = {
  correct: "M5 13l4 4L19 7",
  incorrect: "M6 6l12 12M18 6L6 18",
};

/** 裸の記号の色。正解は success、不正解は destructive */
const INLINE_CLASSES: Readonly<Record<JudgementVerdict, string>> = {
  correct: "text-success",
  incorrect: "text-destructive",
};

/** 丸バッジの枠・地・記号の色 */
const BADGE_CLASSES: Readonly<Record<JudgementVerdict, string>> = {
  correct: "bg-success-subtle text-success-strong",
  incorrect: "bg-destructive-subtle text-destructive-strong",
};

interface JudgementMarkProps {
  readonly verdict: JudgementVerdict;
  /**
   * 読み上げ用の名前（「正解」「不正解」）。隣の文字が正誤を言っている
   * （役のチップの sr-only など）ときは省いて装飾扱いにする
   */
  readonly label?: string;
  /**
   * - `inline`（既定）: 裸の線画。値やチップの文字に添える。大きさは添える
   *   文字に合わせて em で決まるので、置く側で寸法を指定しない
   * - `badge`: 墨枠の丸に入れた線画。カウンタのように単独で立つ場所用で
   *   寸法は固定
   */
  readonly variant?: "inline" | "badge";
  /**
   * 記号の色。既定は正誤の色（success / destructive）。既に正誤の色で
   * 塗られた文字に添えるとき（役のチップ・「正解 / 不正解」の語の隣）は
   * `inherit` でその文字色に従わせ、隣と色が二重にならないようにする
   */
  readonly tone?: "verdict" | "inherit";
  readonly className?: string;
}

/**
 * 正誤の記号
 * 正誤マーク
 *
 * 正解の ✓ と不正解の ✗ は、答え合わせの表の値・役のチップ・待ち別の結果の
 * マス・結果ページの問題別の行・フッターのカウンタと、練習のあちこちに出る。
 * 全部この 1 つで描き、形（線画のパス・線幅）と色を揃える。
 *
 * 文字の U+2713 / U+2717 は使わない。フォント次第で字形が変わり
 * （トーストで「i」が裸で出た実測がある）、太さも隣の文字と釣り合わない。
 * 図形として持てば環境によらず同じ形になる。
 *
 * 記号と入れ物は分ける。記号（線画）はどこでも同じで、入れ物だけ場所で
 * 変える — 単独で立つカウンタは墨枠の丸バッジ、値やチップに添えるときは
 * 裸の線画。丸バッジを表の 1 行に縮めて置くと枠が潰れて塊に見える。
 * 役のチップは既に色付きの枠を持つので、そこに丸を重ねない。
 */
export function JudgementMark({
  verdict,
  label,
  variant = "inline",
  tone = "verdict",
  className = "",
}: JudgementMarkProps) {
  const labelled = label !== undefined;
  const svg = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        variant === "badge"
          ? "size-4"
          : // 行ボックスの中で文字の x-height に揃える
            "inline-block size-[1em] shrink-0 align-[-0.125em]"
      }
      role={labelled ? "img" : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <path d={MARK_PATHS[verdict]} />
    </svg>
  );

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex rounded-full border-2 border-ink p-2 ${BADGE_CLASSES[verdict]} ${className}`}
      >
        {svg}
      </span>
    );
  }
  return (
    <span
      className={`${tone === "verdict" ? INLINE_CLASSES[verdict] : ""} ${className}`}
    >
      {svg}
    </span>
  );
}
