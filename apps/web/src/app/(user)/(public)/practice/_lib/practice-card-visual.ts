import type { getTranslations } from "next-intl/server";

import { HaiKind, parseHais } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

type PracticeTranslator = Awaited<
  ReturnType<typeof getTranslations<"practice">>
>;

/** 答えの単位。帯の右端に「符は？」の形で出す */
type AnswerUnit = "fu" | "han" | "score" | "yaku";

/** 帯に出す短い文言のキー（`practice.cardExample.*`） */
type LabelKey = "naki" | "yakuName" | "fuHan" | "manganHan";

/** 帯の左側 — その練習の出題で実際に目にするもの */
type Subject =
  | {
      readonly kind: "tiles";
      /** 牌のまとまり。複数渡すと間隔を空けて並ぶ（面子 と 雀頭） */
      readonly groups: readonly (readonly HaiKindId[])[];
      /** 和了牌。待ちの練習だけが持ち、手の内と分けて描く */
      readonly agariHai?: HaiKindId;
      /** 牌の大きさ。3 枚を超えるものは 1 段小さくして幅に収める */
      readonly size?: "xs" | "sm";
    }
  | {
      /**
       * 手牌全体を見て答える練習。14 枚を並べる。
       *
       * 一部を抜き出して「…」で省くこともできるが、それでは手牌を見て
       * 答える練習だと伝わらない（何枚から何を探すのかが出題の中身のため）。
       * 牌はカードの幅に合わせて縮む。
       */
      readonly kind: "hand";
      /** 手牌の MSPZ 表記。読めるように文字列で持ち、牌 ID へは引くときに直す */
      readonly mspz: string;
    }
  | {
      /** 牌が出ず、文言だけが出る出題 */
      readonly kind: "labels";
      /** 状態を表すピル（鳴き）。持たない出題もある */
      readonly pill?: LabelKey;
      readonly text: LabelKey;
    };

interface CatalogVisual {
  readonly subject: Subject;
  readonly unit: AnswerUnit;
  /**
   * 答えの単位に添える、出題があらかじめ示している値。満貫以上の点数計算は
   * 手牌のほかに役と翻数が示されており、点数はその翻数だけで決まる
   * （符を数えない）。手牌だけを写すとその前提が落ちる。
   */
  readonly note?: LabelKey;
}

/**
 * 練習カードの例示 — 「何を見て何を答えるか」を 1 行で写したもの
 * カードの例示
 *
 * @description
 * 練習名と説明文を読むより、中中の 2 枚と「符は？」を見る方が速い。帯は
 * 常に `出題で見えるもの → 答えの単位` の形を取り、全カードが同じ文法で
 * 並ぶようにしている。
 *
 * 手牌 14 枚を見て答える練習（合計符・役の選択・翻数即答・点数即答）は
 * 牌がカードの幅に入らないため、3 枚と「…」で手牌全体を表す。どの牌を
 * 出しても答えは変わらないので、その練習で数える対象（符が付く暗刻・翻が
 * 付く役牌など）を選んでいる。
 *
 * 答えは載せない。ここは練習の対象を見せる場所であって、答えを教える場所
 * ではない。単位だけを「符は？」の形で出す。
 *
 * 一覧に並ぶ練習はすべてここに例示を持つ（`practice-card-visual.test.ts` が
 * 落とす）。1 枚でも欠けると、その練習だけ帯の無い低いカードになる。
 */
const PRACTICE_CARD_VISUALS: Partial<Record<PracticeMenuSlug, CatalogVisual>> =
  {
    // 雀頭 = 同じ牌 2 枚。符が付く側の代表として役牌の対子を出す
    "jantou-fu": {
      subject: { kind: "tiles", groups: [[HaiKind.Chun, HaiKind.Chun]] },
      unit: "fu",
    },
    // 嵌張待ち。5 種の待ちのうち、手の内と和了牌の関係が最も一目で分かる形
    "machi-fu": {
      subject: {
        kind: "tiles",
        groups: [[HaiKind.SouZu3, HaiKind.SouZu5]],
        agariHai: HaiKind.SouZu4,
      },
      unit: "fu",
    },
    // 幺九牌の暗刻。同じ牌 3 枚で、雀頭の 2 枚と枚数で見分けが付く
    "mentsu-fu": {
      subject: {
        kind: "tiles",
        groups: [[HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1]],
      },
      unit: "fu",
    },
    // 面子と雀頭を 1 つずつ。間隔の空いた 2 組が「要素ごとに答える」を表す
    "mentsu-jantou-fu": {
      subject: {
        kind: "tiles",
        groups: [
          [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
          [HaiKind.Chun, HaiKind.Chun],
        ],
        size: "xs",
      },
      unit: "fu",
    },
    // 符の付く暗刻を 2 つ持つ手。符を拾う対象が手牌のどこにあるかを見せる。
    // 字牌に東を使うのは、白が白紙の牌で「画像が出ていない」ように見えるため
    "total-fu": {
      subject: { kind: "hand", mspz: "23499m111p789s111z" },
      unit: "fu",
    },
    // 役名と鳴きの状態だけが出る唯一の練習。牌は 1 枚も出ない。
    // 食い下がりが翻数を変える役を例に取る
    "yaku-han": {
      subject: { kind: "labels", pill: "naki", text: "yakuName" },
      unit: "han",
    },
    // 順子だけの門前手。役が 1 つに定まらない手を出す（すべて選ぶ練習のため）
    yaku: {
      subject: { kind: "hand", mspz: "234567m23455p678s" },
      unit: "yaku",
    },
    // 翻を生む役牌（中）の刻子を持つ手。数える対象は符ではなく役だと示す
    "han-count": {
      subject: { kind: "hand", mspz: "234m456p67899s777z" },
      unit: "han",
    },
    // 符と翻から表を引く練習。手牌は出ず、引くための 2 つの数だけが出る
    "score-table": {
      subject: { kind: "labels", text: "fuHan" },
      unit: "score",
    },
    // 断幺九・平和・一盃口・三色同順で門前 5翻（満貫）の手。翻数は先に
    // 示されるため、手牌と一緒にその翻数も出す
    "mangan-score-calculation": {
      subject: { kind: "hand", mspz: "234m23455p223344s" },
      unit: "score",
      note: "manganHan",
    },
    "score-calculation": {
      subject: { kind: "hand", mspz: "123456m789p23455s" },
      unit: "score",
    },
  };

/** 文言を引き終えた例示 1 件。`PracticeCard` の `visual` prop に渡す */
export interface PracticeCardVisual {
  readonly subject: ResolvedSubject;
  /** 答えの単位（「符は？」） */
  readonly unitLabel: string;
  /** 単位に添える出題の前提（「5翻」）。持たない練習の方が多い */
  readonly note?: string;
}

/** 文言を引き終えた帯の左側 */
export type ResolvedSubject =
  | Extract<Subject, { kind: "tiles" }>
  | {
      readonly kind: "hand";
      readonly tiles: readonly HaiKindId[];
    }
  | {
      readonly kind: "labels";
      readonly pill?: string;
      readonly text: string;
    };

/**
 * カタログの練習を `PracticeCard` の `visual` prop に変換する
 * 例示の組み立て
 *
 * 練習一覧とダッシュボードのおすすめ練習が同じカードを使うため、文言の
 * 引き方を両方で書き起こさないようここにまとめる（`practiceCardRank` と
 * 同じ役割）。カードの中で辞書を引かないのは、カードを非同期にすると
 * サーバーコンポーネントを関数として呼ぶテストから描画できなくなるため。
 *
 * @param slug 練習スラッグ
 * @param t `practice` 名前空間の翻訳関数
 */
export function practiceCardVisual(
  slug: PracticeMenuSlug,
  t: PracticeTranslator,
): PracticeCardVisual | undefined {
  const visual = PRACTICE_CARD_VISUALS[slug];
  if (visual === undefined) return undefined;

  return {
    subject: resolveSubject(visual.subject, t),
    unitLabel: t(`cardExample.units.${visual.unit}`),
    note:
      visual.note === undefined ? undefined : t(`cardExample.${visual.note}`),
  };
}

/** 帯の左側の文言と牌を引く */
function resolveSubject(
  subject: Subject,
  t: PracticeTranslator,
): ResolvedSubject {
  if (subject.kind === "tiles") return subject;
  if (subject.kind === "hand") {
    return { kind: "hand", tiles: parseHais(subject.mspz) };
  }
  return {
    kind: "labels",
    pill:
      subject.pill === undefined ? undefined : t(`cardExample.${subject.pill}`),
    text: t(`cardExample.${subject.text}`),
  };
}

/**
 * その練習が例示を持つか。
 * 例示の有無
 *
 * 一覧に並ぶ練習がすべて例示を持つことをテストで確かめるための入口。
 */
export function hasPracticeCardVisual(slug: PracticeMenuSlug): boolean {
  return PRACTICE_CARD_VISUALS[slug] !== undefined;
}
