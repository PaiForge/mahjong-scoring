"use client";

import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { HaiKind, MentsuType } from "@mahjong-scoring/core";
import type { DrillQuestion } from "@mahjong-scoring/core";
import { getKazeName, getDoraFromIndicator } from "@mahjong-scoring/core";
import { useResponsiveHaiSize } from "../../_hooks/use-responsive-hai-size";
import { useTranslations } from "next-intl";

interface QuestionDisplayProps {
  readonly question: DrillQuestion;
}

/**
 * 手牌・状況表示コンポーネント
 * 問題表示
 */
export function QuestionDisplay({ question }: QuestionDisplayProps) {
  const t = useTranslations("score");
  const { tehai, agariHai, isTsumo, jikaze, bakaze, doraMarkers } = question;
  const isOya = jikaze === HaiKind.Ton;
  const haiSize = useResponsiveHaiSize();

  const closedWithoutAgari = (() => {
    const index = tehai.closed.lastIndexOf(agariHai);
    if (index === -1) return tehai.closed;
    return [...tehai.closed.slice(0, index), ...tehai.closed.slice(index + 1)];
  })();

  const kantsuList = tehai.exposed.filter((m) => m.type === MentsuType.Kantsu);
  const otherFuroList = tehai.exposed.filter((m) => m.type !== MentsuType.Kantsu);

  return (
    <div className="space-y-6">
      {/* Hand display */}
      <div className="rounded-lg bg-green-800 p-2">
        {/* Wind info */}
        <div className="mb-4 flex items-center justify-center gap-4 text-sm text-white">
          <div>
            {getKazeName(bakaze)}
            {t("question.round")} {getKazeName(jikaze)}
            {t("question.wind")}
            {isOya ? (
              <span className="ml-2 text-yellow-300">{t("question.dealer")}</span>
            ) : (
              <span className="ml-2 text-white">{t("question.nonDealer")}</span>
            )}
          </div>
          {question.isRiichi && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-400">
                {t("question.riichi")}
              </span>
            </div>
          )}
        </div>

        {/* Kantsu (top right) */}
        {kantsuList.length > 0 && (
          <div className="mb-2 flex w-full justify-end px-4">
            <div className="flex gap-2">
              {kantsuList.map((mentsu, index) => (
                <Furo
                  key={`kan-${index}`}
                  mentsu={mentsu}
                  furo={mentsu.furo}
                  size={haiSize}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex w-full items-end justify-center">
          {/* Closed tiles (13) */}
          <div className="flex shrink-0">
            {closedWithoutAgari.map((kindId, index) => (
              <Hai key={index} hai={kindId} size={haiSize} />
            ))}
          </div>

          {/* Other furo (bottom right) */}
          {otherFuroList.length > 0 && (
            <div
              className={`flex shrink-0 ${haiSize === "xs" ? "ml-1" : "ml-2"}`}
            >
              {otherFuroList.map((mentsu, index) => (
                <Furo
                  key={`other-${index}`}
                  mentsu={mentsu}
                  furo={mentsu.furo}
                  size={haiSize}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Tsumo/Ron + agari hai */}
        <div className="rounded-lg bg-surface-100 p-3">
          <div className="mb-1 text-xs text-surface-500">{t("question.win")}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">
              {isTsumo ? t("question.tsumo") : t("question.ron")}
            </span>
            <Hai hai={agariHai} size={haiSize} highlighted />
          </div>
        </div>

        {/* Dora & ura dora */}
        <div className="flex gap-4 rounded-lg bg-surface-100 p-3">
          <div>
            <div className="mb-1 text-xs text-surface-500">
              {t("question.dora")}
            </div>
            <div className="flex gap-1">
              {doraMarkers.map((marker, index) => {
                const result = getDoraFromIndicator(marker);
                if (result.isErr()) return undefined;
                return <Hai key={index} hai={result.value} size={haiSize} />;
              })}
            </div>
          </div>
          {question.isRiichi && question.uraDoraMarkers && (
            <div className="border-l border-surface-300 pl-4">
              <div className="mb-1 text-xs text-surface-500">
                {t("question.uraDora")}
              </div>
              <div className="flex gap-1">
                {question.uraDoraMarkers.map((marker, index) => {
                  const result = getDoraFromIndicator(marker);
                  if (result.isErr()) return undefined;
                  return (
                    <Hai key={`ura-${index}`} hai={result.value} size={haiSize} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
