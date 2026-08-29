import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";

import { AGARI_TERMS } from "./terms/agari";
import { FU_TERMS } from "./terms/fu";
import { HAI_TERMS } from "./terms/hai";
import { NAKI_TERMS } from "./terms/naki";
import { SCORE_TERMS } from "./terms/score";
import { TEHAI_TERMS } from "./terms/tehai";
import type {
  GlossaryCategory,
  GlossaryTermEntry,
  GlossaryTermExample,
} from "./types";

/**
 * 用語のマスタ配列（型導出用）
 *
 * 分類ごとに `terms/*.ts` へ分けて書き、ここで 1 本に連結する。
 * 連結後も literal type を保つため `as const` を付けている
 * （{@link GlossaryTermSlug} をこの配列から導出するのに要る）。
 */
const GLOSSARY_REGISTRY = [
  ...HAI_TERMS,
  ...TEHAI_TERMS,
  ...NAKI_TERMS,
  ...AGARI_TERMS,
  ...FU_TERMS,
  ...SCORE_TERMS,
] as const satisfies readonly GlossaryTermEntry[];

/** 用語スラッグ — `/reference/glossary/<slug>` の slug 部分に対応 */
export type GlossaryTermSlug = (typeof GLOSSARY_REGISTRY)[number]["slug"];

/**
 * 用語 1 件のメタデータ
 *
 * 文言（見出し語・読み・定義）はここに持たない。辞書
 * （`glossary.terms.<slug>`）が唯一の置き場で、この型が持つのは
 * 「どの分類か」「どの牌を並べるか」「どこへ繋ぐか」という構造だけ。
 */
export interface GlossaryTerm {
  readonly slug: GlossaryTermSlug;
  readonly category: GlossaryCategory;
  readonly examples?: readonly GlossaryTermExample[];
  readonly related?: readonly GlossaryTermSlug[];
  readonly learnSlugs?: readonly CurriculumChapterSlug[];
}

/** 用語メタデータの一覧 */
export const GLOSSARY_TERMS: readonly GlossaryTerm[] = GLOSSARY_REGISTRY;

/** 用語スラッグの一覧（GLOSSARY_TERMS と同じ順序） */
export const GLOSSARY_TERM_SLUGS: readonly GlossaryTermSlug[] =
  GLOSSARY_TERMS.map((term) => term.slug);

/** slug から用語を O(1) で引くための lookup map */
const GLOSSARY_BY_SLUG: ReadonlyMap<GlossaryTermSlug, GlossaryTerm> = new Map(
  GLOSSARY_TERMS.map((term) => [term.slug, term]),
);

/**
 * slug から用語メタデータを取得する。
 * 用語メタデータ取得
 *
 * @param slug 対象用語のスラッグ
 * @returns 該当する用語。slug が不正な場合は undefined。
 */
export function getGlossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return isGlossaryTermSlug(slug) ? GLOSSARY_BY_SLUG.get(slug) : undefined;
}

/**
 * 値が既知の用語スラッグかを判定する。
 * 用語スラッグ判定
 *
 * 教本本文の `[[slug]]` マークアップは書き手が手で打つため、綴り違いが
 * そのまま壊れたリンクになる。描画側はこの関数で弾いて素のテキストに落とす。
 *
 * @param value 検査対象の値
 */
export function isGlossaryTermSlug(value: unknown): value is GlossaryTermSlug {
  return (
    typeof value === "string" &&
    (GLOSSARY_TERM_SLUGS as readonly string[]).includes(value)
  );
}
