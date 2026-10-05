import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { linkStyles } from "../../lib/link-styles";
import { isLessonPorted } from "../ported-lessons";

/**
 * 本文の中のテキストリンク（web の `TEXT_LINK_CLASSES` = グレー + 常時下線）
 * 本文リンク
 *
 * 段落（`<Text>`）の中に埋めるため、`Pressable` ではなく入れ子の `<Text>` の
 * `onPress` で押させる。
 */
export function InlineTextLink({
  onPress,
  children,
}: {
  readonly onPress: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Text accessibilityRole="link" onPress={onPress} style={styles.link}>
      {children}
    </Text>
  );
}

/**
 * 別の章へのテキストリンク（web の `ChapterLink`）
 * 章リンク
 *
 * 表示する文字はカリキュラムの章タイトルを引く（本文の辞書に章名を書き写さない）。
 * 本文中では `t.rich(..., { link: () => <ChapterLink slug="..." /> })` の形で埋める。
 * モバイルに未移植の章は押せないので、章名を素の文字で出す。
 */
export function ChapterLink({
  slug,
}: {
  readonly slug: CurriculumChapterSlug;
}) {
  const t = useTranslations("learnCurriculum");
  const router = useRouter();
  const chapter = getChapterBySlug(slug);
  const title = chapter ? t(`${getChapterI18nPath(chapter)}.title`) : slug;
  // モバイルで開けない章は、章名だけを本文として残す
  if (!isLessonPorted(slug)) return title;
  return (
    <InlineTextLink onPress={() => router.push(chapterHref(slug))}>
      {title}
    </InlineTextLink>
  );
}

/**
 * `t.rich` の `<br></br>` を改行にする
 *
 * web は `<br />` を返す。React Native の `<Text>` では改行文字がそのまま改行になる。
 */
export const richLineBreak = (): string => "\n";

const styles = StyleSheet.create({
  link: linkStyles.inline,
});
