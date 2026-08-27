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
 * 役選択の選択肢の既定の並び（実戦での出現率が高い順）
 * 役選択既定順
 *
 * 翻数順（{@link YAKU_OPTIONS}）を選択肢の並びに使うと、出現率と並びが
 * ほぼ逆相関する。断么九が13番目に沈む一方で平和が3番目に来るため、
 * 頻出役ほど探す距離が長くなる。
 *
 * 並びの根拠には、アプリの出題を実測した値ではなく実戦の統計を使う。
 * 出題を実測すると生成器の作りがそのまま並びになり（面子生成が
 * 順子50%・刻子30%・槓子20%のため三槓子が5.2%出て11番目に来る）、
 * 同じ並びを共有する点数計算練習の分布（門前清自摸和38%・立直11%・
 * 平和5.7%）とは別物になるうえ、生成器を触るたび腐る。実戦の出現率なら
 * 2画面のどちらにも偏らず、麻雀を打つ人の直観とも一致する。
 *
 * 数値は天鳳鳳凰卓 2023年 東南戦赤あり 168,778戦 / 1,511,570和了の集計
 * （blog.kobalab.net）。立直41.5% / 門前清自摸和25.0% / 断么九22.0% /
 * 平和20.3% / 混一色4.6% / 一盃口3.9% / 三色同順3.7% / 七対子2.9% /
 * 対々和1.5% / 一気通貫1.5% / 混全帯么九0.83% / 三暗刻0.62% /
 * 清一色0.53% / 純全帯么九0.28% / 小三元0.078%、以下役満と三槓子・四槓子。
 *
 * 役牌は公開統計が翻牌39.3%として合算しており個別の値が無い。役牌として
 * 成立しうる度合いで按分した（白發中は全員に有効で各1、東南は場風1/2＋
 * 自風1/4、西北は自風1/4 → 白發中 各約8.3% / 東南 各約5.2% /
 * 西北 各約2.1%）。西北は本来なら七対子の下だが、ラベルが揃っていて
 * ひとかたまりに見えるため7種を連続させる（離すと抜けに見える）。
 *
 * これは既定値でしかなく、ユーザーが並び替えたときはそちらが優先される
 * （{@link normalizeYakuOrder}）。
 */
export const YAKU_DEFAULT_ORDER: readonly string[] = [
  "立直",
  "門前清自摸和",
  "断么九",
  "平和",
  "役牌 白",
  "役牌 發",
  "役牌 中",
  "役牌 東",
  "役牌 南",
  "役牌 西",
  "役牌 北",
  "混一色",
  "一盃口",
  "三色同順",
  "七対子",
  "対々和",
  "一気通貫",
  "混全帯么九",
  "三暗刻",
  "清一色",
  "純全帯么九",
  "小三元",
  "四暗刻",
  "二盃口",
  "三色同刻",
  "混老頭",
  "国士無双",
  "大三元",
  "小四喜",
  "大四喜",
  "字一色",
  "三槓子",
  "清老頭",
  "九蓮宝燈",
  "緑一色",
  "四槓子",
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
