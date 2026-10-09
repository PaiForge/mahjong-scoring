"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "use-intl";
import { resolveMentsuBreakdowns } from "@mahjong-scoring/core";
import type {
  MentsuBreakdownCandidate,
  MentsuBreakdownContext,
  MentsuBreakdownRow,
  Tehai,
} from "@mahjong-scoring/core";

import { orderFuHan, type FuHanOrder } from "../settings/fu-han-order";
import { mentsuBreakdownLabelKey } from "./mentsu-breakdown";

/** {@link useMentsuBreakdown} の戻り値 */
export interface MentsuBreakdownModel {
  /** 解釈の候補（高点法の順）。分解を復元できない手では空 */
  readonly candidates: readonly MentsuBreakdownCandidate[];
  /** 表示中の解釈。未選択なら先頭。候補が無ければ undefined */
  readonly selected: MentsuBreakdownCandidate | undefined;
  readonly select: (key: string) => void;
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  /** 面子の行の種別名（順子・明刻・暗刻・明槓・暗槓） */
  readonly mentsuLabel: (row: MentsuBreakdownRow) => string;
  /** 候補の切り替えに出す「30符 2翻」。並びは表示設定に従う */
  readonly fuHanLabel: (candidate: MentsuBreakdownCandidate) => string;
}

/**
 * 面子分解のモーダルの状態と文言
 * 面子分解モデル
 *
 * web とモバイルの `TehaiMentsuBreakdown` が共有する。分解は点数計算と同じ
 * 解釈（`resolveMentsuBreakdowns`）から取り、開閉と選んだ候補を持つ。描画
 * （バッジの見た目・表）は各アプリが持つ。
 *
 * @param fuHanOrder - 符と翻の並び。表示設定のストアはアプリごとにあるので呼び出し側が渡す
 */
export function useMentsuBreakdown(
  tehai: Pick<Tehai, "closed" | "exposed">,
  context: MentsuBreakdownContext,
  fuHanOrder: FuHanOrder,
): MentsuBreakdownModel {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const candidates = useMemo(
    () => resolveMentsuBreakdowns(tehai, context),
    [tehai, context],
  );
  const selected =
    candidates.find((c) => c.key === selectedKey) ?? candidates[0];

  return {
    candidates,
    selected,
    select: setSelectedKey,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    mentsuLabel: (row) => t(mentsuBreakdownLabelKey(row)),
    fuHanLabel: (candidate) =>
      orderFuHan(fuHanOrder, {
        fu: t("mentsuBreakdownCandidateFu", { fu: candidate.fu }),
        han: t("mentsuBreakdownCandidateHan", { han: candidate.han }),
      }).join(" "),
  };
}
