import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
  isPracticeMenuType,
} from "@/lib/db/practice-menu-types";

/**
 * マイレコードが扱わない練習種別（昇級試験）
 * 対象外種別
 *
 * 昇級試験は同じ問題を繰り返して数字を伸ばす類のものではなく、成果は
 * 段級位が表す。推移・平均・全履歴という「反復のための道具」に混ぜない。
 * ランキングから外したのと同じ理由。
 *
 * 試験の走行はそもそも記録されない（`savePracticeResult` が入口で弾き、
 * 採点は `submitExamResult` が行う）ので、この除外は読み出し側の二重の
 * 安全装置。過去の仕様で残った行があっても表に出さない。
 *
 * 配列を readonly にしないのは drizzle の `notInArray` が可変配列しか
 * 受け取らないため。
 */
export const EXCLUDED_MENU_TYPES: PracticeMenuType[] =
  PRACTICE_MENU_TYPES.filter(isExamMenuType);

/**
 * マイレコードが扱う練習種別かを判定する型ガード
 * マイレコード対象判定
 *
 * DB を引かないため、クエリ・ページ・Server Action・クライアントの
 * セレクタのどこからでも同じ判定を使える。
 */
export function isMyRecordMenuType(value: string): value is PracticeMenuType {
  return isPracticeMenuType(value) && !isExamMenuType(value);
}
