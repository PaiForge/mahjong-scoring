/** 並べ替えの方向 */
export type MoveDirection = "up" | "down";

/**
 * スロット内で 1 つ上下へ動かした後の並び
 * 広告並べ替え
 *
 * 端を越えて動かすときは undefined（何もしない）。返す並びの添字が
 * そのまま新しい `sort_order` になる — 既存の値に重複や飛びがあっても、
 * 1 回動かせば 0 からの連番に揃う。
 *
 * @param ids スロットの広告 id（現在の並び順）
 * @param id 動かす広告
 */
export function moveInOrder(
  ids: readonly string[],
  id: string,
  direction: MoveDirection,
): string[] | undefined {
  const index = ids.indexOf(id);
  if (index === -1) return undefined;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return undefined;
  const next = [...ids];
  next[index] = ids[target];
  next[target] = id;
  return next;
}
