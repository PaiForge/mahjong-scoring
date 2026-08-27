import type { Kazehai } from "@pai-forge/riichi-mahjong";
import { getKeyForKazehai } from "../../core/kaze";
import {
  getYakuNameJa,
  SCORE_YAKU_NAME_MAP,
  SITUATIONAL_YAKU_KEYS,
  YAKU_OPTIONS,
} from "../../core/yaku-names";

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
 * 役選択の選択肢の既定の並び（出現率の高い順）
 * 役選択既定順
 *
 * 翻数順（{@link YAKU_OPTIONS}）を選択肢の並びに使うと、出現率と並びが
 * ほぼ逆相関する。断么九（15.6%）が13番目に沈む一方で平和（0.4%）が3番目に
 * 来るため、頻出役ほど探す距離が長くなっていた。
 *
 * 並びは generateYakuQuestion の出題 20 万問をサンプリングし、各役が正解に
 * 含まれた割合の降順で決めた（2026-08 計測）。同率（出題され得ない役を含む）は
 * 翻数順で並べる。出題ロジックを変えたら測り直すこと。
 *
 * これは既定値でしかなく、ユーザーが並べ替えたときはそちらが優先される
 * （{@link normalizeYakuOrder}）。
 */
export const YAKU_DEFAULT_ORDER: readonly string[] = [
  "役牌 白",
  "役牌 發",
  "役牌 中",
  "断么九",
  "対々和",
  "役牌 東",
  "役牌 南",
  "三暗刻",
  "混一色",
  "門前清自摸和",
  "三槓子",
  "役牌 西",
  "役牌 北",
  "立直",
  "混全帯么九",
  "一盃口",
  "清一色",
  "四暗刻",
  "三色同順",
  "四槓子",
  "平和",
  "一気通貫",
  "混老頭",
  "三色同刻",
  "純全帯么九",
  "小三元",
  "大三元",
  "二盃口",
  "字一色",
  "大四喜",
  "小四喜",
  "清老頭",
  "緑一色",
  "七対子",
  "国士無双",
  "九蓮宝燈",
];

/**
 * 保存された並び順を、現在選択できる役の並びとして使える形に整える
 * 役選択順正規化
 *
 * 選択できる役は増減しうるため、保存済みの並びをそのまま信用しない。
 * 選べなくなった役は捨て、まだ並びに無い役は既定順の位置関係を保ったまま
 * 末尾に足す。結果は常に {@link SELECTABLE_YAKU} の全役をちょうど1回ずつ含む。
 *
 * @param savedOrder - 端末に保存されている並び（未保存なら空配列でよい）
 */
export function normalizeYakuOrder(
  savedOrder: readonly string[],
): readonly string[] {
  const selectable = new Set(SELECTABLE_YAKU);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of savedOrder) {
    if (!selectable.has(name) || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }
  for (const name of YAKU_DEFAULT_ORDER) {
    if (seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }
  return result;
}

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
