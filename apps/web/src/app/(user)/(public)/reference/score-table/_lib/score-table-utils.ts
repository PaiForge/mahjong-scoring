import {
  clampHanToYakuman,
  FU_VALUES,
  isFu,
  isRole,
  isWinType,
  scoreTierForHan,
} from "@mahjong-scoring/core";
import type { Fu, Role, WinType } from "@mahjong-scoring/core";

/** 符×翻表の翻数列（1〜4翻）。5翻以上は満貫以上の表が受け持つ */
export const HAN_COLS = [1, 2, 3, 4] as const;

/** 符×翻表の符行（20〜110符） */
export const FU_ROWS = FU_VALUES;

/** 点数表の表示モード（符×翻 / 満貫以上） */
export type ScoreTableViewMode = "normal" | "high_score";

/**
 * 点数表で注目させる和了（親子・ロンツモ・翻・符）
 * 点数表フォーカス
 *
 * 練習の答え合わせや結果一覧から「この和了は表のどこか」を指すための値。
 * 表示モードの初期値とハイライト対象の解決は
 * {@link resolveScoreTableFocus} が行う。
 */
export interface ScoreTableFocus {
  readonly role: Role;
  readonly winType: WinType;
  readonly han: number;
  /** 満貫以上で符が意味を持たない場合は undefined */
  readonly fu: Fu | undefined;
}

/** 符×翻表でハイライトするセル（翻の列 × 符の行） */
export interface NormalCellHighlight {
  readonly han: number;
  readonly fu: Fu;
}

/** focus を表の初期表示モードとハイライト対象に解決した結果 */
export interface ScoreTableFocusTarget {
  readonly viewMode: ScoreTableViewMode;
  /** 符×翻表のハイライト対象（viewMode が "normal" のときのみ） */
  readonly normalCell: NormalCellHighlight | undefined;
  /** 満貫以上の表でハイライトする区分キー（viewMode が "high_score" のときのみ） */
  readonly highScoreKey: string | undefined;
}

const NO_TARGET: ScoreTableFocusTarget = {
  viewMode: "normal",
  normalCell: undefined,
  highScoreKey: undefined,
};

/**
 * focus から表の初期表示モードとハイライト対象を解決する
 * ハイライト対象解決
 *
 * 4翻以下で符があるものは符×翻表のセルを指す（4翻の切り上げ満貫・
 * 70符以上の満貫もセル自体は存在し「満貫」と表示されるため、符の行を
 * 読む練習として符×翻表側を見せる）。5翻以上は符に依存しないため
 * 満貫以上の表の区分行を指す。
 */
export function resolveScoreTableFocus(
  focus: ScoreTableFocus | undefined,
): ScoreTableFocusTarget {
  if (focus === undefined) return NO_TARGET;

  if (focus.fu !== undefined && HAN_COLS.some((han) => han === focus.han)) {
    return {
      viewMode: "normal",
      normalCell: { han: focus.han, fu: focus.fu },
      highScoreKey: undefined,
    };
  }

  const tier = scoreTierForHan(clampHanToYakuman(focus.han));
  if (tier === undefined) return NO_TARGET;

  return {
    viewMode: "high_score",
    normalCell: undefined,
    highScoreKey: tier.key,
  };
}

interface ParseScoreTableFocusParams {
  readonly role: string | null;
  readonly winType: string | null;
  readonly han: string | null;
  readonly fu: string | null;
}

/**
 * クエリパラメータから focus を組み立てる
 * クエリフォーカス解析
 *
 * role / winType が不正・欠落なら子・ロンにフォールバックする
 * （タブ初期値も兼ねるため、翻・符が無くても値を返せる必要がある）。
 * han が欠落・不正なら focus 全体を undefined にする。
 * fu は有効な符の値でなければ無視する（満貫以上のリンクは fu を持たない）。
 */
export function parseScoreTableFocusFromParams(
  params: ParseScoreTableFocusParams,
): ScoreTableFocus | undefined {
  const role: Role =
    params.role !== null && isRole(params.role) ? params.role : "ko";
  const winType: WinType =
    params.winType !== null && isWinType(params.winType)
      ? params.winType
      : "ron";

  if (params.han === null) return undefined;
  const han = Number(params.han);
  if (!Number.isInteger(han) || han < 1) return undefined;

  const fuValue = params.fu === null ? Number.NaN : Number(params.fu);
  const fu = isFu(fuValue) ? fuValue : undefined;

  return { role, winType, han, fu };
}
