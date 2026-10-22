import type { ReactNode } from "react";
import { useLocalSearchParams } from "expo-router";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

import type { PracticeScreens } from "../practice-screens";
import { practiceScreensFor } from "../registry";
import { practiceSlugFromBasePath } from "../route-slug";
import { PracticeNotFoundScreen } from "./not-found-screen";

interface PracticeMenuRouteProps {
  /** パスの動的セグメントの名前（`[slug]` なら "slug"） */
  readonly param: string;
  /** レジストリの `basePath` の接頭辞（`/practice` / `/exam`） */
  readonly basePathPrefix: string;
  /** 引けた練習をこのルートで描いてよいか（練習と試験の振り分け） */
  readonly accept: (slug: PracticeMenuSlug) => boolean;
  readonly render: (
    slug: PracticeMenuSlug,
    screens: PracticeScreens,
  ) => ReactNode;
}

/**
 * 動的セグメントからレジストリの練習を引いて画面を描く
 * 練習メニュールート
 *
 * パスのセグメントをレジストリの `basePath` と突き合わせ、モバイルに盤面が
 * あって `accept` が通れば `render` に渡す。未知の名前・未移植・`accept` が
 * 落とした練習は「見つからない」。練習（`/practice/[slug]`）と昇級試験
 * （`/exam/[exam]`）のルートが接頭辞と振り分けだけを変えて使う。
 */
export function PracticeMenuRoute({
  param,
  basePathPrefix,
  accept,
  render,
}: PracticeMenuRouteProps) {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const value = params[param];
  const slug =
    typeof value === "string"
      ? practiceSlugFromBasePath(`${basePathPrefix}/${value}`)
      : undefined;
  const screens = slug === undefined ? undefined : practiceScreensFor(slug);
  if (slug === undefined || screens === undefined || !accept(slug)) {
    return <PracticeNotFoundScreen />;
  }
  return render(slug, screens);
}
