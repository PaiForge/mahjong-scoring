import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

import { TileSet } from "@/app/(user)/_components/tile-set";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

/** カードに載せる例示 1 件 */
interface CardVisual {
  /** 手の内に並べる牌 */
  readonly tiles: readonly HaiKindId[];
  /**
   * 和了牌。待ちの練習だけが持つ。待ちは「どの形にどの牌が来たか」で
   * 決まるため、手の内と分けて描かないと形が読めない。
   */
  readonly agariHai?: HaiKindId;
}

/**
 * 練習カードの例示牌 — 練習名を 1 つの具体例で言い直したもの
 * カードの例示牌
 *
 * @description
 * 「雀頭の符計算」と読むより中中の 2 枚を見る方が速い、という 1 行の説明を
 * 牌で置き換える。全練習には付けない — 手牌 1 つでは何を問われるか伝わらない
 * 練習（合計符・点数計算）に無理に付けると、盤面の縮小版が並ぶだけで
 * カード同士の区別が付かなくなる。持たない練習は何も描かない。
 *
 * 例に選ぶのはその練習の代表形 1 つだけで、符の値は載せない。ここは答えを
 * 教える場所ではなく、練習の対象が何かを見せる場所。
 */
const PRACTICE_CARD_VISUALS: Partial<Record<PracticeMenuSlug, CardVisual>> = {
  // 雀頭 = 同じ牌 2 枚。役牌の対子を出す（符が付く側の代表）
  "jantou-fu": { tiles: [HaiKind.Chun, HaiKind.Chun] },
  // 嵌張待ち。5 種の待ちのうち、手の内と和了牌の関係が最も一目で分かる形
  "machi-fu": {
    tiles: [HaiKind.SouZu3, HaiKind.SouZu5],
    agariHai: HaiKind.SouZu4,
  },
  // 幺九牌の暗刻。同じ牌 3 枚で、雀頭の 2 枚と枚数で見分けが付く
  "mentsu-fu": {
    tiles: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1],
  },
};

interface PracticeCardVisualProps {
  readonly slug: PracticeMenuSlug;
}

/**
 * 練習カードの例示牌の帯
 * 例示牌の帯
 *
 * 例示を持たない練習では何も描かない（カードの高さが揃わないが、
 * 空の帯を置くと「例示が出るはずの場所が空いている」ように見える）。
 *
 * 卓と同じ濃い緑を敷くのは、この帯が実際の出題盤面の一部と同じものだと
 * 見せるため。牌は読み上げには載せない（練習名と説明文が同じことを
 * 言っており、牌の名前を並べても情報は増えない）。
 */
export function PracticeCardVisual({ slug }: PracticeCardVisualProps) {
  const visual = PRACTICE_CARD_VISUALS[slug];
  if (visual === undefined) return undefined;

  return (
    <div
      aria-hidden="true"
      className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary-800 px-3 py-2"
    >
      <TileSet tiles={visual.tiles} />
      {visual.agariHai !== undefined && (
        <>
          <span className="text-sm text-white/80">+</span>
          <TileSet tiles={[visual.agariHai]} />
        </>
      )}
    </div>
  );
}
