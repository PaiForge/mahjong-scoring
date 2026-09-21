"use server";

import { isCurriculumChapterSlug } from "../_lib/curriculum";
import { isChapterRead } from "../_lib/progress";

/**
 * 章の読了状態を返す Server Action。
 * 章読了状態取得
 *
 * 章ページは静的生成なので、ユーザーごとの読了状態はページに焼き込めない。
 * クライアント側（`ChapterReadStatus`）がログイン確認後にこれを呼んで
 * 読了トグルの初期値を得る。未認証・不正な slug は false。
 *
 * @param slug 対象章のスラッグ
 */
export async function getChapterReadState(slug: string): Promise<boolean> {
  if (!isCurriculumChapterSlug(slug)) return false;
  return isChapterRead(slug);
}
