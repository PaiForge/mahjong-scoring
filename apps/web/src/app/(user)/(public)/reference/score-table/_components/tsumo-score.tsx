"use client";

import type { TsumoPayment } from "@mahjong-scoring/core";

/**
 * ツモ点数の2段表示（子ツモは「子 / 親」、親ツモはオール表記）
 * ツモ点数表示
 */
export function TsumoScore({ payment }: { readonly payment: TsumoPayment }) {
  if (payment.type === "koTsumo") {
    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{payment.fromKo} /</span>
        <span>{payment.fromOya}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center leading-tight">
      <span>
        {payment.all}
        {"∀"}
      </span>
    </div>
  );
}
