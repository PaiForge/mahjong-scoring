import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { GuideColumn } from "./highlight-panel";
import { InlineTextLink, richLineBreak } from "./chapter-link";
import { GuideNote, GuideParagraph } from "./guide-text";

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

/** 設定画面（タブ）のパス */
const PREFERENCES_PATH = "/preferences";

/**
 * 設定で切り替えられるルールの注記（web の `PreferenceSettingsNote`）
 * 設定誘導注記
 *
 * 章の辞書が `columnSettingsNote`（`<settingsLink>` を含む）を持つ前提。
 * web は設定ページの該当項目へアンカーで着地させるが、モバイルの設定タブは
 * 項目へのアンカーを持たないので、設定タブを開くだけにする。
 *
 * @param namespace 章の辞書の名前空間
 */
export function PreferenceSettingsNote({
  namespace,
}: {
  readonly namespace: string;
}) {
  const t = useTranslations(namespace);
  const router = useRouter();
  return (
    <GuideNote>
      {t.rich("columnSettingsNote", {
        settingsLink: (chunks) => (
          <InlineTextLink onPress={() => router.navigate(PREFERENCES_PATH)}>
            {chunks}
          </InlineTextLink>
        ),
      })}
    </GuideNote>
  );
}
