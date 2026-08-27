"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MentsuType, resolveMentsuBreakdown } from "@mahjong-scoring/core";
import type {
  AgariContext,
  HaiKindId,
  MentsuBreakdownRow,
  Tehai,
} from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { TilesIcon } from "@/app/(user)/_components/icons/tiles-icon";

interface TehaiMentsuBreakdownProps {
  /** 分割する手牌（和了牌を含む14枚。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了状況。分割の解決（= 点数計算と同じ構造選択）に使う */
  readonly context: AgariContext;
}

/**
 * 面子・雀頭1つ分の行
 *
 * 牌の並びを左、種別ラベルを右に置く。面子の横幅は形により変わる
 * （順子3枚 〜 明槓の横牌入り4枚）ため、桁揃えは表の列幅に任せる。
 * 横向きの牌は縦に短いので下端で揃える。
 */
function BreakdownRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <tr className="bg-white">
      <td className="px-4 py-2">
        <div className="flex items-end">{children}</div>
      </td>
      <td className="px-4 py-2 text-right text-surface-600">{label}</td>
    </tr>
  );
}

/**
 * 手牌の中にある牌の並び
 *
 * 和了牌の位置にだけ枠を付ける。同じ牌種が複数の面子にあっても枠は
 * 1箇所で、どの面子を和了牌が完成させたのかが並びから読める。
 */
function ClosedTiles({
  hais,
  agariHaiIndex,
}: {
  readonly hais: readonly HaiKindId[];
  readonly agariHaiIndex?: number;
}) {
  return (
    <>
      {hais.map((kindId, i) => (
        <Hai key={i} hai={kindId} size="sm" highlighted={i === agariHaiIndex} />
      ))}
    </>
  );
}

/**
 * 手牌の面子・雀頭分解表示
 * 面子分解表示
 *
 * 結果の問題詳細で、理牌された手牌を「4面子1雀頭」に分けて見せる導線。
 * 右寄せの「面子分解」リンクを押すとモーダルで分解を開く。どの牌が
 * どの面子を構成するかが並びから読めるようになり、符・翻の内訳と
 * 手牌が結びつく。
 *
 * 分解は resolveMentsuBreakdown が返す、ライブラリが点数計算で採用した
 * 構造に基づく。面子分解は一意ではなく、独自に分解すると符内訳と
 * 食い違う分割を出しかねないため。変則手（七対子・国士無双）や
 * 分解を復元できない手牌では導線ごと何も描画しない。
 *
 * 牌の並べ方とラベルは手牌での見え方に揃える。副露と槓子は卓と同じく
 * 鳴き元の牌を倒して並べ（暗槓は両端が伏せ牌）、刻子・槓子のラベルは
 * 明暗を書き分ける。符内訳が「明刻子」と呼んでいる面子をここで単に
 * 「刻子」と出すと、同じ手牌の説明が2箇所で食い違って見える。
 *
 * 和了牌には枠を付ける。ツモ・ロンのどちらだったかは盤面が既に示して
 * いるので、モーダル側で言い直さない。
 *
 * 出題中の画面には置かないこと。待ちや符を問う練習では分解が答えを
 * 割ってしまう。正解を開示する文脈（結果詳細）専用。
 */
export function TehaiMentsuBreakdown({
  tehai,
  context,
}: TehaiMentsuBreakdownProps) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  const breakdown = useMemo(
    () => resolveMentsuBreakdown(tehai, context),
    [tehai, context],
  );

  if (!breakdown) return undefined;

  const mentsuLabel = (row: MentsuBreakdownRow): string => {
    switch (row.mentsu.type) {
      case MentsuType.Shuntsu:
        return t("shuntsu");
      case MentsuType.Koutsu:
        return row.isOpen ? t("minkou") : t("ankou");
      case MentsuType.Kantsu:
        return row.isOpen ? t("minkan") : t("ankan");
    }
  };

  /** 手牌の中にありながら明刻子として数える刻子（ロンで完成した刻子）を含むか */
  const hasRonMinkou = breakdown.fourMentsu.some(
    (row) => row.isOpen && !row.isExposed,
  );

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
        <div className="space-y-3">
          {/* 4面子を1行ずつ縦に積み、雀頭は最後に置く。面子から順に読ませ、
              残りが雀頭だと分かる並びにする */}
          <DataTable
            header={
              <>
                <DataTableHeaderCell align="left">
                  {t("mentsuBreakdownColHai")}
                </DataTableHeaderCell>
                <DataTableHeaderCell align="right">
                  {t("mentsuBreakdownColType")}
                </DataTableHeaderCell>
              </>
            }
          >
            {breakdown.fourMentsu.map((row, i) => (
              <BreakdownRow key={i} label={mentsuLabel(row)}>
                {row.isExposed ? (
                  <Furo mentsu={row.mentsu} furo={row.mentsu.furo} size="sm" />
                ) : (
                  <ClosedTiles
                    hais={row.mentsu.hais}
                    agariHaiIndex={row.agariHaiIndex}
                  />
                )}
              </BreakdownRow>
            ))}
            <BreakdownRow label={t("jantou")}>
              <ClosedTiles
                hais={breakdown.jantou.hais}
                agariHaiIndex={breakdown.jantou.agariHaiIndex}
              />
            </BreakdownRow>
          </DataTable>
          {hasRonMinkou && <p>{t("mentsuBreakdownMinkouNote")}</p>}
        </div>
      </InfoModal>
    </div>
  );
}
