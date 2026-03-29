import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

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

export function HaiLabel({ haiKindId }: { haiKindId: HaiKindId }) {
  const name = HAI_NAMES[haiKindId] ?? `?${haiKindId}`;
  return <span className="text-lg font-bold text-surface-900">{name}</span>;
}
