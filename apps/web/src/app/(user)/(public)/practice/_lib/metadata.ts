import type { Metadata } from "next";

import {
  createNamespaceMetadata,
  createTitleOnlyMetadata,
} from "@/app/_lib/metadata";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

import { practiceHref } from "./practice-catalog";

/**
 * play / training / result 用の robots 指定。
 *
 * canonical を「付けない」だけでは検索から除外されない。これらのページは
 * intro と同一タイトルのまま crawl 可能で、Google が canonical を持たない側を
 * クラスタ代表に選ぶと intro が検索結果から落ちる。index はさせず、
 * intro への内部リンクは辿らせるため follow は残す。
 */
const PRACTICE_SUBPAGE_ROBOTS = { index: false, follow: true } as const;

/**
 * 練習の説明ページ（`/practice/<slug>`）の metadata を生成する。
 * 練習メタデータ生成
 *
 * canonical を持つのは説明ページだけ。play / result / training は
 * 検索結果に載せないため、このヘルパーを使わない。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu"）
 * @param slug - 練習のスラッグ（canonical の組み立てに使う）
 */
export async function createPracticeMetadata(
  namespace: string,
  slug: PracticeMenuSlug,
): Promise<Metadata> {
  return createNamespaceMetadata(namespace, { path: practiceHref(slug) });
}

/**
 * 練習のプレイページ（`/practice/<slug>/play` 等）の metadata を生成する。
 * プレイページメタデータ生成
 *
 * タイトルのみ + noindex。説明ページ（canonical を持つ側）と検索結果で
 * 競合させないための指定で、play ページはすべてこれを使うこと。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu"）
 */
export async function createPracticePlayMetadata(
  namespace: string,
): Promise<Metadata> {
  return {
    ...(await createTitleOnlyMetadata(namespace)),
    robots: PRACTICE_SUBPAGE_ROBOTS,
  };
}

/**
 * 練習のトレーニングページ（`/practice/<slug>/training`）の metadata を生成する。
 * トレーニングページメタデータ生成
 *
 * タイトル + 説明 + noindex。training ページはすべてこれを使うこと。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu"）
 */
export async function createPracticeTrainingMetadata(
  namespace: string,
): Promise<Metadata> {
  return {
    ...(await createNamespaceMetadata(namespace)),
    robots: PRACTICE_SUBPAGE_ROBOTS,
  };
}
