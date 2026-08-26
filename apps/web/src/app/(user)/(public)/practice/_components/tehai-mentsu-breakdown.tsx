"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MentsuType, resolveMentsuStructure } from "@mahjong-scoring/core";
import type { AgariContext, HaiKindId, Tehai } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { TilesIcon } from "@/app/(user)/_components/icons/tiles-icon";

interface TehaiMentsuBreakdownProps {
  /** 分割する手牌（和了牌を含む14枚。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了状況。分割の解決（= 点数計算と同じ構造選択）に使う */
  readonly context: AgariContext;
}

/** 牌グループ1つ（面子 or 雀頭）とその種別ラベル */
function TileGroup({
  hais,
  label,
}: {
  readonly hais: readonly HaiKindId[];
  readonly label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex">
        {hais.map((kindId, i) => (
          <Hai key={i} hai={kindId} size="sm" />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * 手牌の面子・雀頭分割表示
 * 面子分解表示
 *
 * 結果の問題詳細で、理牌された手牌を「4面子1雀頭」に分けて見せる導線。
 * 右寄せの「面子分解」リンクを押すとモーダルで分割を開く。どの牌が
 * どの面子を構成するかが並びから読めるようになり、符・翻の内訳と
 * 手牌が結びつく。
 *
 * 分割はライブラリが点数計算で採用した構造（ScoreDetail.structure）を
 * resolveMentsuStructure で引く。面子分解は一意ではなく、独自に分解すると
 * 符内訳と食い違う分割を出しかねないため。変則手（七対子・国士無双）や
 * 分割を復元できない手牌では導線ごと何も描画しない。
 *
 * 出題中の画面には置かないこと。待ちや符を問う練習では分割が答えを
 * 割ってしまう。正解を開示する文脈（結果詳細）専用。
 */
export function TehaiMentsuBreakdown({
  tehai,
  context,
}: TehaiMentsuBreakdownProps) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  const structure = useMemo(
    () => resolveMentsuStructure(tehai, context),
    [tehai, context],
  );

  if (!structure) return undefined;

  const mentsuLabels: Record<string, string> = {
    [MentsuType.Shuntsu]: t("shuntsu"),
    [MentsuType.Koutsu]: t("koutsu"),
    [MentsuType.Kantsu]: t("kantsu"),
  };

  return (
    <div className="flex justify-end">
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 text-sm ${TEXT_LINK_CLASSES}`}
        onClick={() => setIsOpen(true)}
      >
        <TilesIcon className="size-4 shrink-0" />
        {t("mentsuBreakdown")}
      </button>
      <InfoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("mentsuBreakdown")}
        closeLabel={t("close")}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {structure.fourMentsu.map((mentsu, i) => (
            <TileGroup
              key={i}
              hais={mentsu.hais}
              label={mentsuLabels[mentsu.type] ?? ""}
            />
          ))}
          <TileGroup hais={structure.jantou.hais} label={t("jantou")} />
        </div>
      </InfoModal>
    </div>
  );
}
