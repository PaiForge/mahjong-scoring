"use client";

import type { TsumoPayment } from "@mahjong-scoring/core";
import { useTranslations } from "next-intl";

/**
 * ツモ点数の2段表示
 * ツモ点数表示
 *
 * 符×翻の表は狭い画面（特にモーダル）で1行に「400/700」を収めきれず、
 * 折り返すと数字が2行に割れて読めなくなる。そこで縦に積むことを前提にし、
 * 子ツモは区切り線で分数のように上段＝子から・下段＝親からを示し、
 * 親ツモは点数の下に小さく「オール」を添える。
 * 上下が何を指すかは表の上の凡例が受け持つ。
 *
 * 「オール」は辞書（`scoreTable.all`）から引く。練習の回答・答え合わせ
 * （`formatScoreAnswer`）と教本の本文が親ツモを「オール」と呼ぶので、表だけ
 * 別の語にしない。点数表によくある「∀」は初見で意味が取れず、英字の「ALL」は
 * 回答で見る語と一致しないうえ辞書を迂回する（以前は ALL を直書きしていたが、
 * 10px の「オール」は 1 列 70px の表に収まり、幅の理由も無かった）。
 * アプリ（`apps/mobile`）の同名コンポーネントも同じ理由で同じキーを引く。
 */
export function TsumoScore({
  payment,
  dimFromKo = false,
}: {
  readonly payment: TsumoPayment;
  /**
   * 子ツモの上段（子が出す額）を落として、下段だけを前に出すか。
   *
   * 「下段の数字がそのまま親ツモになる」ことを教本が図で指すときに使う。
   * 表記そのものを図の側で組み直すと、読者が実際に読む点数表と別の形に
   * なってしまうため、強調はこのコンポーネントの側で受ける。
   */
  readonly dimFromKo?: boolean;
}) {
  const t = useTranslations("scoreTable");
  if (payment.type === "koTsumo") {
    return (
      <span className="inline-flex flex-col items-stretch leading-tight">
        <span className={dimFromKo ? "opacity-40" : undefined}>
          {payment.fromKo}
        </span>
        {/* 区切り線は装飾なので、読み上げには元の「/」表記を残す */}
        <span className="sr-only">/</span>
        <span aria-hidden className="my-0.5 h-px bg-current opacity-30" />
        <span>{payment.fromOya}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-center leading-tight">
      <span>{payment.all}</span>
      <span className="text-[0.625rem] font-bold opacity-60">{t("all")}</span>
    </span>
  );
}
