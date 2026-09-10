import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
  isPracticeMenuType,
  isPracticeVariant,
  practiceMenuByType,
} from "@/lib/db/practice-menu-types";

import type { RecordBoard } from "./types";

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

/**
 * マイレコードが扱う土俵かを判定する
 * マイレコード土俵判定
 *
 * 練習種別が対象で、かつバリアントがその練習の列挙にあるか。Server Action は
 * 任意の値で呼べるため、他の練習のバリアント名を名乗った土俵はここで弾く。
 */
export function isMyRecordBoard(board: RecordBoard): boolean {
  return (
    isMyRecordMenuType(board.menuType) &&
    isPracticeVariant(board.menuType, board.variant)
  );
}

/**
 * DB の DISTINCT 行からマイレコードの土俵一覧を組み立てる
 * 土俵一覧組み立て
 *
 * `menu_type` / `leaderboard_key` は varchar なので、レジストリから外れた行
 * （消した練習・消したバリアント・昇級試験）は読み飛ばす。並びは練習一覧と
 * 同じ（レジストリの練習順 → バリアントの列挙順）。DB の DISTINCT は順序を
 * 持たないため、ここで揃える。
 *
 * @param rows - 土俵ごとに 1 行の DISTINCT 結果
 */
export function toRecordBoards(
  rows: readonly {
    readonly menuType: string;
    readonly leaderboardKey: string;
  }[],
): RecordBoard[] {
  const boards = rows.flatMap((row) => {
    if (!isPracticeMenuType(row.menuType)) return [];
    const board: RecordBoard = {
      menuType: row.menuType,
      variant: row.leaderboardKey,
    };
    return isMyRecordBoard(board) ? [board] : [];
  });

  const order = (board: RecordBoard): number =>
    PRACTICE_MENU_TYPES.indexOf(board.menuType) * 100 +
    practiceMenuByType(board.menuType).variants.indexOf(board.variant);
  return boards.toSorted((a, b) => order(a) - order(b));
}
