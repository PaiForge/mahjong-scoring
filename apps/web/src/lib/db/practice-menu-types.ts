/**
 * 練習種別の型定義と変換ユーティリティ
 *
 * チャレンジモード（ランキング対応）の練習種別を定義する。
 * `challenge_results` / `challenge_best_scores` テーブルの `menu_type` カラムに格納される値。
 *
 * @description 新しい練習種別の追加は `PRACTICE_MENU_REGISTRY` に1行追加するだけでよい。
 * slug（URL 用ケバブケース）・messageKey（i18n 用キャメルケース）・namespace
 * （練習ページの辞書セクション）はレジストリから自動導出される。
 *
 * @design menuType — 練習種別
 *
 * - 'jantou_fu': 雀頭の符計算
 * - 'machi_fu': 待ちの符計算
 * - 'mentsu_fu': 面子の符計算
 * - 'mentsu_jantou_fu': 面子と雀頭の符計算
 * - 'total_fu': 手牌の合計符
 * - 'yaku': 役判定
 * - 'score_table': 点数表早引き
 * - 'score_calculation': 点数計算練習
 * - 'han_count': 翻数即答
 * - 'yaku_han': 役の翻数
 * - 'mangan_score_calculation': 満貫以上の点数計算
 * - 'mangan_exam': 昇級試験（満貫以上の点数計算・役表示なし・ミス1回で終了）
 * - 'fu_exam': 昇級試験（手牌の合計符・ミス1回で終了）
 * - 'chiitoitsu_exam': 昇級試験（七対子の点数計算・役表示なし・ミス1回で終了）
 * - 'pinfu_exam': 昇級試験（平和の点数計算・役表示なし・ミス1回で終了）
 * - 'fu_score_exam': 昇級試験（30〜50符の点数計算・役表示なし・ミス1回で終了）
 * - 'score_exam': 昇段試験（あらゆる手の点数計算・役表示なし・ミス1回で終了）
 *
 * `practice/score` は自由練習のため記録対象外。
 */

// バレル（`@mahjong-scoring/core`）ではなく定数のモジュールを直に指す。
// バレルは ESM 専用の @pai-forge/riichi-mahjong を引き込み、tsx が CJS として
// 解決する開発スクリプト（`scripts/dev-seed.ts`）から読めなくなるため。
// このモジュールはランキングの練習種別一覧の出所なので、スクリプト側も読む。
import {
  CHALLENGE_TIME_LIMIT,
  MISTAKE_LIMIT,
} from "@mahjong-scoring/core/challenge/constants";

// ---------------------------------------------------------------------------
// Registry — single source of truth
// ---------------------------------------------------------------------------

/**
 * 練習種別レジストリエントリ
 * menuType（DB snake_case）・slug（URL kebab-case）・messageKey（i18n camelCase）・
 * namespace（練習ページの辞書セクション）を束ねる
 *
 * `messageKey` と `namespace` は別物である点に注意:
 * - `messageKey`: 練習名の一覧的な参照に使う共通キー。
 *   練習一覧は `practice.practices.<messageKey>.title`、マイページ・ランキングは
 *   短い名の `practice.practices.<messageKey>.shortTitle` を引く。
 * - `namespace`: その練習専用の辞書セクション。`<namespace>.title` が練習名、
 *   配下に問題文や選択肢のラベルが入る。チャレンジ系は `〜Challenge` で終わる。
 */
interface PracticeMenuEntry {
  readonly menuType: string;
  readonly slug: string;
  readonly messageKey: string;
  readonly namespace: string;
  /**
   * 問題別の回答結果を記録し、結果ページで問題別フィードバック一覧を出すか。
   * true の練習は play 中に sessionStorage へ結果を積み、結果ページ（とその
   * スケルトン）が出題数ぶんの一覧枠を描く。
   */
  readonly hasProblemList: boolean;
  /**
   * 説明ページに出題設定（親子・和了方法などの絞り込み）を持つか。
   * true の練習は結果ページに「設定を変更する」ボタンを出し、説明ページの
   * 設定セクションへ戻す。設定を持たない練習ではボタン自体を出さない。
   */
  readonly hasSetup: boolean;
  /**
   * チャレンジのミス上限の上書き（省略時は共通の `MISTAKE_LIMIT`）。
   * ミス上限
   *
   * セッションの強制終了（`useTimedSession`）・開始導線のヒント文言・
   * マイページの完走判定はすべてここから引く。全体定数 `MISTAKE_LIMIT` を
   * 直接参照すると、上限の異なる練習（昇級試験等）で判定がずれる。
   */
  readonly mistakeLimit?: number;
  /**
   * チャレンジの制限時間（秒）の上書き（省略時は共通の `CHALLENGE_TIME_LIMIT`）。
   * 制限時間
   */
  readonly timeLimit?: number;
  /**
   * ルートのベースパスの上書き（省略時は `/practice/<slug>`）。
   * ベースパス
   *
   * 昇級試験のように `/practice` 以外の URL 名前空間に置く練習が指定する
   * （例: `/exam/mangan`）。説明・play・result の URL、canonical、
   * sitemap はすべてここから導出されるため、`src/app/` の物理配置と
   * 必ず一致させること。
   */
  readonly basePath?: string;
}

/**
 * 練習種別レジストリ
 * 新しい練習の追加はここに1行追加するだけでよい。
 */
const PRACTICE_MENU_REGISTRY = [
  {
    menuType: "jantou_fu",
    slug: "jantou-fu",
    messageKey: "jantouFu",
    namespace: "jantouFu",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "machi_fu",
    slug: "machi-fu",
    messageKey: "machiFu",
    namespace: "machiFu",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "mentsu_fu",
    slug: "mentsu-fu",
    messageKey: "mentsuFu",
    namespace: "mentsuFu",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "mentsu_jantou_fu",
    slug: "mentsu-jantou-fu",
    messageKey: "mentsuJantouFu",
    namespace: "mentsuJantouFu",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "total_fu",
    slug: "total-fu",
    messageKey: "totalFu",
    namespace: "totalFu",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "yaku",
    slug: "yaku",
    messageKey: "yaku",
    namespace: "yaku",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "score_table",
    slug: "score-table",
    messageKey: "scoreTable",
    namespace: "scoreTableChallenge",
    hasProblemList: true,
    hasSetup: true,
  },
  {
    menuType: "score_calculation",
    slug: "score-calculation",
    messageKey: "scoreCalculation",
    namespace: "scoreCalculationChallenge",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "han_count",
    slug: "han-count",
    messageKey: "hanCount",
    namespace: "hanCountChallenge",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "yaku_han",
    slug: "yaku-han",
    messageKey: "yakuHan",
    namespace: "yakuHanChallenge",
    hasProblemList: true,
    hasSetup: true,
  },
  {
    menuType: "mangan_score_calculation",
    slug: "mangan-score-calculation",
    messageKey: "manganScoreCalculation",
    namespace: "manganScoreCalculationChallenge",
    hasProblemList: true,
    hasSetup: false,
  },
  {
    menuType: "mangan_exam",
    slug: "mangan-exam",
    messageKey: "manganExam",
    namespace: "manganExamChallenge",
    hasProblemList: true,
    hasSetup: false,
    // 昇級試験のためミス1回で強制終了（通常チャレンジは MISTAKE_LIMIT = 3）。
    // 「1ミスでアウト」をセッション側で強制することで、昇級判定は
    // ベストスコア >= 合格点の単純比較で成立する（RANK_REGISTRY 参照）
    mistakeLimit: 1,
    // 試験は /practice ではなく /exam の URL 名前空間に置く
    basePath: "/exam/mangan",
  },
  {
    menuType: "fu_exam",
    slug: "fu-exam",
    messageKey: "fuExam",
    namespace: "fuExamChallenge",
    hasProblemList: true,
    hasSetup: false,
    // 昇級試験のためミス1回で強制終了（mangan_exam と同じ理由。RANK_REGISTRY 参照）
    mistakeLimit: 1,
    basePath: "/exam/fu",
  },
  {
    menuType: "chiitoitsu_exam",
    slug: "chiitoitsu-exam",
    messageKey: "chiitoitsuExam",
    namespace: "chiitoitsuExamChallenge",
    hasProblemList: true,
    hasSetup: false,
    // 昇級試験のためミス1回で強制終了（mangan_exam と同じ理由。RANK_REGISTRY 参照）
    mistakeLimit: 1,
    basePath: "/exam/chiitoitsu",
  },
  {
    menuType: "pinfu_exam",
    slug: "pinfu-exam",
    messageKey: "pinfuExam",
    namespace: "pinfuExamChallenge",
    hasProblemList: true,
    hasSetup: false,
    // 昇級試験のためミス1回で強制終了（mangan_exam と同じ理由。RANK_REGISTRY 参照）
    mistakeLimit: 1,
    basePath: "/exam/pinfu",
  },
  {
    menuType: "fu_score_exam",
    slug: "fu-score-exam",
    messageKey: "fuScoreExam",
    namespace: "fuScoreExamChallenge",
    hasProblemList: true,
    hasSetup: false,
    // 昇級試験のためミス1回で強制終了（mangan_exam と同じ理由。RANK_REGISTRY 参照）
    mistakeLimit: 1,
    basePath: "/exam/fu-score",
  },
  {
    menuType: "score_exam",
    slug: "score-exam",
    messageKey: "scoreExam",
    namespace: "scoreExamChallenge",
    hasProblemList: true,
    hasSetup: false,
    // 昇段試験のためミス1回で強制終了（mangan_exam と同じ理由。RANK_REGISTRY 参照）
    mistakeLimit: 1,
    // 出題範囲を絞らない試験なので、範囲を名乗る他の試験と違って
    // URL も「点数計算の試験」とだけ名乗る
    basePath: "/exam/score",
  },
] as const satisfies readonly PracticeMenuEntry[];

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

/** 練習種別（DB snake_case） */
export type PracticeMenuType =
  (typeof PRACTICE_MENU_REGISTRY)[number]["menuType"];

/** 練習種別スラッグ（URL kebab-case） */
export type PracticeMenuSlug = (typeof PRACTICE_MENU_REGISTRY)[number]["slug"];

/**
 * i18n メッセージキー用の camelCase 識別子。
 * DB の snake_case `PracticeMenuType` を i18n の camelCase キーに変換する際に使用する。
 */
export type PracticeMenuMessageKey =
  (typeof PRACTICE_MENU_REGISTRY)[number]["messageKey"];

/** 練習ページの i18n 名前空間（`<namespace>.title` が練習名） */
export type PracticeMenuNamespace =
  (typeof PRACTICE_MENU_REGISTRY)[number]["namespace"];

/**
 * 練習種別の全情報
 * 練習種別記述子
 *
 * `mistakeLimit` / `timeLimit` はレジストリの省略値を共通定数で解決済み。
 * 利用側でデフォルトを重ねて適用しないこと。
 */
export interface PracticeMenuDescriptor {
  readonly menuType: PracticeMenuType;
  readonly slug: PracticeMenuSlug;
  readonly messageKey: PracticeMenuMessageKey;
  readonly namespace: PracticeMenuNamespace;
  readonly hasProblemList: boolean;
  readonly hasSetup: boolean;
  readonly mistakeLimit: number;
  readonly timeLimit: number;
  /** ルートのベースパス（説明ページの URL。play / result はこの配下） */
  readonly basePath: string;
}

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

/** 全練習種別の配列（DB snake_case） */
export const PRACTICE_MENU_TYPES: readonly PracticeMenuType[] =
  PRACTICE_MENU_REGISTRY.map((e) => e.menuType);

/** 全練習種別スラッグの配列（URL kebab-case） */
export const PRACTICE_MENU_SLUGS: readonly PracticeMenuSlug[] =
  PRACTICE_MENU_REGISTRY.map((e) => e.slug);

const practiceMenuTypeSet: ReadonlySet<string> = new Set(PRACTICE_MENU_TYPES);

/** 値が有効な練習種別かを判定する型ガード */
export function isPracticeMenuType(value: unknown): value is PracticeMenuType {
  return typeof value === "string" && practiceMenuTypeSet.has(value);
}

// ---------------------------------------------------------------------------
// Lookup maps (built from registry)
// ---------------------------------------------------------------------------

const menuTypeToSlugMap = new Map<PracticeMenuType, PracticeMenuSlug>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.menuType, e.slug]),
);

const slugToMenuTypeMap = new Map<PracticeMenuSlug, PracticeMenuType>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.slug, e.menuType]),
);

const menuTypeToMessageKeyMap = new Map<
  PracticeMenuType,
  PracticeMenuMessageKey
>(PRACTICE_MENU_REGISTRY.map((e) => [e.menuType, e.messageKey]));

/** レジストリの省略値を共通定数で解決した記述子を組み立てる */
function resolveDescriptor(
  entry: (typeof PRACTICE_MENU_REGISTRY)[number],
): PracticeMenuDescriptor {
  // 上書きフィールドは省略可能なため、authoring 型に広げてから読む
  // （as const の union 型は省略メンバーへのアクセスを許さない）
  const overrides: PracticeMenuEntry = entry;
  return {
    ...entry,
    mistakeLimit: overrides.mistakeLimit ?? MISTAKE_LIMIT,
    timeLimit: overrides.timeLimit ?? CHALLENGE_TIME_LIMIT,
    basePath: overrides.basePath ?? `/practice/${entry.slug}`,
  };
}

const slugToDescriptorMap = new Map<PracticeMenuSlug, PracticeMenuDescriptor>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.slug, resolveDescriptor(e)]),
);

const menuTypeToDescriptorMap = new Map<
  PracticeMenuType,
  PracticeMenuDescriptor
>(PRACTICE_MENU_REGISTRY.map((e) => [e.menuType, resolveDescriptor(e)]));

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/** DB の snake_case 練習種別を URL スラッグ（kebab-case）に変換する */
export function menuTypeToSlug(menuType: PracticeMenuType): PracticeMenuSlug {
  const slug = menuTypeToSlugMap.get(menuType);
  if (slug === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return slug;
}

const practiceMenuSlugSet: ReadonlySet<string> = new Set(PRACTICE_MENU_SLUGS);

/** 値が有効な練習種別スラッグ（URL kebab-case）かを判定する型ガード */
export function isPracticeMenuSlug(value: string): value is PracticeMenuSlug {
  return practiceMenuSlugSet.has(value);
}

/** URL スラッグ（kebab-case）を DB の snake_case 練習種別に変換する */
export function slugToMenuType(slug: string): PracticeMenuType | undefined {
  if (!isPracticeMenuSlug(slug)) return undefined;
  return slugToMenuTypeMap.get(slug);
}

/** DB の snake_case 練習種別を i18n メッセージキー（camelCase）に変換する */
export function menuTypeToMessageKey(
  menuType: PracticeMenuType,
): PracticeMenuMessageKey {
  const key = menuTypeToMessageKeyMap.get(menuType);
  if (key === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return key;
}

/**
 * URL スラッグから練習種別の全情報を取得する
 * 練習種別記述子取得
 *
 * 練習ページを組み立てるファクトリー（本体・結果・ローディング）は、
 * 各練習から slug だけを受け取り、menuType や i18n 名前空間はここから引く。
 * 同じ組み合わせを練習ごとに何度も書かないための入口。
 */
export function practiceMenuBySlug(
  slug: PracticeMenuSlug,
): PracticeMenuDescriptor {
  const descriptor = slugToDescriptorMap.get(slug);
  if (descriptor === undefined) {
    throw new Error(`Unknown PracticeMenuSlug: ${slug}`);
  }
  return descriptor;
}

/**
 * 練習種別（DB snake_case）から練習種別の全情報を取得する
 * 練習種別記述子取得（種別キー）
 *
 * DB 由来のデータ（チャレンジセッション等）にセッションルールを突き合わせる
 * 場面で使う。ミス上限の異なる練習が混在するため、完走判定などで全体定数
 * `MISTAKE_LIMIT` を直接参照せずここから引くこと。
 */
export function practiceMenuByType(
  menuType: PracticeMenuType,
): PracticeMenuDescriptor {
  const descriptor = menuTypeToDescriptorMap.get(menuType);
  if (descriptor === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return descriptor;
}

/**
 * 昇級試験の練習種別か
 * 昇級試験判定（種別キー）
 *
 * 判定はレジストリの `basePath` から導く — どの URL 名前空間に置くかの決定が
 * そのまま所属の決定。昇級試験は記録・結果ページの仕組みを練習と共有するため
 * レジストリには載るが、`/practice` の外（`/exam` 配下）に住む。
 *
 * 「試験を通常の練習と同じ土俵に載せない」判断はすべてこの述語を見る
 * （練習一覧のカード・ランキング・結果ページのランキングプレビュー）。
 */
export function isExamMenuType(menuType: PracticeMenuType): boolean {
  return !practiceMenuByType(menuType).basePath.startsWith("/practice/");
}

/**
 * 練習結果を sessionStorage に保存する際のキーを導出する
 * 結果ストレージキー
 *
 * `<slug>-results` 形式。各練習の _lib/types.ts に手書きすると
 * slug 変更時に追随漏れが起きるため、レジストリの slug から導出する。
 */
export function resultStorageKeyFor(slug: PracticeMenuSlug): string {
  return `${slug}-results`;
}
