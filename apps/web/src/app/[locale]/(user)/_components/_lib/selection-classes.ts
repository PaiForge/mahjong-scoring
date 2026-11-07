/**
 * 選択中のタイルの見た目
 * 選択中配色
 *
 * 練習の設定（出題設定のタイル）・待ち牌の選択・通報の理由など、
 * 「並んだ中から今どれを選んでいるか」を示す枠と塗り。選択中は墨の枠と
 * 内側のリング（塗りだけに頼らない）で示し、緑を使わない — 緑の塗りは
 * 主操作（押して始める面）の記号で、選んだだけのタイルが緑になると
 * 「押せば始まる」「正解した」と読めてしまう（色の役割は `globals.css`）。
 *
 * 枠の形・余白は持たないので、各タイルの class に足して使う。
 */
export const SELECTED_TILE_CLASSES =
  "border-selected bg-selected-subtle ring-1 ring-inset ring-selected";

/** 選んでいないタイル。hover は灰で、押せることだけを示す */
export const UNSELECTED_TILE_CLASSES =
  "border-surface-300 bg-white hover:border-surface-400 hover:bg-surface-50";
