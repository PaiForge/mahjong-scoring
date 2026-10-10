import {
  AD_KINDS,
  MOBILE_AD_SLOTS,
  type AdKind,
} from "@mahjong-scoring/features/ads/native-ad";

/**
 * ネイティブ広告のスロットと広告の形の正典
 * 広告スロットレジストリ
 *
 * スロット（掲載枠）は 1 つの広告の形（kind）だけを受け付ける。DB
 * （`ad_creatives`）の `slot` / `kind` はただの varchar でこの結び付きを
 * 表せないため、書き込みはこのレジストリで検証し、読み込みはスロットが
 * 結ぶ kind で行を絞る。掲載枠を増やすときはここから始める: スロットを足し、
 * 描画する画面の `surfaces` を書き、その画面で `getNativeAdCreatives` を読む。
 *
 * @design kind は「周りに溶け込む相手の形」の数だけある
 *
 * ネイティブ広告は、置かれた画面の他の項目と同じ形で並ぶことで成り立つ。
 * このアプリで広告が並ぶ相手は 2 種類しかない。
 *
 * - `native_card` — 練習一覧の練習カード（細枠の白いカード）と同じ形。
 *   画像（書影など）か手牌（練習カードと同じ緑の帯に並べる）・タイトル・
 *   説明を持つ
 * - `native_row` — `LinkRow`（破線で区切った行リンク）と同じ形。行頭の
 *   絵文字（または小さな画像）・タイトル・説明を持つ
 *
 * 新しい画面の項目が第 3 の形なら、そのときに kind を足す（CHECK 制約・
 * 管理画面の検証・描画コンポーネントの 3 つが要る）。
 *
 * @design バナー枠は持たない
 *
 * どの画面にも属さない形の矩形を「広告枠」として確保するのは、ネイティブ
 * 広告の定義（周りと同じ形で並ぶ）の逆になる。スロットはどれも本文の中にある。
 *
 * @design ランキングの表の中には置かない
 *
 * `/leaderboard/<期間>/<練習>` の表は「実在の人が何を達成したか」の行で、
 * 周りに溶け込む広告行はそこでは順位を名乗る行になってしまう。置くのは
 * 土俵を選ぶ一覧（`/leaderboard`）だけ。
 */

const adKindSet: ReadonlySet<string> = new Set(AD_KINDS);

export function isAdKind(value: string): value is AdKind {
  return adKindSet.has(value);
}

/**
 * 広告を描画する側
 * 広告プラットフォーム
 *
 * スロットはどちらか一方の画面だけが読む（{@link platformForSlot}）。
 * トラッキング ID はプラットフォームごとに持つ（`ad_network_settings`）。
 */
export const AD_PLATFORMS = ["web", "mobile"] as const;

/** 広告プラットフォーム */
export type AdPlatform = (typeof AD_PLATFORMS)[number];

const adPlatformSet: ReadonlySet<string> = new Set(AD_PLATFORMS);

export function isAdPlatform(value: string): value is AdPlatform {
  return adPlatformSet.has(value);
}

/**
 * スロットの広告が実際に描画される場所。管理画面（`/admin/ads`）で
 * 「このスロットはどこに出るのか」を見に行けるように書く。
 *
 * コードが強制しない唯一の項目（スロットを読み始めた画面がここに自分を
 * 書き足さなくても型は通る）。画面を配線するときに一緒に書くこと。
 */
export interface AdSurface {
  /**
   * 描画する側。省略時は web。モバイル（Expo）の画面は広告配信 API
   * （`/api/ads/<スロット>`）から広告を読む
   */
  readonly platform?: "mobile";
  /** アプリのルート。動的セグメントはファイルツリーの綴りで書く */
  readonly route: string;
  /**
   * 実際に開けるパス。動的セグメントを必ず解決できる値が無ければ省く。
   * モバイルの画面はブラウザで開けないので持たない
   */
  readonly href?: string;
}

interface AdSlotConfig {
  readonly kind: AdKind;
  readonly surfaces: readonly AdSurface[];
  /**
   * モバイルのスロットだけが持つ、web の同じ画面のスロット。管理画面が
   * web 版とアプリ版を行き来するのに使う。形と枠数はこのスロットに揃える
   * （`registry.test.ts` が検査する）
   */
  readonly webCounterpart?: string;
  /**
   * 1 画面に出す広告の数（省略時 1）。掲載中の広告を並び順の先頭から
   * この数だけ出し、同じ広告を 2 度は出さない（掲載中が足りなければ
   * 足りない枠は空ける）。
   */
  readonly placements?: number;
}

/**
 * スロット → 設定。キーは掲載位置で決める。
 *
 * スロットは「広告の在庫の単位」で、1 スロットに有効な広告が複数あれば
 * 並び順（`sort_order`）の先頭から `placements` の数だけ画面に出す。管理画面の一覧はこのオブジェクトを走査する
 * ため、ここに足したスロットは管理画面の変更なしで現れる。
 *
 * @design 画面ごとにスロットを分ける
 *
 * Amazon アソシエイトはクリック単位のサブ ID を持たず、成果を分けられる
 * 単位はリンクに付けるトラッキング ID（`tag=`）だけ。スロットごとに別の
 * トラッキング ID のリンクを登録すれば、どの画面が成果を出したかをレポートで
 * 分けられる。スロットを共有すると後から分ける方法が無いため、読み手の
 * 状況が違う画面（練習を終えた人 / 試験を終えた人 / 章を読み終えた人）は
 * 最初から別のスロットにしておく。
 */
export const AD_SLOTS = {
  "practice-grid-native-ad": {
    kind: "native_card",
    surfaces: [{ route: "/practice", href: "/practice" }],
  },
  "practice-result-native-ad": {
    kind: "native_card",
    // 全練習の結果画面が共有する 1 枠。代表の練習で開けるパスを添える
    surfaces: [
      {
        route: "/practice/<練習>/result",
        href: "/practice/jantou-fu/result?correct=0&total=0",
      },
    ],
  },
  "exam-result-native-ad": {
    kind: "native_card",
    surfaces: [
      {
        route: "/exam/<級>/result",
        href: "/exam/fu/result?correct=0&total=0",
      },
    ],
  },
  // 章末の前後のレッスンへのリンクの上。周りは表・ボタン・テキストリンクで
  // 練習カードが無いため、カードの形にすると本文から浮く。枠の無い 1 行で置く
  "learn-chapter-native-ad": {
    kind: "native_row",
    surfaces: [
      { route: "/lessons/<章>", href: "/lessons/why-scoring-is-complex" },
    ],
  },
  // レッスンの「関連する練習」の練習カードの並びの中（練習一覧と同じカードの
  // 形）。確認問題を持つレッスンでは解き終えるまで出ない
  "lesson-practices-native-ad": {
    kind: "native_card",
    surfaces: [{ route: "/lessons/<章>", href: "/lessons/fu-doubling" }],
  },
  "learn-index-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/lessons", href: "/lessons" }],
    // 目次の 6 セクションに間隔を広げながら置く（`adIndexAfterGroup`）
    placements: 3,
  },
  "leaderboard-index-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/leaderboard", href: "/leaderboard" }],
    // 3 分野に間隔を広げながら置く（`adIndexAfterGroup`）。1・3 分野目の後
    placements: 2,
  },
  "glossary-index-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/reference/glossary", href: "/reference/glossary" }],
    // 五十音の行に間隔を広げながら置く（`adIndexAfterGroup`）。語のある行が
    // 10 行に届いたら 4 本目の位置（10 行目の後）ができる
    placements: 3,
  },
  "glossary-term-native-ad": {
    kind: "native_card",
    surfaces: [
      {
        route: "/reference/glossary/<用語>",
        href: "/reference/glossary/uradora",
      },
    ],
  },
  // 練習の説明ページ（自由練習の設定ページを含む）の開始ボタンより後ろ、
  // 関連するレッスンの目次の下。全練習が共有する 1 枠
  "practice-intro-native-ad": {
    kind: "native_row",
    surfaces: [
      { route: "/practice/<練習>", href: "/practice/jantou-fu" },
      { route: "/practice/agari-score", href: "/practice/agari-score" },
      { route: "/practice/tenpai-score", href: "/practice/tenpai-score" },
    ],
  },
  // 昇級試験の説明ページの末尾、「その級の練習」の行リンクと同じ並び
  "exam-intro-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/exam/<級>", href: "/exam/fu" }],
  },
  // 級の詳細の前提のレッスンの目次の下。前提のレッスンを持たない級（初段）
  // では出さない（短い画面で帯のカードと試験の案内の間に挟まるため）
  "rank-detail-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/dojo/ranks/<級>", href: "/dojo/ranks/kyu-4" }],
  },
  "yaku-reference-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/reference/yaku", href: "/reference/yaku" }],
    // 翻数のまとまり（1・2・3・6 翻・役満の 5 つ）に間隔を広げながら置く
    // （`adIndexAfterGroup`）。1・3 まとまり目の後
    placements: 2,
  },
  // お知らせ一覧の末尾の行。ホームのお知らせ・お知らせの詳細には置かない
  "announcements-index-native-ad": {
    kind: "native_row",
    surfaces: [{ route: "/announcements", href: "/announcements" }],
  },

  // --- モバイル（Expo）の画面。web の同じ画面とは別のスロットにして、アプリの
  // 成果を別のトラッキング ID で分けられるようにする。形・枠数・置き場所は
  // web の同じ画面のスロットに合わせる
  [MOBILE_AD_SLOTS.practiceGrid]: {
    webCounterpart: "practice-grid-native-ad",
    kind: "native_card",
    surfaces: [{ platform: "mobile", route: "/practice" }],
  },
  [MOBILE_AD_SLOTS.practiceIntro]: {
    webCounterpart: "practice-intro-native-ad",
    kind: "native_row",
    surfaces: [
      { platform: "mobile", route: "/practice/<練習>" },
      { platform: "mobile", route: "/practice/agari-score" },
      { platform: "mobile", route: "/practice/tenpai-score" },
    ],
  },
  [MOBILE_AD_SLOTS.practiceResult]: {
    webCounterpart: "practice-result-native-ad",
    kind: "native_card",
    surfaces: [{ platform: "mobile", route: "/practice/<練習>/result" }],
  },
  [MOBILE_AD_SLOTS.examIntro]: {
    webCounterpart: "exam-intro-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/exam/<級>" }],
  },
  [MOBILE_AD_SLOTS.examResult]: {
    webCounterpart: "exam-result-native-ad",
    kind: "native_card",
    surfaces: [{ platform: "mobile", route: "/exam/<級>/result" }],
  },
  [MOBILE_AD_SLOTS.rankDetail]: {
    webCounterpart: "rank-detail-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/dojo/ranks/<級>" }],
  },
  [MOBILE_AD_SLOTS.learnIndex]: {
    webCounterpart: "learn-index-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/lessons" }],
    placements: 3,
  },
  [MOBILE_AD_SLOTS.learnChapter]: {
    webCounterpart: "learn-chapter-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/lessons/<章>" }],
  },
  [MOBILE_AD_SLOTS.lessonPractices]: {
    webCounterpart: "lesson-practices-native-ad",
    kind: "native_card",
    surfaces: [{ platform: "mobile", route: "/lessons/<章>" }],
  },
  [MOBILE_AD_SLOTS.glossaryIndex]: {
    webCounterpart: "glossary-index-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/reference/glossary" }],
    placements: 3,
  },
  [MOBILE_AD_SLOTS.glossaryTerm]: {
    webCounterpart: "glossary-term-native-ad",
    kind: "native_card",
    surfaces: [{ platform: "mobile", route: "/reference/glossary/<用語>" }],
  },
  [MOBILE_AD_SLOTS.yakuReference]: {
    webCounterpart: "yaku-reference-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/reference/yaku" }],
    placements: 2,
  },
  [MOBILE_AD_SLOTS.announcementsIndex]: {
    webCounterpart: "announcements-index-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/announcements" }],
  },
  [MOBILE_AD_SLOTS.leaderboardIndex]: {
    webCounterpart: "leaderboard-index-native-ad",
    kind: "native_row",
    surfaces: [{ platform: "mobile", route: "/leaderboard" }],
    placements: 2,
  },
} as const satisfies Record<string, AdSlotConfig>;

/** 広告スロット */
export type AdSlot = keyof typeof AD_SLOTS;

export const AD_SLOT_VALUES: readonly AdSlot[] =
  Object.keys(AD_SLOTS).filter(isAdSlot);

export function isAdSlot(value: string): value is AdSlot {
  return Object.prototype.hasOwnProperty.call(AD_SLOTS, value);
}

/** スロットが受け付ける広告の形 */
export function kindForSlot(slot: AdSlot): AdKind {
  return AD_SLOTS[slot].kind;
}

/** スロットの広告が描画される場所。{@link AdSurface} 参照 */
export function surfacesForSlot(slot: AdSlot): readonly AdSurface[] {
  return AD_SLOTS[slot].surfaces;
}

/**
 * スロットを読む側。モバイルの画面に出る（`surfaces` に `platform: "mobile"`
 * を持つ）スロットは mobile、それ以外は web
 */
export function platformForSlot(slot: AdSlot): AdPlatform {
  return surfacesForSlot(slot).some((surface) => surface.platform === "mobile")
    ? "mobile"
    : "web";
}

/** プラットフォームの画面が読むスロット（`AD_SLOTS` の順） */
export function slotsForPlatform(platform: AdPlatform): AdSlot[] {
  return AD_SLOT_VALUES.filter((slot) => platformForSlot(slot) === platform);
}

/**
 * モバイルの画面が読むスロットか。広告配信 API はこのスロットだけに答える
 * （web の画面はサーバーで DB を読むため API を使わない）
 */
export function isMobileAdSlot(slot: AdSlot): boolean {
  return platformForSlot(slot) === "mobile";
}

/**
 * web とアプリで同じ画面に出るもう片方のスロット。web だけの画面
 * （アプリに同じ画面が無いもの）は undefined
 * 対のスロット
 */
export function counterpartSlot(slot: AdSlot): AdSlot | undefined {
  const config: AdSlotConfig = AD_SLOTS[slot];
  if (config.webCounterpart !== undefined) {
    return isAdSlot(config.webCounterpart) ? config.webCounterpart : undefined;
  }
  return AD_SLOT_VALUES.find((other) => {
    const otherConfig: AdSlotConfig = AD_SLOTS[other];
    return otherConfig.webCounterpart === slot;
  });
}

/** 1 画面に出す広告の数。{@link AdSlotConfig} の `placements` 参照 */
export function placementsForSlot(slot: AdSlot): number {
  const config: AdSlotConfig = AD_SLOTS[slot];
  return config.placements ?? 1;
}
