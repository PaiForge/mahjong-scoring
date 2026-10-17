"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Role, WinType } from "@mahjong-scoring/core";
import type { ScoreTableViewMode } from "@mahjong-scoring/features/score-table/score-grid";

import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { ReferenceLinkButton } from "@/app/(user)/_components/reference-link-button";
import { ScoreTableModal } from "@/app/(user)/(public)/reference/score-table/_components/score-table-modal";

interface ScoreTableReferenceLinkProps {
  /** 開いたときの親子のタブ。直前の表と同じ親子にそろえる */
  readonly role: Role;
  /** 開いたときのロンツモのタブ。直前の表と同じ和了にそろえる */
  readonly winType: WinType;
  /** 開いたときの表示モード（満貫以上の表の下では `high_score`） */
  readonly viewMode?: ScoreTableViewMode;
}

/**
 * 教本の点数表の右下に添える、点数早見表を開くリンク
 * 点数早見表リンク
 *
 * 章の表は早見表から数行・数列を抜き出したものなので、「全体のどこに
 * あたるか」を本文を離れずに確かめられるよう、早見表をモーダルで開く。
 * ページ遷移にすると読んでいた位置を失う。タブは直前の表と同じ親子・
 * ロンツモに合わせ、探す手間を省く。ハイライトは付けない — 章の表は
 * 1 セルではなく行や列の並びを見せているため、指す 1 セルが無い。
 *
 * 姿と文言は練習の答え合わせの「点数表を確認」と同じ補助リンク
 * （{@link ReferenceLinkButton}）にそろえる。同じ早見表が開く導線を、
 * 画面ごとに別の見た目で覚えさせない。表の右下に置くのは、表を読み
 * 終えた視線の終点だから。
 */
export function ScoreTableReferenceLink({
  role,
  winType,
  viewMode,
}: ScoreTableReferenceLinkProps) {
  const t = useTranslations("scoreTable");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <ReferenceLinkButton
        icon={<TableIcon className="size-3.5 shrink-0" />}
        label={t("viewScoreTable")}
        onClick={() => setIsOpen(true)}
      />
      <ScoreTableModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tab={{ role, winType, viewMode }}
      />
    </div>
  );
}
