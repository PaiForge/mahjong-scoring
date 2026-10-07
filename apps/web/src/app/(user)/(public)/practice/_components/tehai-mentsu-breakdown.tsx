"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { resolveMentsuBreakdowns } from "@mahjong-scoring/core";
import type {
  HaiKindId,
  MentsuBreakdownCandidate,
  MentsuBreakdownContext,
  MentsuBreakdownRow,
  Tehai,
} from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { ReferenceLinkButton } from "./reference-link-button";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { ToggleGroup } from "@/app/(user)/_components/toggle-group";
import { TilesIcon } from "@/app/(user)/_components/icons/tiles-icon";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import { orderFuHan } from "@mahjong-scoring/features/settings/fu-han-order";
import {
  hasRonMinkou,
  mentsuBreakdownLabelKey,
} from "@mahjong-scoring/features/board/mentsu-breakdown";

interface TehaiMentsuBreakdownProps {
  /** 分割する手牌（和了牌を含む14枚。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /**
   * 和了状況。分割の解決（= 点数計算と同じ構造選択）に使う。
   * 出題がドラ表示牌を持つならそれも渡す（候補の順位を採点と揃えるため）
   */
  readonly context: MentsuBreakdownContext;
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
 * 右寄せの「面子分解」リンク（{@link ReferenceLinkButton}。答え合わせの表の
 * 「点数表を確認」等と同じ補助リンクの姿）を押すとモーダルで分解を開く。
 * どの牌がどの面子を構成するかが並びから読めるようになり、符・翻の内訳と
 * 手牌が結びつく。
 *
 * 置き場所は手牌の直下が基本（和了形の点数計算）。手牌そのものの分け方
 * なので、手牌から離すほど何を分けたのかが読みにくい。聴牌形の点数計算だけは
 * 手牌の直下に置けない — 分解は和了牌と和了方法で決まり、同じ聴牌形でも
 * 待ちごとに完成形が違うため、上に出ている 13 枚の聴牌形には 1 つの分解が
 * 対応しない。あちらは選んだマスのタブと地続きのパネルの末尾、そのマスの
 * 答え合わせの表の直下に置く（パネルの一部として、どの和了形の分解かが
 * 選んだタブから分かる。タブと表の間に挟むとつながりが 1 行ぶん切れる）。
 * 2 画面で位置が違うのは揃え忘れではなくこの制約による。
 *
 * トレーニング・模試の答え合わせ（盤面が止まっている間）では盤面の末尾、
 * 符・翻の内訳の直上に置く。手牌からは離れるが、開示の瞬間に回答欄や
 * 選択肢を動かさないことを優先する — 押したばかりのボタンとその下が
 * 動くのが最も目立つ。並びは結果ページの問題詳細と同じ「面子分解 →
 * 内訳」に揃える。
 *
 * リンクのタップ領域は 1 行ぶん（`hitArea="row"`）取る。表の外で 1 行を
 * 占め、すぐ下に翻数・符の内訳の開閉行と「次の問題へ」が続くため、文字の
 * 高さだけでは隣の行やボタンに指が流れる（{@link import("./collapsible-detail").CollapsibleDetail} と同じ理由）。
 *
 * 分解は resolveMentsuBreakdowns が返す、ライブラリが点数計算で評価した
 * 和了解釈に基づく。面子分解は一意ではなく（さらに同じ分解でも和了牌を
 * どのブロックに入れたかで待ち・明暗が変わる）、独自に分解すると符内訳と
 * 食い違う分割を出しかねないため。変則手（七対子・国士無双）や
 * 分解を復元できない手牌では導線ごと何も描画しない。
 *
 * 解釈が複数ある手では、候補を高点法の順にタブで並べて切り替えられる。
 * 最も高い点数になる解釈には「最高点」のバッジを付け、同じ点数の解釈には
 * 同じバッジを付ける — 高点法では同順位で、先頭だけが正解ではないため。
 * バッジは文字で、絵文字（⭐）にしない。絵文字は OS ごとに別の絵になり、
 * 印の意味を文章で補う必要が出る。文字のバッジなら凡例が要らない。
 * タブの文言は「30符 2翻」のように符と翻で、並び順は表示設定に従う。
 * 解釈が 1 つしか無い手ではタブを出さず、従来どおり表だけを出す。
 *
 * 牌の並べ方とラベルは手牌での見え方に揃える。副露と槓子は卓と同じく
 * 鳴き元の牌を倒して並べ（暗槓は両端が伏せ牌）、刻子・槓子のラベルは
 * 明暗を書き分ける。符内訳が「明刻子」と呼んでいる面子をここで単に
 * 「刻子」と出すと、同じ手牌の説明が2箇所で食い違って見える。
 *
 * 和了牌には枠を付ける。ツモ・ロンのどちらだったかは盤面が既に示して
 * いるので、モーダル側で言い直さない。
 *
 * 回答を受け付けている間は置かないこと。待ちや符を問う練習では分解が
 * 答えを割ってしまう。出すのは正解を開示する文脈（結果の問題詳細と、
 * トレーニング・模試で止まっている間）に限る。
 */
export function TehaiMentsuBreakdown({
  tehai,
  context,
}: TehaiMentsuBreakdownProps) {
  const t = useTranslations("common");
  const fuHanOrder = useFuHanOrder();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  const candidates = useMemo(
    () => resolveMentsuBreakdowns(tehai, context),
    [tehai, context],
  );

  const selected =
    candidates.find((c) => c.key === selectedKey) ?? candidates[0];
  if (selected === undefined) return undefined;

  const mentsuLabel = (row: MentsuBreakdownRow): string =>
    t(mentsuBreakdownLabelKey(row));

  const candidateLabel = (candidate: MentsuBreakdownCandidate) => {
    const fuHan = orderFuHan(fuHanOrder, {
      fu: t("mentsuBreakdownCandidateFu", { fu: candidate.fu }),
      han: t("mentsuBreakdownCandidateHan", { han: candidate.han }),
    }).join(" ");
    if (!candidate.isBest) return fuHan;
    // バッジは枠と文字を currentColor で描き、選択中（緑地に白）と未選択
    // （淡い地に濃い文字）のどちらでも読めるようにする
    return (
      <span className="inline-flex items-center gap-1">
        {fuHan}
        <span className="rounded-full border border-current px-1.5 text-[10px] leading-4">
          {t("mentsuBreakdownBest")}
        </span>
      </span>
    );
  };

  const { breakdown } = selected;
  const showsCandidateTabs = candidates.length > 1;
  const showsRonMinkouNote = hasRonMinkou(breakdown.fourMentsu);

  return (
    <div className="flex justify-end">
      <ReferenceLinkButton
        hitArea="row"
        icon={<TilesIcon className="size-3.5 shrink-0" />}
        label={t("mentsuBreakdown")}
        onClick={() => setIsOpen(true)}
      />
      <InfoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("mentsuBreakdown")}
        closeLabel={t("close")}
      >
        <div className="space-y-3">
          {showsCandidateTabs && (
            /* 候補は高点法の順。横に収まらない数になることは稀だが、
               端末幅で折り返さず横に流す */
            <div className="overflow-x-auto">
              <ToggleGroup
                options={candidates.map((c) => ({
                  value: c.key,
                  label: candidateLabel(c),
                }))}
                selected={selected.key}
                onChange={setSelectedKey}
              />
            </div>
          )}
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
          {showsRonMinkouNote && <p>{t("mentsuBreakdownMinkouNote")}</p>}
        </div>
      </InfoModal>
    </div>
  );
}
