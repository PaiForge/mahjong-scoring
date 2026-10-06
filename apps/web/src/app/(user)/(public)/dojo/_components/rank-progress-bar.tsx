import { getTranslations } from "next-intl/server";

import { beltBorderClass, beltClass } from "@/lib/ranks/belt-colors";
import {
  RANK_REGISTRY,
  type RankSlug,
} from "@mahjong-scoring/features/ranks/registry";

interface RankProgressBarProps {
  /** 現在の段級位。未取得（無級）なら undefined */
  readonly currentSlug: RankSlug | undefined;
  /** スポットライトツアーが照らす対象の id */
  readonly dataTourId?: string;
}

/**
 * 5級から初段（黒帯）までの段級位の進み具合を示す区切り付きのバー。
 * 段級位進捗バー
 *
 * レッスン一覧の学習進捗バー（`CurriculumProgressBar`）と同じ「ラベル行 +
 * 太枠のトラック」の形だが、％ではなく級ごとの区切りで見せる。段級位は
 * 6 段階しかなく「33%」のような数字は粗いうえ意味を持たない — 章の数という
 * 量ではなく段階なので、区切りそのものが目盛りになる。
 *
 * 取得済みの区切りはその級の帯色で塗る。以前この場所にあった帯バッジが
 * 担っていた「帯の色で今の級がわかる」役割をバーが引き継ぐため。次の目標の
 * 級は塗らずに帯色の枠だけを付け、残りは淡いグレー。級は下から順にしか
 * 取得できない（`evaluateExamEligibility`）ので、現在の級以下をすべて
 * 取得済みとして塗ってよい。
 *
 * 区切りの中に次の級の「学ぶ → 練習 → 試験」の進み具合までは入れない。
 * すぐ下の「次の目標」のカードと中身が重なるため、ここは級単位だけを持つ。
 *
 * @param currentSlug 現在の段級位。未取得なら undefined
 * @param dataTourId スポットライトツアーが照らす対象の id
 */
export async function RankProgressBar({
  currentSlug,
  dataTourId,
}: RankProgressBarProps) {
  const [t, tRanks] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
  ]);
  const currentIndex =
    currentSlug === undefined
      ? -1
      : RANK_REGISTRY.findIndex((rank) => rank.slug === currentSlug);
  const achievedCount = currentIndex + 1;
  const totalCount = RANK_REGISTRY.length;
  const currentName =
    currentSlug === undefined ? t("unranked") : tRanks(`names.${currentSlug}`);

  return (
    <div
      className="space-y-2"
      data-tour-id={dataTourId}
      data-belt-slug={currentSlug ?? "unranked"}
    >
      <div className="flex items-baseline justify-between gap-3">
        {/* ラベルは小さな文字だが h2 にして、見出しジャンプで「次の目標」と
            同じ段に並ぶようにする（SectionTitle の pill にすると、1 行の
            ラベルがバーより目立つ） */}
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-xs font-bold text-surface-500">
            {t("currentRankTitle")}
          </h2>
          <p className="text-base font-bold text-surface-900">{currentName}</p>
        </div>
        <span className="text-xs tabular-nums text-surface-600">
          {t("rankProgress", { done: achievedCount, total: totalCount })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t("currentRankTitle")}
        aria-valuenow={achievedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuetext={t("rankProgressValue", {
          rank: currentName,
          done: achievedCount,
          total: totalCount,
        })}
      >
        {/* 列数はレジストリの級の数に追従させる（級を足しても区切りが合う） */}
        <ol
          aria-hidden="true"
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${totalCount}, minmax(0, 1fr))`,
          }}
        >
          {RANK_REGISTRY.map((rank, index) => {
            const state =
              index <= currentIndex
                ? "achieved"
                : index === currentIndex + 1
                  ? "next"
                  : "upcoming";
            const segmentClass =
              state === "achieved"
                ? `${beltClass(rank.slug)} ${beltBorderClass(rank.slug)}`
                : state === "next"
                  ? `bg-white ${beltBorderClass(rank.slug)}`
                  : "border-surface-300 bg-surface-100";
            return (
              <li
                key={rank.slug}
                data-rank-slug={rank.slug}
                data-state={state}
                className="space-y-1 text-center"
              >
                <div className={`h-4 rounded-full border-3 ${segmentClass}`} />
                <span
                  className={`block text-xs ${
                    index === currentIndex
                      ? "font-bold text-surface-900"
                      : "text-surface-500"
                  }`}
                >
                  {tRanks(`names.${rank.slug}`)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
