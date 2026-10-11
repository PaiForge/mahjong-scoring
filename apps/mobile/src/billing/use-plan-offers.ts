import { useEffect, useState } from "react";
import type { MobilePlanOffer } from "@mahjong-scoring/features/billing/mobile-api";

import { IAP_AVAILABLE } from "./iap-availability";
import { fetchPlanOffers } from "./plan-api";

/** 読めた販売中の商品。起動している間だけ持つ */
let cached: readonly MobilePlanOffer[] | undefined;
/** 読んでいる最中の要求。同時に開いた画面で要求を重ねない */
let inflight: Promise<readonly MobilePlanOffer[]> | undefined;

/**
 * 販売中の商品を読む。読めなければ空（販売していない）
 * 販売中商品読み込み
 *
 * 回数制限を掛けるか（販売中か）の判定の元。ゲストとログイン中で判定の元を
 * 分けない — どちらもこの認証なしの一覧を読む（ログイン中の `/plan` の
 * `offers` も同じ値だが、ゲストには読めない）。
 *
 * 読めた結果は起動している間キャッシュする（Product ID の設定はサーバーの
 * デプロイでしか変わらない）。読めなかったときは空を返す — 払う手段を
 * 確かめられないうちにペイウォールを出さない（fail-open）。失敗は
 * キャッシュせず、次に聞かれたときに読み直す（起動直後の一時的な失敗で
 * その起動の間ずっと制限が外れたままにならないよう）。
 *
 * Android（`IAP_AVAILABLE` が false）は読まずに空を返す。
 */
export function loadPlanOffers(): Promise<readonly MobilePlanOffer[]> {
  if (!IAP_AVAILABLE) return Promise.resolve([]);
  if (cached !== undefined) return Promise.resolve(cached);
  inflight ??= fetchPlanOffers().then((offers) => {
    inflight = undefined;
    if (offers === undefined) return [];
    cached = offers;
    return offers;
  });
  return inflight;
}

/**
 * 販売中の商品を読む。読み終えるまで undefined
 * 販売中商品フック
 *
 * 練習一覧のカードの残数のように、販売していなければ何も出さない表示に使う。
 */
export function usePlanOffers(): readonly MobilePlanOffer[] | undefined {
  const [offers, setOffers] = useState(cached);
  useEffect(() => {
    let active = true;
    void loadPlanOffers().then((loaded) => {
      if (active) setOffers(loaded);
    });
    return () => {
      active = false;
    };
  }, []);
  return offers;
}
