import { GLOSSARY_PATH } from "../glossary/routes";
import { REFERENCE_YAKU_PATH } from "../routes";

/** 早見表 1 つ（辞書のキー `reference.<key>.{title,description}` と同じ文字列） */
export type ReferenceKey = "scoreTable" | "yaku" | "glossary";

/** 早見表の下に並べるほかの早見表 1 つ */
export interface RelatedReference {
  readonly key: ReferenceKey;
  readonly href: string;
}

/** 早見表の並び（web の早見表の一覧と同じ順） */
const REFERENCE_KEYS: readonly ReferenceKey[] = [
  "scoreTable",
  "yaku",
  "glossary",
];

/**
 * 早見表の下に並べるほかの早見表（自分を除く）
 * 関連早見表
 *
 * 点数表・役一覧・用語集は互いの下に行で並べ、どこから来ても残りの 2 つへ
 * 移れるようにする。アプリは早見表の一覧の画面を持たず（ハンバーガー
 * メニューも置かない）、役一覧・用語集はレッスンやお知らせからも直接
 * 開かれるので、点数表からの片道だけだとそこから先へ進めない。web は
 * 一覧（`/reference`）をパンくずとハンバーガーメニューにも残すが、行は
 * アプリと揃える。
 *
 * 以前のアプリはヘッダーの虫眼鏡から早見表の一覧へ進ませていたが、
 * 虫眼鏡は検索と読まれ、一覧の先頭の「点数表」は元のタブへ戻るだけだった。
 *
 * @param current - 今いる早見表
 * @param scoreTableHref - 点数表のパス（web は `/reference/score-table`、
 * アプリはタブの `/score-table` で置き場所が違う）
 */
export function relatedReferences(
  current: ReferenceKey,
  scoreTableHref: string,
): readonly RelatedReference[] {
  const hrefs: Readonly<Record<ReferenceKey, string>> = {
    scoreTable: scoreTableHref,
    yaku: REFERENCE_YAKU_PATH,
    glossary: GLOSSARY_PATH,
  };
  return REFERENCE_KEYS.filter((key) => key !== current).map((key) => ({
    key,
    href: hrefs[key],
  }));
}
