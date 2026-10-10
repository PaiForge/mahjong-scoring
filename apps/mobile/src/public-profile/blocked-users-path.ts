/**
 * 設定の「ブロックしたユーザー」のパス（アプリだけの子ページ）
 *
 * web は設定ページの中の 1 節（`BlockedUsersSection`）だが、アプリの設定は
 * 節が多く一覧を入れると長くなるので、役の並び順と同じく子ページに分ける。
 * web に同じページは無いので `features/routes.ts` には置かない。
 */
export const BLOCKED_USERS_PATH = "/preferences/blocked-users";
