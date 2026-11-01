import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getAdjacentChapters,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { LinkRow, LinkRowList } from "../../components/link-row";
import { isLessonPorted } from "../ported-lessons";

/**
 * 章末の「前のレッスン」（web の `ChapterNav` の前側）
 * 前のレッスンへのリンク
 *
 * 次のレッスンへは置き換えて移る（{@link import("./next-lesson-preview").NextLessonPreview}）
 * ので、ヘッダーの戻るは直前に読んだレッスンではなく学習を始めた画面（目次・
 * 道場・練習）へ帰る。読み返したい前のレッスンへは、ここから行く。
 *
 * ここへも置き換えで移る。iOS のナビゲーションスタックは階層を降りる仕組みで、
 * ヘッダーの戻るは「一つ上の階層へ」を意味する（ブラウザの「直前のページへ」
 * ではない）。目次 → レッスンは階層を降りるので積むが、レッスン同士は同じ
 * 階層の横移動なので積まない — 前後に何度行き来しても、戻る 1 回で目次へ帰る
 * （電子書籍アプリで章を送っても戻るが本棚へ帰るのと同じ）。レッスン同士も
 * 積む案は、戻るで前の章へ戻れる代わりに、読んだ章の数だけ戻るを押さないと
 * 目次へ帰れないため採らなかった。ヘッダーに前後の矢印を置く案は、ヘッダーの
 * 部品が増え、他の画面のヘッダーと形が割れるため採らなかった。
 *
 * web は前後の両方を常設するが、こちらは前だけを置く。次へは完了の後の
 * 「次のレッスン」（冒頭のプレビュー）が案内し、「本文 → 確認問題 → 完了 →
 * 次へ」の流れを崩さないため（常設の「次」は完了を経ずに読み飛ばす道になる。
 * 完了済みの章とコラムでは本文の下に初めから出る）。web の左右に並べた小さな
 * 文字ではなく行の形（{@link LinkRow}）にするのは、読みに行くだけの導線で、
 * ネイティブでは横並びの小さな文字の操作が押しにくいため。
 * 右端の矢印は iOS の一覧の「開く」の印で、向きは行き先の前後を表さない。
 *
 * 目次の順で最初のレッスン（とモバイル未移植の章の後ろ）では何も出さない。
 *
 * @param slug 現在の章
 */
export function PrevLessonLink({
  slug,
}: {
  readonly slug: CurriculumChapterSlug;
}) {
  const t = useTranslations("learnCurriculum");
  const router = useRouter();
  const { prev } = getAdjacentChapters(slug);
  if (prev === undefined || !isLessonPorted(prev.slug)) return undefined;

  return (
    <LinkRowList inset>
      <LinkRow
        onPress={() => router.replace(chapterHref(prev.slug))}
        title={t(`${getChapterI18nPath(prev)}.title`)}
        description={t("chapter.prevChapterLabel")}
        testID="prev-lesson-link"
      />
    </LinkRowList>
  );
}
