/**
 * Extended MSPZ 1.x の手牌表記を Extended MPSZ 2.0 へ書き換える
 * 旧表記変換
 *
 * DB に保存済みの旧表記（広告カードの `hand` 列）を移行するためのもの。
 * 規則は riichi-mahjong 1.0.0 の CHANGELOG「移行ガイド (0.11.x → 1.0.0)」と
 * 同じで、1.x のパーサーが暗黙に置いていた鳴き元をそのまま注釈にする:
 *
 * - チー `[123m]` → `[1-23m]`（上家から 1 枚目を鳴いた）
 * - ポン `[555p]` → `[5=55p]`、大明槓 `[5555p]` → `[5=555p]`（対面から 1 枚目）。
 *   1.x の `[5555p]` は常に大明槓で、加槓 `{...}` には書き換えない
 * - 暗槓 `(1111z)` と純手牌はそのまま
 *
 * 書き換え後もブロックと純手牌の並び順は保つ（`formatMpsz` の正規形に
 * 揃えない）。広告の帯は純手牌を表記の順に並べるため、正規形に揃えると
 * 管理者が決めた牌の並びが変わる。
 *
 * 意味を保ったまま書き換えられない値は直さずに理由を返す。呼び出し側は
 * 一覧で報告し、値を人が決める:
 *
 * - `0`: 1.x は黙って読み飛ばしていたが、2.0 では赤 5 を表す（意味が変わる）
 * - 字牌の `8z` `9z`: 1.x は読み飛ばしていたが、2.0 では文字列全体が不正
 * - `[1m2m3m]` のようにブロック内でサフィックスが複数あるもの、面子を
 *   成さないブロック、上記の構文に当たらない文字
 */
import { parseTehai } from "@mahjong-scoring/core";

/** 書き換えられない理由 */
export type LegacyMpszFailureReason =
  | "redFive"
  | "honorOutOfRange"
  | "invalidMeld"
  | "invalidSyntax";

/** {@link convertLegacyExtendedMpsz} の結果 */
export type LegacyMpszConversion =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: LegacyMpszFailureReason };

/** 1.x の字句。純手牌の数字列・副露 `[...]`・暗槓 `(...)` */
const TOKEN = /(\d+)([mpsz])|\[(\d+)([mpsz])\]|\((\d+)([mpsz])\)/y;

function failure(reason: LegacyMpszFailureReason): LegacyMpszConversion {
  return { ok: false, reason };
}

/** 数字列が全部同じ数字か */
function isSameDigits(digits: string): boolean {
  return [...digits].every((digit) => digit === digits[0]);
}

/** 副露ブロックの中身を 2.0 の注釈付きに書き換える（面子を成さなければ undefined） */
function annotateOpenMeld(digits: string, suit: string): string | undefined {
  if ((digits.length === 3 || digits.length === 4) && isSameDigits(digits)) {
    const [first] = digits;
    return `${first}=${digits.slice(1)}`;
  }
  if (digits.length === 3 && suit !== "z") {
    const [a, b, c] = [...digits].map(Number).sort((x, y) => x - y);
    if (b === a + 1 && c === b + 1) return `${a}-${b}${c}`;
  }
  return undefined;
}

/**
 * 1.x の表記を 2.0 の表記に書き換える
 * 旧表記変換
 *
 * @param input - Extended MSPZ 1.x の手牌文字列
 * @returns 書き換えた文字列、または書き換えられない理由
 */
export function convertLegacyExtendedMpsz(input: string): LegacyMpszConversion {
  let output = "";
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < input.length) {
    const start = TOKEN.lastIndex;
    const match = TOKEN.exec(input);
    if (!match) return failure("invalidSyntax");

    const digits = match[1] ?? match[3] ?? match[5] ?? "";
    const suit = match[2] ?? match[4] ?? match[6] ?? "";
    if (digits.includes("0")) return failure("redFive");
    if (suit === "z" && /[89]/.test(digits)) return failure("honorOutOfRange");

    if (match[3] !== undefined) {
      const annotated = annotateOpenMeld(digits, suit);
      if (annotated === undefined) return failure("invalidMeld");
      output += `[${annotated}${suit}]`;
    } else if (match[5] !== undefined) {
      if (digits.length !== 4 || !isSameDigits(digits)) {
        return failure("invalidMeld");
      }
      output += `(${digits}${suit})`;
    } else {
      output += input.slice(start, TOKEN.lastIndex);
    }
  }

  // 規則の外にある構文（2.0 で新たに不正になったもの）の取りこぼしを防ぐ
  if (output !== "" && parseTehai(output) === undefined) {
    return failure("invalidSyntax");
  }
  return { ok: true, value: output };
}
