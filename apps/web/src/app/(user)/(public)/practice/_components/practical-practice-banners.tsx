import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { DEMO_MENTSU_HAND } from "@mahjong-scoring/features/board/demo-score-question";
import { splitAgariHai } from "@mahjong-scoring/features/board/agari-hai";
import {
  AGARI_SCORE_PRACTICE_HREF,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";
import { TehaiHand } from "../../_components/tehai-hand";
import { TileSet } from "@/app/(user)/_components/tile-set";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { PracticeEntryQuota } from "./practice-entry-quota";

// 三筒で和了するデモから1枚抜いた、三筒・六筒待ちの聴牌形。
const TENPAI_TILES = splitAgariHai(
  DEMO_MENTSU_HAND.closed,
  DEMO_MENTSU_HAND.agariHai,
).closedTiles;

async function PracticalPracticeCard({ menu }: { readonly menu: QuotaMenu }) {
  const t = await getTranslations("practice");
  const isScore = menu === "agari-score";
  const key = isScore ? "agariScoreBanner" : "tenpaiScoreBanner";
  const href = isScore ? AGARI_SCORE_PRACTICE_HREF : TENPAI_SCORE_PRACTICE_HREF;
  return (
    // 基礎練習のカード（PracticeCard）と同じ組み方: カード自体は押せる面では
    // なく、右下の「くわしく見る」だけがリンク。行き先は play ではなく説明と
    // 設定のページなので、「練習する」のように始まる印象の文言は使わない
    // （緑はボタン = 押して始める面の色で、リンクには使わない）
    <article className="flex h-full flex-col rounded-panel border border-panel bg-white">
      <div className="flex flex-1 flex-col p-5">
        <div
          aria-hidden="true"
          className="mb-5 flex min-h-40 flex-col justify-center gap-4 overflow-hidden rounded-lg bg-primary-800 p-3"
        >
          <TehaiHand
            tehai={{
              closed: isScore ? DEMO_MENTSU_HAND.closed : TENPAI_TILES,
              exposed: [],
            }}
            agariHai={isScore ? DEMO_MENTSU_HAND.agariHai : undefined}
            agariLabel={isScore ? t("preview.tsumo") : undefined}
          />
          {isScore ? (
            <p className="text-center text-sm font-bold text-white">
              {t("preview.score")}
            </p>
          ) : (
            <div className="flex justify-center gap-5">
              {[HaiKind.PinZu3, HaiKind.PinZu6].map((tile) => (
                <div key={tile} className="flex items-center gap-2">
                  <TileSet tiles={[tile]} size="sm" />
                  <span className="text-xs font-bold leading-6 text-white">
                    {t("preview.ron")}
                    <br />
                    {t("preview.tsumoScore")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-surface-900">
          {t(`${key}.title`)}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-surface-500">
          {t(`${key}.description`)}
        </p>
        <div className="mt-4 flex justify-end">
          <Link
            href={href}
            className={`flex items-center text-sm font-bold ${TEXT_LINK_CLASSES}`}
          >
            {t("detail")}
            <ChevronRightIcon className="ml-1 size-4" />
          </Link>
        </div>
      </div>
      <div className="border-t border-panel px-5 py-4">
        <PracticeEntryQuota menu={menu} />
      </div>
    </article>
  );
}

/** 実戦練習とダッシュボードで共有する、問題プレビュー付きの入口。 */
export function AgariScorePracticeBanner() {
  return <PracticalPracticeCard menu="agari-score" />;
}

export function TenpaiScorePracticeBanner() {
  return <PracticalPracticeCard menu="tenpai-score" />;
}
