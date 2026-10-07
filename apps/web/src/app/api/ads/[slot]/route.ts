import { NextResponse } from "next/server";

import type { NativeAdsResponse } from "@mahjong-scoring/features/ads/native-ad";

import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { AD_SLOT_VALUES, isAdSlot, isMobileAdSlot } from "@/lib/ads/registry";

/**
 * モバイルアプリに広告を配る
 * 広告配信API
 *
 * web の画面はサーバーで DB を読む（`getNativeAdCreatives`）ので、この API を
 * 読むのはモバイル（Expo）だけ。答えるのはモバイルの画面が読むスロット
 * （`isMobileAdSlot`）に限り、web のスロットは 404 にする — 配る在庫を
 * 意図したものに絞り、CDN のキャッシュの鍵も増やさない。
 *
 * @design 静的に生成し、管理画面の書き込みで作り直す
 *
 * 閲覧者に依存しない公開の値なので、スロットごとに静的に生成して CDN から
 * 返す。鮮度は広告を出す静的ページ（練習一覧など）と同じ仕組みが持つ —
 * 読み込みは `AD_CREATIVES_CACHE_TAG` のキャッシュを通り、管理画面の書き込みが
 * そのタグを捨てた時点でこの応答も作り直される。`revalidate` はその
 * 取りこぼしの保険（キャッシュの revalidate と同じ 1 日）。
 *
 * 未知のスロットは `dynamicParams = false` でルーティングの段階で 404 にする。
 *
 * @design CORS を開ける
 *
 * ネイティブの fetch は CORS を見ないが、画面確認用の Expo の web 版
 * （localhost:8081）はブラウザから別 origin を叩く。誰が読んでも同じ公開の値
 * なので、origin を絞る理由が無い。
 */
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams(): { slot: string }[] {
  return AD_SLOT_VALUES.filter(isMobileAdSlot).map((slot) => ({ slot }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/ads/[slot]">,
): Promise<NextResponse> {
  const { slot } = await params;
  if (!isAdSlot(slot) || !isMobileAdSlot(slot)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body: NativeAdsResponse = { ads: await getNativeAdPlacements(slot) };
  return NextResponse.json(body, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
