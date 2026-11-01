import { GLOSSARY_PATH } from "../glossary/routes";
import { REFERENCE_YAKU_PATH } from "../routes";

/** 点数表の下に並べる早見表 1 つ */
export interface RelatedReference {
  /** 辞書のキー（`reference.<key>.{title,description}`） */
  readonly key: "yaku" | "glossary";
  readonly href: string;
}

/**
 * 点数表の下に並べるほかの早見表
 * 関連早見表
 *
 * 点数表は早見表の中でいちばん引かれるので、web・アプリともタブバーは
 * 早見表の一覧ではなく点数表へ直接飛ぶ。そのため点数表に来た人は役一覧・
 * 用語集があることに気付きにくい。表の下に行で並べて、目に見える入口にする。
 * 以前のアプリはヘッダーの虫眼鏡から早見表の一覧へ進ませていたが、虫眼鏡は
 * 検索と読まれ、一覧の先頭の「点数表」は元のタブへ戻るだけだった。web は
 * 一覧（`/reference`）をハンバーガーメニューとパンくずの行き先として残す。
 */
export const RELATED_REFERENCES: readonly RelatedReference[] = [
  { key: "yaku", href: REFERENCE_YAKU_PATH },
  { key: "glossary", href: GLOSSARY_PATH },
];
