/**
 * 本番の初期データ: ネイティブ広告
 * 広告シード
 *
 * デプロイのたびに `pnpm db:seed`（prebuild）から走り、ここに宣言した広告の
 * うち DB にまだ無い行だけを入れる（id 単位の insert-only）。一度入った行は
 * DB が正で、管理画面での編集（リンク・掲載状態・文言・並び順）を上書きしない。
 * あとからここに足した行は、次のデプロイで入る。
 *
 * 行は ASIN で本を指し、掲載中で入る。リンクは表示のたびに ASIN と
 * トラッキング ID から組み立てる（`lib/ads/amazon.ts`）。トラッキング ID は
 * 運用者個人の設定で、公開リポジトリのコードには書かない — 管理画面
 * （`/admin/ads`）で web とアプリの ID をそれぞれ設定した時点で、その側の
 * 全スロットに広告が出る。設定するまでは、掲載中でも画面には出ない。
 *
 * @design id を固定する
 * `ad_creatives` の鍵は id だけ（`slot` は一意でない）。どの環境でも同じ行を
 * 同じ id で指せないと、「まだ無い行だけ入れる」が判定できない。
 */
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";

import type { CreativeCopy } from "../../src/lib/ads/copy";
import { copyToTranslationRows } from "../../src/lib/ads/copy";
import {
  AD_SLOT_VALUES,
  type AdSlot,
  kindForSlot,
} from "../../src/lib/ads/registry";
import { adCreatives, adCreativeTranslations } from "../../src/lib/db/schema";

/** 広告にする本。文言と見た目はどのスロットでも同じ */
interface SeedBook {
  /** Amazon の商品の ASIN（Kindle 本の B0… 等） */
  readonly asin: string;
  /** 行の形（`native_row`）の行頭に出す絵文字 */
  readonly icon: string;
  /**
   * カードの形（`native_card`）の帯に並べる手牌（MPSZ 表記、14 枚）。
   * 練習カードと同じ緑の帯に、その本の中身に近い手を置く
   */
  readonly hand: string;
  readonly copy: CreativeCopy;
}

/**
 * 広告にする本
 *
 * タイトルは書名そのもの（一括更新はタイトルで本を束ねるため、スロット間で
 * 一字でも違えると別の本になる）。説明は書名と副題から言えることだけを書く。
 */
const BOOKS = {
  oshihiki: {
    asin: "B0H74QCPBJ",
    icon: "📘",
    // 聴牌した手。押すか降りるかを考える場面
    hand: "123m456p23455789s",
    copy: {
      title: { ja: "麻雀・一番やさしい押し引きの教科書" },
      description: {
        ja: "攻めるか、降りるか。押し引きの判断をやさしく解説する教科書（マイナビ麻雀BOOKS）。",
      },
    },
  },
  mangaIntro: {
    asin: "B0FP1KHZXY",
    icon: "📗",
    // 一気通貫の和了形。入門書らしく、形の揃った手
    hand: "123456789m11p234s",
    copy: {
      title: { ja: "マンガでわかる 子ども・初心者のための麻雀入門" },
      description: {
        ja: "マンガで読み進める、子どもや初めての人のための麻雀入門書。",
      },
    },
  },
  haiKouritsu: {
    asin: "B08721VWS5",
    icon: "📙",
    // 何を切るかを考える 14 枚（何切る）
    hand: "234m45567p3468s11z",
    copy: {
      title: { ja: "ウザク式麻雀学習 牌効率" },
      description: {
        ja: "手牌から何を切るか。牌効率を身につけるための一冊。",
      },
    },
  },
  scoreDrill: {
    asin: "B0HGL2VJ5K",
    icon: "📕",
    // 役牌の暗刻と字牌の雀頭。符を数える対象がある手
    hand: "123m456p789s111z22z",
    copy: {
      title: { ja: "点数計算ドリル200問" },
      description: {
        ja: "符と翻から点数申告まで、200問の反復で点数計算を身につけるドリル。",
      },
    },
  },
  shinsoku: {
    asin: "B0DGTQXJ9X",
    icon: "📒",
    // 断幺九の和了形
    hand: "22m345678p234567s",
    copy: {
      title: { ja: "令和版 神速の麻雀 堀内システム55" },
      description: {
        ja: "堀内正人による麻雀戦術書「神速の麻雀」の令和版。",
      },
    },
  },
} satisfies Record<string, SeedBook>;

type BookKey = keyof typeof BOOKS;

/**
 * スロットに載せる本（並び順どおり）。キーは全スロットで、スロットを足すと
 * 本を選ぶまで型が通らない。1 画面に出るのは先頭から
 * `placementsForSlot` の数だけで、残りは先頭を止めたときの繰り上がり。
 *
 * 本はその画面の読み手に合わせる。練習一覧は牌効率（手牌を見て考える練習の
 * 並び）、結果画面・教本の章・レッスンの練習の並びは点数計算ドリル（点数計算を
 * 練習・学習した直後）、目次・用語集・レッスンの教本の並びは入門書から、
 * ランキングは戦術書から。練習の説明ページは点数計算ドリル（これから点数計算を
 * 練習する人）。昇級試験の説明ページ・級の詳細も点数計算ドリル（試験の範囲を
 * 固める人）。役一覧は用語集と同じく入門書から、お知らせ一覧はランキングと
 * 同じく戦術書から（すでに使い続けている人が読む）。アプリの画面は web の
 * 同じ画面と同じ本を同じ順で載せる。
 */
const SLOT_BOOKS: Record<
  AdSlot,
  readonly { readonly id: string; readonly book: BookKey }[]
> = {
  "practice-grid-native-ad": [
    { id: "c700cdea-619d-4d6d-a977-f7b205201fb3", book: "haiKouritsu" },
    { id: "d14f0932-f5eb-4a99-9735-044a35c31536", book: "oshihiki" },
  ],
  "practice-result-native-ad": [
    { id: "f4b82058-b25a-4290-995b-9e7e794b402e", book: "scoreDrill" },
    { id: "52594149-4c09-413d-b89a-c5ec5cf7e714", book: "haiKouritsu" },
  ],
  "exam-result-native-ad": [
    { id: "cca4b3cf-5196-490e-b3f1-fca2fa3f37bc", book: "scoreDrill" },
    { id: "917c5a9d-3a91-45fe-806f-51cfc656c714", book: "oshihiki" },
  ],
  "learn-chapter-native-ad": [
    { id: "62e99ef0-29ed-4de6-926a-e663f7a6dbed", book: "scoreDrill" },
    { id: "e1e71192-7e3c-4ed7-99f8-ebfa44c86b03", book: "mangaIntro" },
  ],
  "lesson-practices-native-ad": [
    { id: "5d9232d6-57db-43da-899a-7f49d2c2ae7a", book: "scoreDrill" },
    { id: "c4ef89f3-c6ad-4418-9ef7-dce655e39e59", book: "haiKouritsu" },
  ],
  "learn-index-native-ad": [
    { id: "06924a25-8ad7-457a-95c0-41f87e57a768", book: "mangaIntro" },
    { id: "0521c84d-b530-4033-8045-9cabdd5160d9", book: "scoreDrill" },
    { id: "dfd6e7e2-7595-466a-8bf6-262aabb82a10", book: "haiKouritsu" },
  ],
  "leaderboard-index-native-ad": [
    { id: "d36cfc05-2e09-44c7-8e9c-44de6fe00218", book: "shinsoku" },
    { id: "f9e855aa-7c95-4b19-8cc0-8706951397f0", book: "oshihiki" },
  ],
  "glossary-index-native-ad": [
    { id: "8fb92191-744d-4001-8c5c-4e831c88fe2b", book: "mangaIntro" },
    { id: "e4469e51-7985-4872-82b2-d9471fdafd8f", book: "haiKouritsu" },
    { id: "e5c5116e-afaa-4641-95c9-2f1dadf15329", book: "oshihiki" },
  ],
  "glossary-term-native-ad": [
    { id: "a27c9103-162a-4578-bcd4-517013fc2a26", book: "mangaIntro" },
    { id: "26d38ae2-00bc-4065-9af6-26466b0aaa03", book: "scoreDrill" },
  ],
  "practice-intro-native-ad": [
    { id: "7729ea6e-f82f-4baf-9cd7-03d779c3b8d7", book: "scoreDrill" },
    { id: "7ad6b8ff-002b-48bf-9f3c-f828f7b604d9", book: "haiKouritsu" },
  ],
  "exam-intro-native-ad": [
    { id: "e6bf36e9-7407-43f3-87c6-312442941841", book: "scoreDrill" },
    { id: "9ffc5483-04cd-4396-9e82-5f3d8010b47d", book: "oshihiki" },
  ],
  "rank-detail-native-ad": [
    { id: "4ea1fe53-3001-4305-af95-6a0a15f27859", book: "scoreDrill" },
    { id: "5ce9a332-30ec-40e2-80a8-fe28523b07f4", book: "mangaIntro" },
  ],
  "yaku-reference-native-ad": [
    { id: "e2837d58-d17e-42ed-b37a-55b3c66693d6", book: "mangaIntro" },
    { id: "0b05d2fc-b8ff-4662-b3a9-4d045adea70b", book: "haiKouritsu" },
    { id: "f4e1aa06-2d49-42ee-82e3-ad90d8558a7a", book: "oshihiki" },
  ],
  "announcements-index-native-ad": [
    { id: "67987085-4274-4e02-977b-bb8a31fbbb2a", book: "shinsoku" },
    { id: "c210bfcf-c7d5-4fd1-8cea-a0e852d7e218", book: "oshihiki" },
  ],
  // モバイルの画面は web の同じ画面と同じ本を同じ順で載せる
  [MOBILE_AD_SLOTS.practiceGrid]: [
    { id: "0dbcf231-50a1-41e2-b6dc-6be96b62dc95", book: "haiKouritsu" },
    { id: "e68009d9-a86c-4236-83c2-4948013da970", book: "oshihiki" },
  ],
  [MOBILE_AD_SLOTS.practiceIntro]: [
    { id: "0b4bc15f-2992-4c28-beb3-eec5da433828", book: "scoreDrill" },
    { id: "6f4d9e0c-0186-4f08-8edc-a6dcf59b35f1", book: "haiKouritsu" },
  ],
  [MOBILE_AD_SLOTS.practiceResult]: [
    { id: "b64a1e2c-0436-4fc0-b6bb-99da661e9be3", book: "scoreDrill" },
    { id: "d5311f6d-1c95-4bbd-826d-00d469d846f9", book: "haiKouritsu" },
  ],
  [MOBILE_AD_SLOTS.examIntro]: [
    { id: "1c30eee2-0796-4807-8062-39e631a71554", book: "scoreDrill" },
    { id: "c5734f80-fbeb-4bdc-86bd-7037c9adbf06", book: "oshihiki" },
  ],
  [MOBILE_AD_SLOTS.examResult]: [
    { id: "86a3b6b6-5467-4e90-b921-ec0fd01141e2", book: "scoreDrill" },
    { id: "2e5c328b-dd96-412a-a83b-cc7376f4ab7f", book: "oshihiki" },
  ],
  [MOBILE_AD_SLOTS.rankDetail]: [
    { id: "d5dc35c5-2a02-4641-9d94-0f9352a64e47", book: "scoreDrill" },
    { id: "5003ec8d-94a4-4d2d-93b0-5f7a1835d91e", book: "mangaIntro" },
  ],
  [MOBILE_AD_SLOTS.learnIndex]: [
    { id: "61d24c42-7596-49e5-9a20-722c4daa2d49", book: "mangaIntro" },
    { id: "e734ac5c-e72b-45d0-8929-6983ddbc9316", book: "scoreDrill" },
    { id: "b0e8b787-d544-4554-9648-41f8f686944a", book: "haiKouritsu" },
  ],
  [MOBILE_AD_SLOTS.learnChapter]: [
    { id: "b3ff2eb3-2753-4176-83aa-f43e14f45f16", book: "scoreDrill" },
    { id: "90a0d660-1b22-474a-a6d6-02ce8814c095", book: "mangaIntro" },
  ],
  [MOBILE_AD_SLOTS.lessonPractices]: [
    { id: "1579a3e0-60ed-4655-945f-bc6ce163269f", book: "scoreDrill" },
    { id: "a41266a4-37dd-4805-b233-c2a1b8428691", book: "haiKouritsu" },
  ],
  [MOBILE_AD_SLOTS.glossaryIndex]: [
    { id: "495839f9-4ab3-4650-9653-3e24ef4ef088", book: "mangaIntro" },
    { id: "45cd9d6c-1052-4f9f-809a-c94d20131d5c", book: "haiKouritsu" },
    { id: "e6fbd1eb-99de-4cbe-91fb-f112be99affe", book: "oshihiki" },
  ],
  [MOBILE_AD_SLOTS.glossaryTerm]: [
    { id: "cdb03842-0d25-4369-9da0-b2505e359352", book: "mangaIntro" },
    { id: "e0bc3f06-f134-433a-a006-d1c823f812a7", book: "scoreDrill" },
  ],
  [MOBILE_AD_SLOTS.yakuReference]: [
    { id: "6fe73057-b56e-474b-be18-6812ca427196", book: "mangaIntro" },
    { id: "2ebff36b-e29d-4ac5-9742-f9949e46088a", book: "haiKouritsu" },
    { id: "3c7c44cb-2f1e-401c-b3e2-ab5b7928bfd5", book: "oshihiki" },
  ],
};

/** シードが書く広告 1 行（本体 + 文言） */
export interface SeedAdCreative {
  readonly row: typeof adCreatives.$inferInsert & { readonly id: string };
  readonly copy: CreativeCopy;
}

/**
 * 宣言した全広告を行の形にしたもの。ASIN で本を指して掲載中で入り、カードの
 * 形は手牌、行の形は絵文字を見た目にする（行には帯が無い）。
 */
export const SEED_AD_CREATIVES: readonly SeedAdCreative[] =
  AD_SLOT_VALUES.flatMap((slot) =>
    SLOT_BOOKS[slot].map(({ id, book }, sortOrder) => {
      const { asin, icon, hand, copy } = BOOKS[book];
      const kind = kindForSlot(slot);
      return {
        row: {
          id,
          kind,
          slot,
          asin,
          href: null,
          isActive: true,
          sortOrder,
          icon: kind === "native_row" ? icon : null,
          imagePath: null,
          imageAlt: null,
          hand: kind === "native_card" ? hand : null,
        },
        copy,
      };
    }),
  );

/**
 * まだ無い広告だけを入れる（冪等・既存の行は変えない）
 *
 * @returns 新しく入れた広告の数
 */
export async function seedAdCreatives(db: PostgresJsDatabase): Promise<number> {
  let inserted = 0;
  for (const { row, copy } of SEED_AD_CREATIVES) {
    const written = await db
      .insert(adCreatives)
      .values(row)
      .onConflictDoNothing({ target: adCreatives.id })
      .returning({ id: adCreatives.id });
    if (written.length === 0) continue;
    inserted++;
    const copyRows = copyToTranslationRows(row.id, copy);
    if (copyRows.length > 0) {
      await db.insert(adCreativeTranslations).values(copyRows);
    }
  }
  return inserted;
}
