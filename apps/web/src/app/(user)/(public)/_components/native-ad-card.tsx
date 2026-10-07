import Image from "next/image";
import { getTranslations } from "next-intl/server";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";

import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import {
  NATIVE_AD_LINK_PROPS,
  NativeAdBadge,
} from "@/app/(user)/_components/native-ad-badge";

import { CardVisualBand, CardVisualHand } from "./card-visual-band";

interface NativeAdCardProps {
  readonly creative: NativeAdView;
}

/**
 * カード型のネイティブ広告（`native_card`）
 * 広告カード
 *
 * 練習一覧の練習カード（`PracticeCard`）と同じ骨格 — 太枠の白いカード、
 * 左上にタイトル、右上に添え物、右下に行き先の文言 — で描く。練習一覧の
 * グリッドに混ざったときに 1 枚だけ別の形にならないようにするため。
 * 練習一覧以外（結果画面・教本の章末）でも同じ形を使う。
 *
 * 練習カードと違い、カード全体を 1 つのリンクにする。練習カードは教本
 * アイコン・段級位ピルという別の行き先を内側に持つが、広告の行き先は 1 つ
 * だけで、どこを押しても同じ所へ行く方が迷わない。影を持たないのは練習
 * カードに揃えるため（持ち上がる hover は同じ）。
 *
 * 見た目は 2 通り。
 *
 * - 手牌を持つ広告は、練習カードと同じ緑の帯（`CardVisualBand`）に手牌を
 *   並べ、その下に説明を置く。牌効率・何切る系の本のように、中身そのものが
 *   手牌で見せられる広告のための形で、練習一覧では練習カードとの見分けが
 *   「PR」の表記だけになる。画像・絵文字は出さない（帯と並べるとカードが
 *   練習カードより高くなる）
 * - 持たない広告は、画像（書影など）か絵文字を左に置き、右に説明を置く
 */
export async function NativeAdCard({ creative }: NativeAdCardProps) {
  const t = await getTranslations("nativeAd");

  return (
    <a
      href={creative.href}
      {...NATIVE_AD_LINK_PROPS}
      data-native-ad={creative.id}
      className={`group flex flex-col justify-between rounded-panel border border-panel bg-white p-5 transition-transform hover:-translate-y-1 ${FOCUS_RING_CLASSES}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-surface-900">
            {creative.title}
          </h3>
          <NativeAdBadge label={t("badge")} ariaLabel={t("badgeLabel")} />
        </div>
        {creative.hand !== undefined ? (
          <>
            <CardVisualBand>
              <CardVisualHand tiles={creative.hand} />
            </CardVisualBand>
            {creative.description !== undefined && (
              <p className="mt-3 text-sm leading-relaxed text-surface-600">
                {creative.description}
              </p>
            )}
          </>
        ) : (
          <div className="mt-3 flex items-start gap-4">
            <CreativeVisual creative={creative} />
            {creative.description !== undefined && (
              <p className="text-sm leading-relaxed text-surface-600">
                {creative.description}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <span
          className={`flex items-center text-sm font-bold ${ROW_LINK_TITLE_CLASSES}`}
        >
          {t("cta")}
          <ChevronRightIcon className="ml-1 size-4" />
          <span className="sr-only">{t("opensInNewTab")}</span>
        </span>
      </div>
    </a>
  );
}

/** 手牌を持たない広告の左の見た目。画像があれば画像、無ければ絵文字 */
function CreativeVisual({ creative }: NativeAdCardProps) {
  if (creative.imageUrl !== undefined) {
    return (
      <Image
        src={creative.imageUrl}
        alt={creative.imageAlt}
        width={80}
        height={80}
        className="size-20 shrink-0 object-contain"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-surface-50 text-4xl"
    >
      {creative.icon}
    </span>
  );
}
