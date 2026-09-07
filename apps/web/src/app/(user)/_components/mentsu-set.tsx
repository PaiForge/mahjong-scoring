"use client";

import { Furo } from "@pai-forge/mahjong-react-ui";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";
import type { CompletedMentsu } from "@mahjong-scoring/core";

interface MentsuSetProps {
  readonly mentsu: CompletedMentsu;
  /** 牌の大きさ。並べる枚数が多く表の幅を圧迫する章では小さくする */
  readonly size?: HaiSize;
}

/**
 * 例示に並べる面子
 * 例示面子
 *
 * 卓上では、鳴いて作った面子は 1 枚を横向きに置き、暗槓は両端を伏せて置く。
 * これが明刻と暗刻・明槓と暗槓を見分ける唯一の目印で、牌を裸で並べただけの
 * 中張牌の刻子は明暗の区別が付かない。どちらの並びになるかは面子そのものが
 * 持つ情報（鳴いたのか、誰から鳴いたのか）から決まるので、位置を呼び出し側が
 * 指定する {@link TileSet} ではなく、面子を受け取る `Furo` に決めさせる。
 * 出題の盤面と同じ描画になり、教本で見た形がそのまま問題に出る。
 *
 * `Furo` は "use client" を要するため、サーバーコンポーネント（教本の章）から
 * 面子のセルだけを切り出して差し込めるようにする。
 */
export function MentsuSet({ mentsu, size = "sm" }: MentsuSetProps) {
  return <Furo mentsu={mentsu} furo={mentsu.furo} size={size} />;
}
