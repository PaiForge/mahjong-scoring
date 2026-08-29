/**
 * 五十音行（あ行・か行 …）
 * 五十音行
 *
 * 用語集の「五十音から探す」の見出しと、その並び順。
 */
export const KANA_ROWS = [
  "あ",
  "か",
  "さ",
  "た",
  "な",
  "は",
  "ま",
  "や",
  "ら",
  "わ",
] as const;

export type KanaRow = (typeof KANA_ROWS)[number];

/**
 * 濁点・半濁点・小書きのカタカナを清音の大文字へ寄せる表。
 *
 * 「バイマン」を は行、「ジハイ」を さ行 に入れるための正規化で、行の判定に
 * しか使わない（表示には元の読みをそのまま出す）。
 */
const KANA_NORMALIZE: Readonly<Record<string, string>> = {
  ガ: "カ",
  ギ: "キ",
  グ: "ク",
  ゲ: "ケ",
  ゴ: "コ",
  ザ: "サ",
  ジ: "シ",
  ズ: "ス",
  ゼ: "セ",
  ゾ: "ソ",
  ダ: "タ",
  ヂ: "チ",
  ヅ: "ツ",
  デ: "テ",
  ド: "ト",
  バ: "ハ",
  ビ: "ヒ",
  ブ: "フ",
  ベ: "ヘ",
  ボ: "ホ",
  パ: "ハ",
  ピ: "ヒ",
  プ: "フ",
  ペ: "ヘ",
  ポ: "ホ",
  ヴ: "ウ",
  ァ: "ア",
  ィ: "イ",
  ゥ: "ウ",
  ェ: "エ",
  ォ: "オ",
  ッ: "ツ",
  ャ: "ヤ",
  ュ: "ユ",
  ョ: "ヨ",
  ヮ: "ワ",
};

/** 行 → その行に属する清音カタカナ */
const KANA_ROW_MEMBERS: Readonly<Record<KanaRow, string>> = {
  あ: "アイウエオ",
  か: "カキクケコ",
  さ: "サシスセソ",
  た: "タチツテト",
  な: "ナニヌネノ",
  は: "ハヒフヘホ",
  ま: "マミムメモ",
  や: "ヤユヨ",
  ら: "ラリルレロ",
  わ: "ワヲン",
};

/**
 * 読み（カタカナ）から五十音行を求める。
 * 五十音行判定
 *
 * 判定に使うのは 1 文字目だけ。濁点・半濁点・小書きは清音に寄せる
 * （「ピンフ」→ は行）。どの行にも当たらない読み（空文字・記号始まり）は
 * undefined を返し、呼び出し側が行見出しから外す。
 *
 * @param reading 用語の読み（例: "メンツ"）
 */
export function kanaRowOf(reading: string): KanaRow | undefined {
  const head = reading.charAt(0);
  if (head === "") return undefined;

  const normalized = KANA_NORMALIZE[head] ?? head;
  return KANA_ROWS.find((row) => KANA_ROW_MEMBERS[row].includes(normalized));
}
