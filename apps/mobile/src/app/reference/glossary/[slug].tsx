import { useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from "react-native";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";
import {
  isMentsuExample,
  type GlossaryTermExample,
} from "@mahjong-scoring/features/glossary/types";
import {
  glossaryTermViewBySlug,
  glossaryTermViews,
  type GlossaryTermView,
} from "@mahjong-scoring/features/glossary/views";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { NativeAdCard } from "../../../ads/native-ad-card";
import { useNativeAds } from "../../../ads/use-native-ads";
import { LinkRow, LinkRowList } from "../../../components/link-row";
import { SectionTitle } from "../../../components/section-title";
import {
  SheetScreen,
  useReturnToIndex,
} from "../../../components/sheet-screen";
import { TextLink } from "../../../components/text-link";
import { useOpenFromModal } from "../../../hooks/use-open-from-modal";
import { colors } from "../../../lib/theme";
import { ExampleCard } from "../../../lessons/components/example-card";
import { MentsuSet, TileSet } from "../../../lessons/components/tile-row";
import { TermLinkList } from "../../../reference/term-link-list";

/** 7 枚以上並べる例（面子手・七対子など）は 1 段小さい牌にする（web と同じ） */
const MANY_TILES_THRESHOLD = 7;

/**
 * 用語
 *
 * @description
 * 用語 1 語の説明（web の `/reference/glossary/<slug>`）: 定義と読み → 具体例の
 * 牌 → 点数計算での扱い・具体例で見る・よくある誤解 → 関連する用語 → その語を
 * 扱うレッスン。高さを選べるシート（`SheetScreen`）で出し、開いた場所の上で
 * 読んで閉じる。
 *
 * 「関連する用語」はシートを積まず、params の slug を替えて同じシートの中身を
 * 差し替え、先頭へ戻す（語をたどるたびにシートが重なり、閉じるのに同じ数だけ
 * 引き下げることになるため）。「この語を扱うレッスン」はシートを閉じてから
 * レッスンを積む（`useOpenFromModal`。シートの後に積んだ通常の画面は iOS では
 * シートの下に入って見えない）。
 *
 * @flow
 * 用語集の一覧・関連する用語・レッスン本文の用語のシートから開く。
 */
export default function GlossaryTermScreen() {
  const t = useTranslations("glossary");
  const tCurriculum = useTranslations("learnCurriculum");
  const router = useRouter();
  const openFromModal = useOpenFromModal();
  const returnToIndex = useReturnToIndex();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.glossaryTerm);
  const translate = (key: string) => t(key);
  const term =
    typeof slug === "string"
      ? glossaryTermViewBySlug(slug, translate)
      : undefined;

  if (term === undefined) {
    return (
      <SheetScreen title={t("title")}>
        <TextLink onPress={() => returnToIndex(GLOSSARY_PATH)}>
          {t("backToIndex")}
        </TextLink>
      </SheetScreen>
    );
  }

  // 関連語は辞書にあるものだけ出す
  const allTerms = glossaryTermViews(translate);
  const related = (term.related ?? [])
    .map((relatedSlug) => allTerms.find((other) => other.slug === relatedSlug))
    .filter((other) => other !== undefined);
  const learnSlugs = term.learnSlugs ?? [];

  const openRelated = (other: GlossaryTermView) => {
    router.setParams({ slug: other.slug });
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SheetScreen
      title={term.term}
      ref={scrollRef}
      contentStyle={styles.content}
    >
      <View style={styles.section}>
        <SectionTitle>{t("definitionTitle")}</SectionTitle>
        <Text style={styles.reading}>
          {t("readingLabel")}: {term.reading}
        </Text>
        <Text style={styles.body}>{term.definition}</Text>
      </View>

      {term.examples !== undefined && term.examples.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("examplesTitle")}</SectionTitle>
          {term.examples.map((example, index) => (
            <TermExample key={index} example={example} />
          ))}
        </View>
      )}

      <TermSection title={t("usageTitle")} body={term.usage} />
      <TermSection title={t("caseStudyTitle")} body={term.caseStudy} />
      <TermSection title={t("pitfallTitle")} body={term.pitfall} />

      {/* 語の説明を読み終えた後、関連する用語の前（web と同じ） */}
      {ad !== undefined && <NativeAdCard creative={ad} />}

      {related.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("relatedTitle")}</SectionTitle>
          <TermLinkList terms={related} onOpen={openRelated} />
        </View>
      )}

      {learnSlugs.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("learnTitle")}</SectionTitle>
          <LinkRowList>
            {learnSlugs.map((chapterSlug) => {
              const chapter = getChapterBySlug(chapterSlug);
              if (chapter === undefined) return undefined;
              const path = getChapterI18nPath(chapter);
              return (
                <LinkRow
                  key={chapterSlug}
                  onPress={() => openFromModal(chapterHref(chapterSlug))}
                  title={tCurriculum(`${path}.title`)}
                  description={tCurriculum(`${path}.description`)}
                />
              );
            })}
          </LinkRowList>
        </View>
      )}

      {/* 用語集の一覧から開いたならシートを閉じて一覧へ戻り、それ以外
          （レッスン本文の用語のシート等）からは一覧を開く */}
      <TextLink onPress={() => returnToIndex(GLOSSARY_PATH)}>
        {t("backToIndex")}
      </TextLink>
    </SheetScreen>
  );
}

/**
 * 用語の例示牌 1 組（web の `TermExamples` の 1 枚）
 *
 * 狭い画面に収まらない並びは横にスクロールさせる。注記は牌が何であるかを
 * 補うもので、定義の言い換えは置かない。
 */
function TermExample({ example }: { readonly example: GlossaryTermExample }) {
  const t = useTranslations("glossary");
  return (
    <ExampleCard gap={8}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {isMentsuExample(example) ? (
          <MentsuSet mentsu={example.mentsu} />
        ) : (
          <TileSet
            tiles={example.tiles}
            size={example.tiles.length >= MANY_TILES_THRESHOLD ? "xs" : "sm"}
          />
        )}
      </ScrollView>
      {example.captionKey !== undefined && (
        <Text style={styles.caption}>
          {t(`captions.${example.captionKey}`)}
        </Text>
      )}
    </ExampleCard>
  );
}

/** 本文 1 節。改行（`\n`）で段落を分ける（web の `TermSection`） */
function TermSection({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {body.split("\n").map((paragraph, index) => (
        <Text key={index} style={styles.body}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  section: {
    gap: 16,
  },
  reading: {
    fontSize: 14,
    color: colors.surface400,
  },
  body: {
    fontSize: 15,
    lineHeight: 26,
    color: colors.surface700,
  },
  caption: {
    fontSize: 13,
    color: colors.surface500,
  },
});
