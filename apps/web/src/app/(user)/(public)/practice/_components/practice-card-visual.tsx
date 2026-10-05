import {
  CardVisualBand,
  CardVisualHand,
} from "@/app/(user)/(public)/_components/card-visual-band";
import { TileSet } from "@/app/(user)/_components/tile-set";

import type {
  PracticeCardVisual as CardVisual,
  ResolvedSubject,
} from "@mahjong-scoring/features/practice/card-visual";
import { FuHanExampleLabel } from "./fu-han-example-label";

interface PracticeCardVisualProps {
  readonly visual: CardVisual;
}

/**
 * 練習カードの例示の帯
 * 例示の帯
 *
 * `出題で見えるもの` の下に `答えの単位` を置く。何をどう例示するかは
 * `practiceCardVisual` が決め、ここは受け取ったものを並べるだけ。
 *
 * 卓と同じ濃い緑（`CardVisualBand`）を敷くのは、この帯が出題盤面の縮図だと
 * 見せるため。読み上げには載せない（練習名が同じことを言っており、牌の名前や
 * 「符は？」を読み上げても情報は増えない）。
 */
export function PracticeCardVisual({ visual }: PracticeCardVisualProps) {
  return (
    <CardVisualBand>
      <SubjectContent subject={visual.subject} />
      <span className="flex items-center gap-1.5">
        {visual.note !== undefined && <VisualPill label={visual.note} />}
        <span className="text-xs font-bold text-white">{visual.unitLabel}</span>
      </span>
    </CardVisualBand>
  );
}

/**
 * 出題があらかじめ示している値のピル（鳴き・翻数）
 *
 * 琥珀色は出題盤面が同じ役割で使っている色（`YakuHanPrompt` の鳴きバッジ、
 * 満貫以上の役一覧）。手牌や選択肢ではなく「前提として与えられているもの」の色。
 */
function VisualPill({ label }: { readonly label: string }) {
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      {label}
    </span>
  );
}

/** 帯の上段 */
function SubjectContent({ subject }: { readonly subject: ResolvedSubject }) {
  if (subject.kind === "hand") {
    return <CardVisualHand tiles={subject.tiles} />;
  }

  if (subject.kind === "fuHan") {
    return <FuHanExampleLabel fu={subject.fu} han={subject.han} />;
  }

  if (subject.kind === "labels") {
    return (
      <span className="flex items-center gap-1.5">
        {subject.pill !== undefined && <VisualPill label={subject.pill} />}
        <span className="text-sm font-bold text-white">{subject.text}</span>
      </span>
    );
  }

  const size = subject.size ?? "sm";
  return (
    <span className="flex items-center gap-1.5">
      {/* まとまりの間は牌と牌の間より広く空ける。面子と雀頭が 1 続きの
          5 枚に見えると、要素ごとに答える練習だと読めない */}
      <span className="flex items-center gap-3">
        {subject.groups.map((group, i) => (
          <TileSet key={i} tiles={group} size={size} />
        ))}
      </span>
      {subject.agariHai !== undefined && (
        <>
          <span className="text-sm text-white/80">+</span>
          <TileSet tiles={[subject.agariHai]} size={size} />
        </>
      )}
    </span>
  );
}
