import { compareNumbers } from "@mahjong-scoring/core";

import {
  isPracticeMenuType,
  type PracticeMenuType,
} from "../practice-menu-types";

/**
 * 1 日の経験値の練習種別ごとの内訳
 * 経験値内訳
 */
export interface ExpBreakdown {
  /** 名前を出せる練習種別の行（経験値の多い順） */
  readonly rows: readonly {
    readonly menuType: PracticeMenuType;
    readonly exp: number;
  }[];
  /**
   * レジストリに無い種別の経験値の合計（無ければ 0）。画面は「その他」の
   * 1 行として内訳の末尾に出す
   */
  readonly otherExp: number;
}

/**
 * 練習種別ごとの経験値を、画面に並べる内訳に組み立てる
 * 経験値内訳組み立て
 *
 * レジストリに無い種別も落とさず「その他」に合算する。内訳は日の合計の
 * 分解なので、行を落とすと和が合計と食い違い、利用者には不具合に見える。
 * 無い種別が届く経路は 2 つある:
 *
 * - ストアに出ているアプリが、自分より新しいサーバーから増えた練習を受け取る
 *   （アプリ向け API は知らない種別も落とさずに返す）
 * - `exp_events.menu_type` が NULL の行（集計で `"unknown"` になる）。今は
 *   チャレンジの付与しか書かないので出ないが、列は練習に結び付かない付与の
 *   ために nullable にしてある
 *
 * キー（`[?] new_menu` のような印）は出さない — 古い版のアプリの利用者には
 * 直す手段が無く、辞書の抜けは i18n の整合テストが落とす。
 *
 * @param expByMenuType - 練習種別（menuType）→ 経験値
 */
export function buildExpBreakdown(
  expByMenuType: Readonly<Record<string, number>>,
): ExpBreakdown {
  const entries = Object.entries(expByMenuType);
  const rows = entries
    .flatMap(([menuType, exp]) =>
      isPracticeMenuType(menuType) ? [{ menuType, exp }] : [],
    )
    .sort((a, b) => compareNumbers(b.exp, a.exp));
  const otherExp = entries
    .filter(([menuType]) => !isPracticeMenuType(menuType))
    .reduce((total, [, exp]) => total + exp, 0);
  return { rows, otherExp };
}
