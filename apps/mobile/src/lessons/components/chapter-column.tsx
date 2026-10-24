import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { GuideColumn } from "./highlight-panel";
import { InlineTextLink, richLineBreak } from "./chapter-link";
import { GuideNote, GuideParagraph } from "./guide-text";
import {
  preferencesItemHref,
  type PreferenceAnchor,
} from "@mahjong-scoring/features/settings/preference-anchors";

/**
 * 章末のコラム（web の `ChapterColumn`）
 * 章末コラム
 *
 * 章の辞書が `columnLabel` / `columnTitle` / `columnBody` を持つ前提で、
 * ラベル・見出し・本文 1 段落を組み立てる。段落を 2 つ以上持つ章は
 * {@link GuideColumn} を直接使う。
 *
 * @param namespace 章の辞書の名前空間（`<camelCase(slug)>.learn`）
 */
export function ChapterColumn({
  namespace,
  children,
}: {
  readonly namespace: string;
  readonly children?: ReactNode;
}) {
  const t = useTranslations(namespace);
  return (
    <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
      <GuideParagraph>
        {t.rich("columnBody", { br: richLineBreak })}
      </GuideParagraph>
      {children}
    </GuideColumn>
  );
}

/**
 * 設定で切り替えられるルールの注記（web の `PreferenceSettingsNote`）
 * 設定誘導注記
 *
 * 章の辞書が `columnSettingsNote`（`<settingsLink>` を含む）を持つ前提。
 * 設定画面の該当項目まで送る（web のアンカーと同じ項目）。
 *
 * @param namespace 章の辞書の名前空間
 * @param anchor 注記が指す設定の項目
 */
export function PreferenceSettingsNote({
  namespace,
  anchor,
}: {
  readonly namespace: string;
  readonly anchor: PreferenceAnchor;
}) {
  const t = useTranslations(namespace);
  const router = useRouter();
  return (
    <GuideNote>
      {t.rich("columnSettingsNote", {
        settingsLink: (chunks) => (
          <InlineTextLink
            onPress={() => router.navigate(preferencesItemHref(anchor))}
          >
            {chunks}
          </InlineTextLink>
        ),
      })}
    </GuideNote>
  );
}
