/**
 * ユーザー詳細の節の id（ページ内リンクの飛び先）
 * 詳細の節 id
 *
 * 一覧の「プラン」列のチップが `/admin/users/<id>#<節>` で購入・付与の節へ飛ぶ。
 * 節の側（`user-detail-sections.tsx`）とリンクの側が同じ文字列を読むためここに置く。
 */
export const USER_DETAIL_SECTION_IDS = {
  purchases: "purchases",
  grants: "grants",
} as const;
