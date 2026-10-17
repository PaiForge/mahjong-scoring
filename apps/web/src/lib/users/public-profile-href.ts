/**
 * ユーザーの公開プロフィールのパス（`/u/<username>`）
 * 公開プロフィールパス
 *
 * ユーザー名は登録時の規則で英小文字・数字・`_` に限られ、エンコードしても
 * 今の値は変わらない。規則が緩んだときに各所のリンクが一斉に壊れないよう、
 * パスを組むのはここだけにしてエンコードを通す。
 *
 * 公開プロフィールは web だけにある（アプリは他の利用者を見せない。
 * `apps/mobile/CLAUDE.md`）ので、両プラットフォームの遷移先を置く
 * `@mahjong-scoring/features/routes` ではなくここに置く。
 *
 * @param username - 公開プロフィールを開くユーザーのユーザー名
 */
export function publicProfileHref(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}
