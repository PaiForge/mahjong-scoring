/**
 * size="sm" の牌の高さ（px）
 * 小牌高さ
 *
 * @pai-forge/mahjong-react-ui の `sm` の寸法（web は globals.css の
 * `.h-hai-sm` に同じ値を持つ）。
 */
export const HAI_SM_HEIGHT = 45;

/**
 * size="sm" の牌の幅（px）
 * 小牌幅
 *
 * web は globals.css の `.w-hai-sm` に同じ値を持つ。
 */
export const HAI_SM_WIDTH = 32;

/**
 * 和了牌を純手牌から離す間隔（px）
 * 和了牌間隔
 *
 * web は `ml-4`、モバイルは `marginLeft` でこの間隔を空ける。
 */
export const AGARI_HAI_GAP = 16;

/**
 * 行の高さの基準にする手の自然幅（px）
 * 基準手牌幅
 *
 * 門前の 13 枚に間隔を空けて和了牌を置いた、最も普通の並び。行の高さは
 * この幅が収まる倍率で決め、鳴きが多くてこれより広い手はその高さの中で
 * さらに縮める。状況行（ドラ等）も同じ基準で高さを決め、手牌と行の高さの
 * 関係を一定に保つ。web とモバイルの手牌が同じ倍率で縮むようここに置く。
 */
export const REFERENCE_HAND_WIDTH =
  13 * HAI_SM_WIDTH + AGARI_HAI_GAP + HAI_SM_WIDTH;
