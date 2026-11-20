import { getTranslations } from "next-intl/server";

import type { PracticeProblem } from "@/lib/db";

import { InfoRow } from "../../users/[id]/_components/detail-section";
import { TileList } from "./tile-list";

/** 副露 1 つの見出し（保存形式の種類と鳴き元。チーと暗槓は鳴き元を持たない） */
function meldLabel(
  meld: PracticeProblem["payload"]["hand"]["exposed"][number],
): string {
  return "from" in meld ? `${meld.type} (${meld.from})` : meld.type;
}

/**
 * 報告された問題の盤面（管理画面用）
 * 問題の盤面
 *
 * 保存した盤面（`practice_problems.payload`）をそのまま牌で並べる。利用者向けの
 * 出題の部品（`QuestionDisplay`）は使わない — 管理画面からユーザー向けの部品を
 * import しない決まりで、ここでは見た目より「保存された値が何か」を読めればよい。
 * 和了形は和了牌とツモ / ロンも出し、聴牌形の待ち牌は正解の欄に出す。
 */
export async function ProblemBoard({
  payload,
}: {
  readonly payload: PracticeProblem["payload"];
}) {
  const t = await getTranslations("admin.problemReports.board");
  return (
    <dl>
      <InfoRow label={t("closed")}>
        <TileList hais={payload.hand.closed} />
      </InfoRow>
      <InfoRow label={t("exposed")}>
        {payload.hand.exposed.length === 0 ? (
          t("noExposed")
        ) : (
          <ul className="space-y-1">
            {payload.hand.exposed.map((meld, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <TileList hais={meld.hais} />
                <span className="font-mono text-xs text-surface-500">
                  {meldLabel(meld)}
                </span>
                {meld.type === "chi" && <TileList hais={[meld.nakiHai]} />}
              </li>
            ))}
          </ul>
        )}
      </InfoRow>
      {"agariHai" in payload && (
        <>
          <InfoRow label={t("agariHai")}>
            <TileList hais={[payload.agariHai]} />
          </InfoRow>
          <InfoRow label={t("winType")}>
            {payload.isTsumo ? t("tsumo") : t("ron")}
          </InfoRow>
        </>
      )}
      <InfoRow label={t("dora")}>
        <TileList hais={payload.doraMarkers} />
      </InfoRow>
      <InfoRow label={t("riichi")}>
        {payload.riichi ? t("riichiYes") : t("riichiNo")}
      </InfoRow>
      {payload.riichi && (
        <InfoRow label={t("uraDora")}>
          <TileList hais={payload.riichi.uraDoraMarkers} />
        </InfoRow>
      )}
      <InfoRow label={t("bakaze")}>
        <TileList hais={[payload.bakaze]} />
      </InfoRow>
      <InfoRow label={t("jikaze")}>
        <TileList hais={[payload.jikaze]} />
      </InfoRow>
    </dl>
  );
}
