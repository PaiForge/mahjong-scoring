import {
  DOJO_PATH,
  LESSONS_PATH,
  PRACTICE_PATH,
  PREFERENCES_PATH,
  REFERENCE_PATH,
} from "@mahjong-scoring/features/routes";

/** 点数表のタブ（参照ページの入口） */
const SCORE_TABLE_TAB_PATH = "/score-table";

/**
 * 戻る履歴が無いときの戻り先
 * 戻り先の既定
 *
 * ディープリンクやアプリの再起動で画面を直接開くと、スタックに下の画面が
 * 無い。そのときヘッダーの戻るは、その画面を開く入口のタブ（一覧）へ
 * 送る。どこから開いても練習一覧へ送ると、レッスンを読んでいた人が
 * 練習のタブに落ちる。
 *
 * - レッスン → レッスンの目次
 * - 道場・級の詳細・昇級試験 → 道場
 * - 参照（役一覧・用語）→ 参照の入口、参照の入口 → 点数表のタブ
 * - 設定の下のページ → 設定、設定 → ホーム
 * - アカウント（ログイン・登録・ユーザー名の設定・退会）→ 設定（入口が設定の
 *   アカウントの節のため）
 * - それ以外（練習）→ 練習一覧
 *
 * @param pathname 今の画面のパス（`usePathname()`）
 */
export function backFallbackHref(pathname: string): string {
  const [section, child] = pathname.split("/").filter(Boolean);
  switch (section) {
    case "lessons":
      return LESSONS_PATH;
    case "dojo":
    case "exam":
      return DOJO_PATH;
    case "reference":
      return child === undefined ? SCORE_TABLE_TAB_PATH : REFERENCE_PATH;
    case "preferences":
      return child === undefined ? "/" : PREFERENCES_PATH;
    case "sign-in":
    case "sign-up":
    case "mypage":
      return PREFERENCES_PATH;
    default:
      return PRACTICE_PATH;
  }
}
