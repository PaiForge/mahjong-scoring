/**
 * プロフィールに載せられない語句の判定
 * 禁止語句判定
 *
 * App Store の審査ガイドライン 1.2（利用者の投稿を載せるアプリは、不適切な
 * 内容の投稿を防ぐ仕組みを持つこと）に当たる、投稿時のフィルタ。ユーザー名・
 * 表示名・自己紹介・SNS のアカウント名を保存するときに、web の Server Action と
 * アプリ向け API の両方が通る検証（`validation.ts`・`account/username.ts`）から呼ぶ。
 *
 * @design 取りこぼしより誤検知を避ける
 * これは最初の網で、すり抜けたものは利用者の通報と管理者の対応が受ける
 * （画像はそもそもここでは弾けない）。普通の文章を弾くと本人には理由が
 * 分からないので、普通の文の一部に現れうる短い語（ひらがなの「しね」、
 * 麻雀用語の「チョンボ」を含む語、英語の "sex" や "rape" のように別の単語の
 * 中に現れる綴り）は載せない。語を足すときも、部分一致で普通の語や麻雀用語に
 * 引っかからないかを確かめること。
 *
 * @design 部分一致で、表記の揺れを畳んでから比べる
 * 全角・半角（NFKC）、大文字・小文字、カタカナ・ひらがなを揃え、文字と数字
 * 以外（空白・記号）を取り除いてから探す。「死 ね」「F.U.C.K」「ｼﾈ」のような
 * 区切りや表記の言い換えも同じ語として扱うため。
 */

/** 正規化した形で持つ語の一覧（{@link normalizeForMatching} を通した後の形で書く） */
const PROHIBITED_WORDS: readonly string[] = [
  // 脅迫・攻撃
  "死ね",
  "氏ね",
  "殺すぞ",
  "ころすぞ",
  "殺してやる",
  "ころしてやる",
  // 差別語
  "きちがい",
  "基地外",
  "池沼",
  "にがー",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  // 性的な語
  "ちんこ",
  "ちんぽ",
  "まんこ",
  "せっくす",
  "れいぷ",
  "強姦",
  "porn",
  "fuck",
  "cunt",
  "bitch",
  "whore",
];

/** カタカナ（ァ〜ヶ）をひらがなへ寄せるときの差 */
const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;

/**
 * 比べる前に表記の揺れを畳む
 * 照合用正規化
 */
export function normalizeForMatching(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - KATAKANA_TO_HIRAGANA_OFFSET),
    )
    .replace(/[^\p{L}\p{N}ー]/gu, "");
}

/**
 * プロフィールに載せられない語句を含むかを返す
 * 禁止語句判定
 */
export function containsProhibitedWord(text: string): boolean {
  const normalized = normalizeForMatching(text);
  if (normalized === "") return false;
  return PROHIBITED_WORDS.some((word) => normalized.includes(word));
}
