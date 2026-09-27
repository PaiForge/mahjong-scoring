import type { ReactNode } from "react";

import type { HaiKindId } from "@mahjong-scoring/core";

import { TehaiHand } from "./tehai-hand";

interface CardVisualBandProps {
  readonly children: ReactNode;
}

/**
 * カードの例示の帯（卓と同じ濃い緑の面）
 * 例示の帯の面
 *
 * 練習カードの帯（`PracticeCardVisual`）と広告カード（`NativeAdCard`）が
 * 同じ面を使う。練習一覧のグリッドに広告カードが混ざったとき、帯の色・
 * 高さ・角丸が 1 枚だけ違うと、そこだけ別の部品に見える。
 *
 * 高さは中身によらず固定で、手牌が入るカードとそうでないカードで帯の位置が
 * ずれない。
 *
 * 読み上げには載せない（カードの見出しが同じことを言っており、牌の名前を
 * 読み上げても情報は増えない）。
 */
export function CardVisualBand({ children }: CardVisualBandProps) {
  return (
    <div
      aria-hidden="true"
      className="mt-4 flex h-20 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-primary-800 px-3"
    >
      {children}
    </div>
  );
}

interface CardVisualHandProps {
  readonly tiles: readonly HaiKindId[];
}

/**
 * 帯に並べる手牌
 * 帯の手牌
 *
 * 手牌は出題盤面と同じ `TehaiHand` が描く（牌の出し方の単一実装）。
 * 幅いっぱいまで自動で縮むため、カードの幅が変わっても 14 枚が途切れない。
 * max-w は 14 枚の等倍幅で、これ以上大きくならないカード（ダッシュボードの
 * 1 枚表示）では中央に寄る。
 */
export function CardVisualHand({ tiles }: CardVisualHandProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <TehaiHand tehai={{ closed: tiles, exposed: [] }} />
    </div>
  );
}
