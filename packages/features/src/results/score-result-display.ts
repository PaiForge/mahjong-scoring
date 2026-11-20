import { judgeYakuSelection } from "@mahjong-scoring/core";
import type {
  FuDetail,
  ScoreQuestion,
  YakuSelectionJudgement,
} from "@mahjong-scoring/core";

import type { FuHanOrder } from "../settings/fu-han-order";
import { yakuLabel } from "../yaku/yaku-labels";
import {
  resolveBreakdownTabs,
  type BreakdownJudgement,
  type BreakdownKind,
} from "./breakdown-tabs";
import { fuReasonLabel, type FuReasonTranslator } from "./fu-reason-label";
import { resolveFuVisibility } from "./fu-visibility";
import { orderYakuDetails } from "./order-yaku-details";

/** 内訳の 1 行（役名・符の理由と、その翻数・符） */
export interface ScoreResultDetailItem {
  readonly name: string;
  readonly value: number;
}

/** 内訳の行とその合計（切り上げ・役満への丸めの前） */
export interface ScoreResultBreakdown {
  readonly items: readonly ScoreResultDetailItem[];
  readonly total: number;
}

/** 点数計算の答え合わせに並べる値 */
export interface ScoreResultDisplay {
  /** 「あなたの回答」列の役（選んで合っていた / 余分だった）。選び忘れは含まない */
  readonly answeredYakuJudgements: readonly YakuSelectionJudgement[];
  /** 「正解」列の役（選んで合っていた / 選び忘れた）。余分に選んだ役は含まない */
  readonly correctYakuJudgements: readonly YakuSelectionJudgement[];
  /** 翻数の内訳。役の並び順の設定どおり。内訳が無い・空なら undefined */
  readonly yakuBreakdown: ScoreResultBreakdown | undefined;
  /** 符の内訳。出題が符の内訳を持たなければ undefined */
  readonly fuBreakdown: ScoreResultBreakdown | undefined;
}

/**
 * 点数計算の答え合わせに並べる値を組み立てる
 * 点数計算結果表示
 *
 * 役は「合っていた / 余分だった / 選び忘れた」を役ごとに見せる。1 つ余分な
 * だけで回答全体が赤くなると、合っていた役まで間違いに見えてしまうため。
 * 判定は {@link judgeYakuSelection} の結果を回答側・正解側の列に振り分ける
 * だけで、並び（正解の役 → 余分に選んだ役）はそのまま残す。
 *
 * 翻数の内訳は結果ページの内訳表と同じく、設定の役の並び順に載せ替える
 * （ライブラリの判定順のままだと問題ごとに同じ役の位置が変わる）。
 *
 * 内訳を出すかの境目は翻数と符で違う。翻数は行が 1 つも無ければ出さず、符は
 * 出題が内訳を持つかで決める（web・モバイルの `ResultDisplay` の約束）。
 *
 * @param question - 出題
 * @param userYakus - 選んだ役。無回答の正解開示では undefined（何も選んでいない扱い）
 * @param yakuOrder - 表示に使う役の並び（`useYakuOrder` の戻り値）
 */
export function buildScoreResultDisplay(
  question: Readonly<ScoreQuestion>,
  userYakus: readonly string[] | undefined,
  yakuOrder: readonly string[],
): ScoreResultDisplay {
  const yakuJudgements = judgeYakuSelection(question, userYakus ?? []);

  const yakuItems = orderYakuDetails(question.yakuDetails, yakuOrder).map(
    (detail) => ({ name: detail.name, value: detail.han }),
  );

  return {
    answeredYakuJudgements: yakuJudgements.filter(
      (judgement) => judgement.state !== "missed",
    ),
    correctYakuJudgements: yakuJudgements.filter(
      (judgement) => judgement.state !== "incorrect",
    ),
    yakuBreakdown:
      yakuItems.length > 0
        ? { items: yakuItems, total: sumValues(yakuItems) }
        : undefined,
    fuBreakdown:
      question.fuDetails === undefined
        ? undefined
        : buildFuItems(question.fuDetails),
  };
}

/** 答え合わせの内訳の切り替え 1 つ分（翻数の内訳 / 符の内訳） */
export interface ScoreResultBreakdownTab {
  readonly kind: BreakdownKind;
  readonly breakdown: ScoreResultBreakdown;
}

/** 答え合わせの符の行と内訳の切り替え */
export interface ScoreResultBreakdownLayout {
  /** 符の行（正解の符と回答の符）を出すか */
  readonly showsFu: boolean;
  /** 内訳の切り替え。表記順に並ぶ。内訳が 1 つも無ければ空 */
  readonly tabs: readonly ScoreResultBreakdownTab[];
  /** 開いたときに選ぶ種類 */
  readonly initial: BreakdownKind | undefined;
}

/**
 * 点数計算の答え合わせで、符の行を出すかと内訳の切り替えを決める
 * 点数計算結果内訳
 *
 * 満貫以上は符の行を出さず、符で満貫に届いた手は内訳だけ出す
 * （{@link resolveFuVisibility}）。並びと開いたときの選択は
 * {@link resolveBreakdownTabs}。web・モバイルの `ResultDisplay` が共有し、
 * 各タブの見出しと表はプラットフォームの部品が組み立てる。
 *
 * @param answer - 正解の点数計算結果
 * @param display - {@link buildScoreResultDisplay} の戻り値
 * @param options.order - 符と翻の表記順
 * @param options.requireFuForMangan - 満貫以上でも符を答えさせる設定か
 * @param options.judgement - 翻数・符の正誤。無回答の正解開示では undefined
 */
export function resolveScoreResultBreakdown(
  answer: Pick<ScoreQuestion["answer"], "han" | "scoreLevel">,
  display: Pick<ScoreResultDisplay, "yakuBreakdown" | "fuBreakdown">,
  options: {
    readonly order: FuHanOrder;
    readonly requireFuForMangan: boolean;
    readonly judgement: BreakdownJudgement | undefined;
  },
): ScoreResultBreakdownLayout {
  const { row: showsFu, breakdown: showsFuBreakdown } = resolveFuVisibility(
    answer,
    { requireFuForMangan: options.requireFuForMangan },
  );
  const fuBreakdown = showsFuBreakdown ? display.fuBreakdown : undefined;
  const { yakuBreakdown } = display;
  const { kinds, initial } = resolveBreakdownTabs(
    options.order,
    { han: yakuBreakdown !== undefined, fu: fuBreakdown !== undefined },
    options.judgement,
  );
  const tabs = kinds.flatMap((kind): ScoreResultBreakdownTab[] => {
    const breakdown = kind === "han" ? yakuBreakdown : fuBreakdown;
    return breakdown === undefined ? [] : [{ kind, breakdown }];
  });
  return { showsFu, tabs, initial };
}

/** `agariScore` の辞書を引く翻訳関数のうち、内訳の区画の見出しと単位の 4 語 */
export type ScoreResultBreakdownTranslator = (
  key:
    | "form.labels.han"
    | "form.labels.fu"
    | "form.options.hanSuffix"
    | "form.options.fuSuffix",
) => string;

/** 答え合わせの内訳の区画 1 つ分（見出しと、表に渡す値） */
export interface ScoreResultBreakdownSection {
  readonly kind: BreakdownKind;
  /** 切り替えの見出し。「翻数 3翻」「符 40符」のように正解の値を添える */
  readonly tabLabel: string;
  readonly table: {
    readonly items: readonly ScoreResultDetailItem[];
    /** 内訳の合計（切り上げ・役満への丸めの前） */
    readonly total: number;
    /** 行と合計の単位（翻 / 符） */
    readonly suffix: string;
    /** 符だけ: 切り上げ後の符（合計と違うときに添える） */
    readonly roundedTotal: number | undefined;
    /** 翻数だけ: 役の名前を押すと役一覧をその役で開く */
    readonly opensYakuList: boolean;
  };
}

/**
 * 答え合わせの内訳の切り替えを、展開エリアに並べる区画に組む
 * 点数計算結果内訳区画
 *
 * 見出しは正解の値を添え、翻数の表は役一覧へ、符の表は切り上げ後の符を持つ。
 * 表の描画は web・モバイルの `ResultBreakdownTable` で、ここは渡す値だけを決める。
 *
 * @param tabs - {@link resolveScoreResultBreakdown} の `tabs`
 * @param answer - 正解の翻数と符
 * @param hanDisplay - 翻数の表記（役満の呼び方を含む）
 * @param t - `agariScore` 名前空間の翻訳関数
 */
export function buildScoreResultBreakdownSections(
  tabs: readonly ScoreResultBreakdownTab[],
  answer: Pick<ScoreQuestion["answer"], "han" | "fu">,
  hanDisplay: (han: number) => string,
  t: ScoreResultBreakdownTranslator,
): readonly ScoreResultBreakdownSection[] {
  return tabs.map(({ kind, breakdown }) =>
    kind === "han"
      ? {
          kind,
          tabLabel: `${t("form.labels.han")} ${hanDisplay(answer.han)}`,
          table: {
            items: breakdown.items,
            total: breakdown.total,
            suffix: t("form.options.hanSuffix"),
            roundedTotal: undefined,
            opensYakuList: true,
          },
        }
      : {
          kind,
          tabLabel: `${t("form.labels.fu")} ${answer.fu}${t("form.options.fuSuffix")}`,
          table: {
            items: breakdown.items,
            total: breakdown.total,
            suffix: t("form.options.fuSuffix"),
            roundedTotal: answer.fu,
            opensYakuList: false,
          },
        },
  );
}

/**
 * 内訳の行に、今の言語で出す文言を添えたもの
 *
 * `label` を持たない行は `name`（core の文言）をそのまま出す。役一覧の着地先は
 * 訳ではなく `name` で解決するので、`name` は書き換えない。
 */
export interface LabeledScoreResultDetailItem extends ScoreResultDetailItem {
  /** 行に出す文言（今の言語の辞書で引いたもの） */
  readonly label?: string;
}

/**
 * 内訳の行の文言を今の言語の辞書で引くのに使う翻訳関数
 * 内訳行の翻訳関数
 */
export interface ScoreResultBreakdownItemTranslators {
  /** `yakuNames` 名前空間の翻訳関数（{@link yakuLabel}） */
  readonly tYakuNames: (key: string) => string;
  /** `challenge.fuBreakdown` 名前空間の翻訳関数（{@link fuReasonLabel}） */
  readonly tFuReason: FuReasonTranslator;
}

/**
 * 内訳の行に、今の言語の文言を添える
 * 内訳行の文言付け
 *
 * {@link buildScoreResultBreakdownSections} は core の日本語（役名・符の理由）を
 * `name` に載せる。英語の画面に漢字を残さないため、web・モバイルの
 * `useResultBreakdownSections` はこれを通して `label` を足してから表に渡す。
 *
 * - 翻数の行: 役名を `yakuNames` で引く
 * - 符の行: 出題の `fuDetails` の構造から `challenge.fuBreakdown` で引く。符の行は
 *   `fuDetails` と同じ順・同じ数で組まれるため添字で対応させる。`fuDetails` を
 *   渡さないとき・対応する行が無いときは `label` を足さない（core の文言のまま出る）
 *
 * 日本語の辞書の値は core の文言と同じなので、日本語の表示は変わらない。
 *
 * @param kind - 内訳の種類（翻数 / 符）
 * @param items - 内訳の行
 * @param fuDetails - 出題の符の内訳
 * @param translators - 役名と符の理由の翻訳関数
 */
export function labelScoreResultBreakdownItems(
  kind: BreakdownKind,
  items: readonly ScoreResultDetailItem[],
  fuDetails: readonly FuDetail[] | undefined,
  { tYakuNames, tFuReason }: ScoreResultBreakdownItemTranslators,
): readonly LabeledScoreResultDetailItem[] {
  return items.map((item, index) => {
    if (kind === "han")
      return { ...item, label: yakuLabel(item.name, tYakuNames) };
    const detail = fuDetails?.[index];
    return detail === undefined
      ? item
      : { ...item, label: fuReasonLabel(detail, tFuReason) };
  });
}

function buildFuItems(
  fuDetails: NonNullable<ScoreQuestion["fuDetails"]>,
): ScoreResultBreakdown {
  const items = fuDetails.map((detail) => ({
    name: detail.reason,
    value: detail.fu,
  }));
  return { items, total: sumValues(items) };
}

function sumValues(items: readonly ScoreResultDetailItem[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}
