import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { DEMO_MENTSU_HAND } from "@mahjong-scoring/features/board/demo-score-question";
import {
  COMPREHENSIVE_PRACTICE_HREF,
  MACHI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";
import { TehaiHand } from "../../_components/tehai-hand";
import { TileSet } from "@/app/(user)/_components/tile-set";
import { PracticeEntryQuota } from "./practice-entry-quota";

// 三筒で和了するデモから1枚抜いた、三筒・六筒待ちの聴牌形。
const TENPAI_TILES = DEMO_MENTSU_HAND.closed.filter((_, index) => index !== 6);

async function PracticalPracticeCard({ menu }: { readonly menu: QuotaMenu }) {
  const t = await getTranslations("practice");
  const isScore = menu === "score";
  const key = isScore ? "comprehensiveBanner" : "machiScoreBanner";
  const href = isScore
    ? COMPREHENSIVE_PRACTICE_HREF
    : MACHI_SCORE_PRACTICE_HREF;
  return (
    <article className="flex h-full flex-col rounded-2xl border-3 border-ink bg-white shadow-sm">
      <Link
        href={href}
        className="group flex flex-1 flex-col rounded-t-xl p-5 hover:bg-primary-50"
      >
        <div
          aria-hidden="true"
          className="mb-5 flex min-h-40 flex-col justify-center gap-4 overflow-hidden rounded-xl bg-primary-800 p-3"
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
        <span className="mt-5 font-bold text-primary-700 group-hover:underline">
          {t("preview.start")} →
        </span>
      </Link>
      <div className="border-t border-surface-200 px-5 py-4">
        <PracticeEntryQuota menu={menu} />
      </div>
    </article>
  );
}

/** 実戦練習とダッシュボードで共有する、問題プレビュー付きの入口。 */
export function ComprehensivePracticeBanner() {
  return <PracticalPracticeCard menu="score" />;
}

export function MachiScorePracticeBanner() {
  return <PracticalPracticeCard menu="machi-score" />;
}
