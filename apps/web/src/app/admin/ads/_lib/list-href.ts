import {
  platformForSlot,
  type AdPlatform,
  type AdSlot,
} from "@/lib/ads/registry";

/**
 * 広告一覧のプラットフォームのタブ
 * 広告一覧パス
 */
export function adsListHref(platform: AdPlatform): string {
  return `/admin/ads?platform=${platform}`;
}

/**
 * 広告一覧の、スロットのある位置（タブ + スロットのアンカー）
 * スロット位置パス
 *
 * 作成・編集から戻るとき、web とアプリの対のスロットを行き来するときに使う。
 * 戻り先がいつも web のタブの先頭だと、アプリのスロットを触るたびにタブを
 * 切り替えて探し直すことになる。
 */
export function adsSlotHref(slot: AdSlot): string {
  return `${adsListHref(platformForSlot(slot))}#${encodeURIComponent(slot)}`;
}
