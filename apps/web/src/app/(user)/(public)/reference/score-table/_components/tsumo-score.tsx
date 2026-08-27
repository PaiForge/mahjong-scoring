"use client";

import type { TsumoPayment } from "@mahjong-scoring/core";

/**
 * ツモ点数の2段表示
 * ツモ点数表示
 *
 * 符×翻の表は狭い画面（特にモーダル）で1行に「400/700」を収めきれず、
 * 折り返すと数字が2行に割れて読めなくなる。そこで縦に積むことを前提にし、
 * 子ツモは区切り線で分数のように上段＝子から・下段＝親からを示し、
 * 親ツモは点数の下に小さく ALL を添える（∀ は初見で意味が取れないため）。
 * 上下が何を指すかは表の上の凡例が受け持つ。
 */
export function TsumoScore({ payment }: { readonly payment: TsumoPayment }) {
  if (payment.type === "koTsumo") {
    return (
      <span className="inline-flex flex-col items-stretch leading-tight">
        <span>{payment.fromKo}</span>
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
      <span className="text-[0.625rem] font-bold opacity-60">ALL</span>
    </span>
  );
}
