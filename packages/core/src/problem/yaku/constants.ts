import type { Kazehai } from "@pai-forge/riichi-mahjong";
import { getKeyForKazehai } from "../../core/kaze";
import {
  getYakuNameJa,
  SCORE_YAKU_NAME_MAP,
  SITUATIONAL_YAKU_KEYS,
  YAKU_OPTIONS,
} from "../../core/yaku-names";
import { findYakuHanEntry, YAKUMAN_HAN } from "../yaku-han/constants";

/**
 * 役練習では除外する英語キー
 * 風牌の役牌は getKazeYakuhaiDisplayName で個別に処理するため、
 * 状況役・偶然役とともにマップから除外する
 * 役練習除外キー
 */
const YAKU_DRILL_EXCLUDED_KEYS: ReadonlySet<string> = new Set([
  ...SITUATIONAL_YAKU_KEYS,
  "Riichi",
  // 風牌の役牌は getKazeYakuhaiDisplayName で個別に処理する
  "Yakuhai",
  "Ton",
  "Nan",
  "Sha",
  "Pei",
]);

/**
 * ライブラリの役名（英語キー）から日本語表示名へのマッピング
 * SCORE_YAKU_NAME_MAP から風牌・状況役を除外したサブセット
 * 役名マップ
 */
export const YAKU_NAME_MAP: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(SCORE_YAKU_NAME_MAP).filter(
      ([key]) => !YAKU_DRILL_EXCLUDED_KEYS.has(key),
    ),
  );

/**
 * ユーザーが選択可能な役のリスト（翻数順）
 * YAKU_OPTIONS と同一のリスト（単一ソース化）
 * 選択可能役リスト
 */
export const SELECTABLE_YAKU: readonly string[] = YAKU_OPTIONS;

/**
 * 役選択の選択肢グループの区分
 * 役選択グループ区分
 */
export type YakuSelectGroupKind = "menzenOnly" | "nakiOk" | "yakuman";

/** 選択肢グループの表示順 */
const YAKU_SELECT_GROUP_ORDER: readonly YakuSelectGroupKind[] = [
  "menzenOnly",
  "nakiOk",
  "yakuman",
];

/** 役が属する選択肢グループを判定する（役翻数エントリに解決できない役は undefined） */
function yakuSelectGroupKindOf(
  yakuName: string,
): YakuSelectGroupKind | undefined {
  const entry = findYakuHanEntry(yakuName);
  if (entry === undefined) return undefined;
  if (entry.menzenHan === YAKUMAN_HAN) return "yakuman";
  return entry.nakiHan === undefined ? "menzenOnly" : "nakiOk";
}

/**
 * 選択可能役リストを鳴きの可否ごとに分けたもの（表示順）
 * 選択可能役グループ
 *
 * 翻数で区切らないのは、役選択が翻数を問わない出題であるうえ、
 * 選択肢が持てる翻数が門前の値に限られるため。食い下がり役（混一色など）を
 * 門前翻数の見出しの下に置くと、鳴いた手が出題されたときに見出しが
 * その手について偽になる。鳴きの可否は手牌によらない役の性質なので、
 * どの出題でも見出しが手牌と矛盾しない。
 *
 * グループ内の並びは {@link YAKU_OPTIONS}（翻数順）に従う。
 * 役満は門前限定のものと鳴いて成立するものが混在するが、翻数の桁が違い
 * 探し方も別なので独立したグループとして残す。
 */
export const SELECTABLE_YAKU_GROUPS: readonly {
  readonly kind: YakuSelectGroupKind;
  readonly names: readonly string[];
}[] = YAKU_SELECT_GROUP_ORDER.map((kind) => ({
  kind,
  names: YAKU_OPTIONS.filter((name) => yakuSelectGroupKindOf(name) === kind),
}));

/**
 * 正解から除外するライブラリ返却役名（状況役・偶然役）
 * 除外役名リスト
 */
export const EXCLUDED_YAKU_FROM_ANSWER: ReadonlySet<string> = new Set(
  SITUATIONAL_YAKU_KEYS,
);

/**
 * 風牌の牌種IDが場風・自風として役牌になる場合の表示名を返す
 * ライブラリは風牌の役牌を YakuResult に含めないため、手牌の刻子/槓子から手動で判定する
 * 風牌役牌表示名取得
 *
 * 表示名は SCORE_YAKU_NAME_MAP が唯一の定義。ここは風牌 → 英語キーの
 * 変換（{@link getKeyForKazehai}）を挟んで引き直すだけで、独自の対応表は持たない。
 */
export function getKazeYakuhaiDisplayName(
  kazeHaiKindId: Kazehai,
): string | undefined {
  return getYakuNameJa(getKeyForKazehai(kazeHaiKindId));
}
