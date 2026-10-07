import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
  type PracticeLink,
} from "@mahjong-scoring/features/curriculum/registry";
import { relatedPracticeLinks } from "@mahjong-scoring/features/lessons/registry";

import { SectionTitle } from "../../components/section-title";
import { ExamCtaCard } from "../../dojo/exam-cta-card";
import { PracticeCard } from "../../practice/components/practice-card";

/**
 * レッスンの本文の後に出す、練習への導線（web の `ChapterRelatedLinks`）
 * レッスン関連リンク
 *
 * 確認問題を持つレッスンでは完了画面の末尾（と完了済みの人が開いた本文の
 * 下）に、持たないレッスンでは完了ボタンの下に出す。送り先は確認問題を
 * 持つレッスンならレジストリの `practiceLinks`、持たないレッスンなら章の
 * `practiceLinks`。
 *
 * カードは練習一覧と同じ {@link PracticeCard}。試験を持つ章では、その下に
 * 昇級試験の案内（{@link ExamCtaCard}。行き先は試験の説明画面と模試）を置く。
 *
 * web が出す総合演習の絞り込み（カタログ外の練習）へのボタンと広告はモバイルに
 * 出さない — 総合演習は URL の絞り込み（`?yaku=` 等）を受け取らない。練習も
 * 試験も無い章（基礎のセクション）では何も出さない。
 *
 * @param slug レッスン（章）の slug
 * @param exclude 完了画面の次の一歩と同じ練習（重ねて出さない）
 */
export function ChapterRelatedLinks({
  slug,
  exclude,
}: {
  readonly slug: CurriculumChapterSlug;
  readonly exclude?: PracticeLink;
}) {
  const t = useTranslations("lessons.related");
  const links = relatedPracticeLinks(slug).filter(
    (link) =>
      exclude === undefined ||
      link.slug !== exclude.slug ||
      link.variant !== exclude.variant,
  );
  const examSlug = getChapterBySlug(slug)?.examSlug;
  if (links.length === 0 && examSlug === undefined) return undefined;

  return (
    <>
      {links.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("practiceTitle")}</SectionTitle>
          <View style={styles.list}>
            {links.map((link) => (
              <PracticeCard
                key={`${link.slug}:${link.variant ?? ""}`}
                slug={link.slug}
                variant={link.variant}
              />
            ))}
          </View>
        </View>
      )}
      {examSlug !== undefined && <ExamCtaCard slug={examSlug} />}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  list: {
    gap: 16,
  },
});
