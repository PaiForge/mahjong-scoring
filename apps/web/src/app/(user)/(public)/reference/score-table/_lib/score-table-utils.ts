import { isRole, isWinType } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";

interface BuildHighlightCellIdParams {
  readonly role: string | null;
  readonly winType: string | null;
  readonly han: string | null;
  readonly fu: string | null;
}

/**
 * クエリパラメータからハイライト対象セルのIDを組み立てる
 * ハイライトセルID生成
 */
export function buildHighlightCellId(
  params: BuildHighlightCellIdParams,
): string | undefined {
  const resolvedRole: Role =
    params.role !== null && isRole(params.role) ? params.role : "ko";
  const resolvedWinType: WinType =
    params.winType !== null && isWinType(params.winType)
      ? params.winType
      : "ron";

  if (params.han !== null && params.fu !== null) {
    return `${resolvedRole}-${resolvedWinType}-${params.han}han-${params.fu}fu`;
  }
  return undefined;
}
