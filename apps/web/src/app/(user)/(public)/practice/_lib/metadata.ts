import type { Metadata } from "next";

import {
  createNamespaceMetadata,
  createTitleOnlyMetadata,
} from "@/app/_lib/metadata";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";

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
 * 辞書ネームスペースはレジストリ（practice-menu-types.ts）の `namespace`
 * から引く。namespace と slug を別々に渡すと、コピペで「タイトルは面子・
 * canonical は待ち」のような誤配線が typecheck を通ってしまうため。
 *
 * @param slug - 練習のスラッグ
 */
export async function createPracticeMetadata(
  slug: PracticeMenuSlug,
): Promise<Metadata> {
  return createNamespaceMetadata(practiceMenuBySlug(slug).namespace, {
    path: practiceHref(slug),
  });
}

/**
 * 練習のプレイページ（`/practice/<slug>/play` 等）の metadata を生成する。
 * プレイページメタデータ生成
 *
 * タイトルのみ + noindex。説明ページ（canonical を持つ側）と検索結果で
 * 競合させないための指定で、play ページはすべてこれを使うこと。
 *
 * 辞書ネームスペースは `createPracticeMetadata` と同じくレジストリから引く。
 * play ページの View（`createChallengePlayView`）も slug を持っているため、
 * namespace を別に受け取ると同じ練習の識別子が 1 ページに 2 つ並び、
 * コピペで「View は雀頭・タイトルは待ち」の食い違いが typecheck を通る。
 *
 * @param slug - 練習のスラッグ
 */
export async function createPracticePlayMetadata(
  slug: PracticeMenuSlug,
): Promise<Metadata> {
  return {
    ...(await createTitleOnlyMetadata(practiceMenuBySlug(slug).namespace)),
    robots: PRACTICE_SUBPAGE_ROBOTS,
  };
}

/**
 * レジストリに載らない自由練習のプレイページの metadata を生成する。
 * 自由練習プレイページメタデータ生成
 *
 * `/practice/score` 専用。この練習は成績を記録せずランキングにも載らないため
 * `PRACTICE_MENU_REGISTRY` に無く、slug から namespace を引けない。
 *
 * 新しい練習でこれを使わないこと — 記録対象の練習はレジストリに 1 行足して
 * `createPracticePlayMetadata` を使う。
 *
 * @param namespace - 翻訳名前空間（例: "score"）
 */
export async function createFreePracticePlayMetadata(
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
 * 辞書ネームスペースはレジストリから引く（理由は
 * {@link createPracticePlayMetadata} と同じ）。
 *
 * @param slug - 練習のスラッグ
 */
export async function createPracticeTrainingMetadata(
  slug: PracticeMenuSlug,
): Promise<Metadata> {
  return {
    ...(await createNamespaceMetadata(practiceMenuBySlug(slug).namespace)),
    robots: PRACTICE_SUBPAGE_ROBOTS,
  };
}
