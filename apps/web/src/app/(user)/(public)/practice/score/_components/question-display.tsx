"use client";

import { useMemo, useState } from "react";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";
import { MentsuType, isOya } from "@mahjong-scoring/core";
import type { HaiKindId, Kazehai, Tehai } from "@mahjong-scoring/core";
import { getKazeName } from "@mahjong-scoring/core";
import { useResponsiveHaiSize } from "../../_hooks/use-responsive-hai-size";
import { useTranslations } from "next-intl";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { useDoraDisplayMode } from "@/app/_hooks/use-display-settings-store";
import { resolveDoraTiles } from "@/app/_lib/dora-display";
import { splitAgariHai } from "../../../_lib/agari-hai";

/**
 * 手牌表示に必要な出題データの表示専用サブセット
 * 出題表示データ
 *
 * `ScoreQuestion` はこの型を構造的に満たすためそのまま渡せる。別型に
 * している理由は結果ページでの再表示: sessionStorage から復元した出題は
 * ブランド型（Tehai14）と正解データ（answer）を持たないが、描画には
 * どちらも不要なため、描画が実際に読む形だけをここで要求する。
 */
export interface ScoreQuestionDisplayData {
  /** 手牌（和了牌を含む。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了牌 */
  readonly agariHai: HaiKindId;
  /** ツモ和了かどうか */
  readonly isTsumo: boolean;
  /** 自風 */
  readonly jikaze: Kazehai;
  /** 場風 */
  readonly bakaze: Kazehai;
  /**
   * ドラ表示牌
   *
   * 表示牌のまま出すか、ドラそのものへ読み替えて出すかは表示設定で決まる。
   */
  readonly doraMarkers: readonly HaiKindId[];
  /** リーチ有無 */
  readonly isRiichi?: boolean;
  /** 裏ドラ表示牌 */
  readonly uraDoraMarkers?: readonly HaiKindId[];
}

interface QuestionDisplayProps {
  readonly question: ScoreQuestionDisplayData;
  /**
   * 牌サイズの固定指定。省略時は画面幅に応じた自動サイズ。
   * モーダル等、ビューポートより狭い枠に収めたい場合に明示する。
   */
  readonly size?: HaiSize;
}

/**
 * 手牌・状況表示コンポーネント
 * 問題表示
 */
export function QuestionDisplay({ question, size }: QuestionDisplayProps) {
  const t = useTranslations("score");
  const tCommon = useTranslations("common");
  const { tehai, agariHai, isTsumo, jikaze, bakaze, doraMarkers } = question;
  const oya = isOya(jikaze);
  const responsiveHaiSize = useResponsiveHaiSize();
  const haiSize = size ?? responsiveHaiSize;
  const [showDoraInfo, setShowDoraInfo] = useState(false);
  const doraDisplay = useDoraDisplayMode();
  const isIndicator = doraDisplay === "indicator";

  const doraTiles = useMemo(
    () => resolveDoraTiles(doraMarkers, doraDisplay),
    [doraMarkers, doraDisplay],
  );
  const uraDoraTiles = useMemo(
    () => resolveDoraTiles(question.uraDoraMarkers ?? [], doraDisplay),
    [question.uraDoraMarkers, doraDisplay],
  );

  const { closedTiles, separatedAgariHai } = useMemo(
    () => splitAgariHai(tehai.closed, agariHai),
    [tehai.closed, agariHai],
  );

  const kantsuList = useMemo(
    () => tehai.exposed.filter((m) => m.type === MentsuType.Kantsu),
    [tehai.exposed],
  );
  const otherFuroList = useMemo(
    () => tehai.exposed.filter((m) => m.type !== MentsuType.Kantsu),
    [tehai.exposed],
  );

  return (
    <div className="space-y-6">
      {/* Hand display */}
      <div className="rounded-lg bg-primary-800 p-2">
        {/* Wind info */}
        <div className="mb-4 flex items-center justify-center gap-4 text-sm text-white">
          <div>
            {getKazeName(bakaze)}
            {t("question.round")} {getKazeName(jikaze)}
            {t("question.wind")}
            {oya ? (
              <span className="ml-2 text-yellow-300">
                {t("question.dealer")}
              </span>
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
            {closedTiles.map((kindId, index) => (
              <Hai key={index} hai={kindId} size={haiSize} />
            ))}
          </div>

          {/* Agari hai (separated to the right, as it is shown on a real table) */}
          {separatedAgariHai !== undefined && (
            <div
              className={`flex shrink-0 ${haiSize === "xs" ? "ml-2" : "ml-4"}`}
            >
              <Hai hai={separatedAgariHai} size={haiSize} />
            </div>
          )}

          {/* Other furo (bottom right) */}
          {otherFuroList.length > 0 && (
            <div
              className={`flex shrink-0 ${haiSize === "xs" ? "ml-4" : "ml-8"}`}
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
        {/* Tsumo/Ron (the agari hai itself is shown at the right of the hand) */}
        <div className="rounded-lg bg-surface-100 p-3">
          <div className="mb-1 text-xs text-surface-500">
            {t("question.win")}
          </div>
          <span className="text-xs font-bold">
            {isTsumo ? t("question.tsumo") : t("question.ron")}
          </span>
        </div>

        {/* Dora & ura dora */}
        <div className="flex gap-4 rounded-lg bg-surface-100 p-3">
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-surface-500">
              {tCommon(isIndicator ? "doraIndicator" : "dora")}
              <button
                type="button"
                onClick={() => setShowDoraInfo(true)}
                className="inline-flex size-4 items-center justify-center rounded-full text-[10px] text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600"
                aria-label={tCommon("showDetailInfo")}
              >
                ?
              </button>
            </div>
            {/* ドラは「1 + 槓子数」枚あるため、槓の入った手では 1 行に収まらない。
                折り返してセルからはみ出させない */}
            <div className="flex flex-wrap gap-1">
              {doraTiles.map((tile, index) => (
                <Hai key={index} hai={tile} size={haiSize} />
              ))}
            </div>
          </div>
          {question.isRiichi && uraDoraTiles.length > 0 && (
            <div className="border-l-4 border-ink pl-4">
              <div className="mb-1 text-xs text-surface-500">
                {tCommon(isIndicator ? "uraDoraIndicator" : "uraDora")}
              </div>
              <div className="flex flex-wrap gap-1">
                {uraDoraTiles.map((tile, index) => (
                  <Hai key={`ura-${index}`} hai={tile} size={haiSize} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <InfoModal
        isOpen={showDoraInfo}
        onClose={() => setShowDoraInfo(false)}
        title={t("question.doraInfoTitle")}
        closeLabel={tCommon("close")}
      >
        <p className="whitespace-pre-line">
          {t(
            isIndicator
              ? "question.doraInfoIndicator"
              : "question.doraInfoActual",
          )}
        </p>
      </InfoModal>
    </div>
  );
}
