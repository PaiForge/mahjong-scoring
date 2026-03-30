import { getHaiName } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

export function HaiLabel({ haiKindId }: { haiKindId: HaiKindId }) {
  const name = getHaiName(haiKindId);
  return <span className="text-lg font-bold text-surface-900">{name}</span>;
}
