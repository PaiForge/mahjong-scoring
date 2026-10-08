/** 要素をどこに合わせるか（web の `scrollIntoView` の `block`） */
export type ScrollBlock = "center" | "start" | "nearest";

/** 上端・下端に合わせるとき、枠の端との間に残す余白 */
export const SCROLL_EDGE_MARGIN = 12;

/**
 * 要素を見せるためのスクロール位置
 * スクロール先の計算
 *
 * - `center` — 要素の縦の中央を枠の中央へ
 * - `start` — 要素の上端を枠の上端の少し下へ（開いたばかりの長い中身を
 *   見出しから読ませるとき）
 * - `nearest` — 要素がすでに収まっていれば動かさない（`undefined`）。
 *   下にはみ出していれば下端を枠の下端の少し上へ、上にはみ出していれば
 *   上端を枠の上端へ。押した直後に出る操作を、読んでいる位置を崩さずに
 *   見せるとき
 *
 * @param block 合わせ方
 * @param target 中身の先頭からの要素の位置と高さ
 * @param viewportHeight 枠の見えている高さ
 * @param scrollY 今のスクロール位置
 * @returns 移るべき位置（0 未満は 0）。動かさないなら `undefined`
 */
export function scrollTargetY(
  block: ScrollBlock,
  target: { readonly y: number; readonly height: number },
  viewportHeight: number,
  scrollY: number,
): number | undefined {
  const { y, height } = target;
  switch (block) {
    case "center":
      return Math.max(0, y + height / 2 - viewportHeight / 2);
    case "start":
      return Math.max(0, y - SCROLL_EDGE_MARGIN);
    case "nearest": {
      const bottom = y + height + SCROLL_EDGE_MARGIN - viewportHeight;
      if (bottom > scrollY) {
        // 下にはみ出す。要素が枠より高いなら上端を優先する
        return Math.max(0, Math.min(bottom, y - SCROLL_EDGE_MARGIN));
      }
      if (y - SCROLL_EDGE_MARGIN < scrollY) {
        return Math.max(0, y - SCROLL_EDGE_MARGIN);
      }
      return undefined;
    }
  }
}
