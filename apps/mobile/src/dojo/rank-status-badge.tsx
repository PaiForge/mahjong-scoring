import { useTranslations } from "use-intl";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";

import { Chip, chipForeground, type ChipTone } from "../components/chip";
import { CheckIcon } from "../components/icons/icons";

/** 状態ごとのチップの配色（web の `STATUS_CLASSES`） */
const STATUS_TONES: Readonly<Record<RankStatus, ChipTone>> = {
  achieved: "success",
  next: "amber",
  unachieved: "neutral",
};

/**
 * 段級位の取得状態のチップ（取得済み / 次の目標 / 未取得。web の `RankStatusBadge`）
 * 段級位状態バッジ
 *
 * 状態は色だけでなく文字でも示す。「次の目標」の琥珀色はレッスンの目次の
 * 「次はここから」と同じ記号。
 */
export function RankStatusBadge({ status }: { readonly status: RankStatus }) {
  const t = useTranslations("dojo");
  const tone = STATUS_TONES[status];
  return (
    <Chip
      tone={tone}
      icon={
        status === "achieved" ? (
          <CheckIcon size={14} color={chipForeground(tone)} />
        ) : undefined
      }
    >
      {t(`status.${status}`)}
    </Chip>
  );
}
