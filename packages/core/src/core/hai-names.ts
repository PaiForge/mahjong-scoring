import { HaiKind, type Kazehai, type HaiKindId, type Tehai14 } from "@pai-forge/riichi-mahjong";
import { ok, type Result } from "neverthrow";
import { validateHaiKindId } from "./type-guards";

/**
 * 風牌の日本語名を取得
 * 風牌名称（Kazehai → 日本語）
 */
export function getKazeName(kaze: Kazehai): string {
  switch (kaze) {
    case HaiKind.Ton:
      return "東";
    case HaiKind.Nan:
      return "南";
    case HaiKind.Sha:
      return "西";
    case HaiKind.Pei:
      return "北";
    default:
      return "";
  }
}

/**
 * 全34牌種の日本語名マッピング
 * 牌名称マップ
 */
const HAI_NAMES: Record<number, string> = {
  [HaiKind.ManZu1]: "一萬",
  [HaiKind.ManZu2]: "二萬",
  [HaiKind.ManZu3]: "三萬",
  [HaiKind.ManZu4]: "四萬",
  [HaiKind.ManZu5]: "五萬",
  [HaiKind.ManZu6]: "六萬",
  [HaiKind.ManZu7]: "七萬",
  [HaiKind.ManZu8]: "八萬",
  [HaiKind.ManZu9]: "九萬",
  [HaiKind.PinZu1]: "一筒",
  [HaiKind.PinZu2]: "二筒",
  [HaiKind.PinZu3]: "三筒",
  [HaiKind.PinZu4]: "四筒",
  [HaiKind.PinZu5]: "五筒",
  [HaiKind.PinZu6]: "六筒",
  [HaiKind.PinZu7]: "七筒",
  [HaiKind.PinZu8]: "八筒",
  [HaiKind.PinZu9]: "九筒",
  [HaiKind.SouZu1]: "一索",
  [HaiKind.SouZu2]: "二索",
  [HaiKind.SouZu3]: "三索",
  [HaiKind.SouZu4]: "四索",
  [HaiKind.SouZu5]: "五索",
  [HaiKind.SouZu6]: "六索",
  [HaiKind.SouZu7]: "七索",
  [HaiKind.SouZu8]: "八索",
  [HaiKind.SouZu9]: "九索",
  [HaiKind.Ton]: "東",
  [HaiKind.Nan]: "南",
  [HaiKind.Sha]: "西",
  [HaiKind.Pei]: "北",
  [HaiKind.Haku]: "白",
  [HaiKind.Hatsu]: "發",
  [HaiKind.Chun]: "中",
};

/**
 * 牌種IDから日本語名を取得する
 * 牌名称取得
 */
export function getHaiName(haiKindId: HaiKindId): string {
  return HAI_NAMES[haiKindId] ?? `?${haiKindId}`;
}

/**
 * ドラ表示牌からドラを計算する
 * ドラ算出
 */
export function getDoraFromIndicator(indicator: HaiKindId): Result<HaiKindId, RangeError> {
  // 萬子
  if (indicator >= HaiKind.ManZu1 && indicator <= HaiKind.ManZu9) {
    const next = indicator === HaiKind.ManZu9 ? HaiKind.ManZu1 : indicator + 1;
    return validateHaiKindId(next);
  }
  // 筒子
  if (indicator >= HaiKind.PinZu1 && indicator <= HaiKind.PinZu9) {
    const next = indicator === HaiKind.PinZu9 ? HaiKind.PinZu1 : indicator + 1;
    return validateHaiKindId(next);
  }
  // 索子
  if (indicator >= HaiKind.SouZu1 && indicator <= HaiKind.SouZu9) {
    const next = indicator === HaiKind.SouZu9 ? HaiKind.SouZu1 : indicator + 1;
    return validateHaiKindId(next);
  }
  // 風牌
  if (indicator >= HaiKind.Ton && indicator <= HaiKind.Pei) {
    const next = indicator === HaiKind.Pei ? HaiKind.Ton : indicator + 1;
    return validateHaiKindId(next);
  }
  // 三元牌
  if (indicator >= HaiKind.Haku && indicator <= HaiKind.Chun) {
    const next = indicator === HaiKind.Chun ? HaiKind.Haku : indicator + 1;
    return validateHaiKindId(next);
  }
  return ok(indicator);
}

/**
 * 手牌中のドラ枚数をカウントする
 * ドラ枚数カウント
 */
export function countDoraInTehai(
  tehai: Tehai14,
  markers: readonly HaiKindId[],
): number {
  let count = 0;
  for (const marker of markers) {
    const doraResult = getDoraFromIndicator(marker);
    if (doraResult.isErr()) continue;
    const doraHai = doraResult.value;
    for (const h of tehai.closed) {
      if (h === doraHai) count++;
    }
    for (const mentsu of tehai.exposed) {
      for (const h of mentsu.hais) {
        if (h === doraHai) count++;
      }
    }
  }
  return count;
}

/**
 * 自風が東（親）かどうかを判定する
 * 親判定
 */
export function isOya(jikaze: Kazehai): boolean {
  return jikaze === HaiKind.Ton;
}

/**
 * 風牌の英語キー名を取得する（YAKU_NAME_MAP参照用）
 * 風牌キー名取得
 */
export function getKeyForKazehai(kaze: Kazehai): string {
  switch (kaze) {
    case HaiKind.Ton: return "Ton";
    case HaiKind.Nan: return "Nan";
    case HaiKind.Sha: return "Sha";
    case HaiKind.Pei: return "Pei";
  }
}
