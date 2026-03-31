import {
  HaiKind,
  parseExtendedMspz,
  parseMspz,
  calculateScoreForTehai,
  detectYaku,
  isTehai14,
  type HaiKindId,
  type Kazehai,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import type { DrillQuestion, YakuDetail } from "./types";
import { recalculateScore } from "../../score/calculator";
import { convertScoreDetailToFuDetails } from "../../score/fu-calculator";
import { countDoraInTehai } from "../../core/hai-names";
import { getYakuNameJa } from "../../core/constants";

/**
 * クエリパラメータからの問題生成結果
 * クエリ結果
 */
export type QueryResult =
  | { readonly type: "success"; readonly question: DrillQuestion }
  | { readonly type: "error"; readonly message: string };

/**
 * URLクエリパラメータから問題を生成する
 * クエリパラメータ問題生成
 *
 * @param params - URLSearchParams
 * @returns 生成結果（パラメータなしの場合は undefined）
 */
export function generateQuestionFromQuery(params: URLSearchParams): QueryResult | undefined {
  try {
    const tehaiStr = params.get("tehai")?.replace(/\s/g, "");
    const agariStr = params.get("agari")?.replace(/\s/g, "");
    const isTsumoStr = params.get("tsumo")?.trim();
    const doraStr = params.get("dora")?.replace(/\s/g, "");
    const uraDoraStr = params.get("ura")?.replace(/\s/g, "");
    const riichiStr = params.get("riichi")?.trim();
    const baStr = params.get("ba")?.replace(/\s/g, "");
    const jiStr = params.get("ji")?.replace(/\s/g, "");

    if (!tehaiStr && !agariStr && !doraStr) return undefined;
    if (!tehaiStr || !agariStr) return { type: "error", message: "tehai, agari parameters are required." };

    // 手牌のパース
    let tehai: Tehai14;
    const extResult = parseExtendedMspz(tehaiStr);
    if (extResult.isOk()) {
      if (!isTehai14(extResult.value)) {
        return { type: "error", message: "Invalid tehai: not a valid 14-tile hand." };
      }
      tehai = extResult.value;
    } else {
      const stdResult = parseMspz(tehaiStr);
      if (stdResult.isErr()) {
        return { type: "error", message: `Invalid Extended MSPZ string: ${tehaiStr}` };
      }
      if (!isTehai14(stdResult.value)) {
        return { type: "error", message: "Invalid tehai: not a valid 14-tile hand." };
      }
      tehai = stdResult.value;
    }

    // ドラ表示牌リスト
    const doraMarkers = parseHais(doraStr);
    const kantsuCount = tehai.exposed.filter((m) => m.type === "Kantsu").length;
    const requiredMarkerCount = 1 + kantsuCount;

    if (doraMarkers.length !== requiredMarkerCount) {
      return {
        type: "error",
        message: `Invalid dora count. Expected ${requiredMarkerCount} tiles for ${kantsuCount} kantsu.`,
      };
    }

    const isRiichi = riichiStr === "true";
    const isTsumo = isTsumoStr === "true";

    if (isRiichi) {
      const uraDoraMarkers = uraDoraStr ? parseHais(uraDoraStr) : [];

      if (uraDoraMarkers.length !== requiredMarkerCount) {
        return {
          type: "error",
          message: `Invalid ura dora count. Expected ${requiredMarkerCount} tiles for ${kantsuCount} kantsu with Riichi.`,
        };
      }
    }

    // 和了牌のパース
    let agariHai: HaiKindId | undefined;
    const agariResult = parseMspz(agariStr);
    if (agariResult.isOk()) {
      agariHai = agariResult.value.closed[0];
    } else {
      const agariExtResult = parseExtendedMspz(agariStr);
      if (agariExtResult.isOk()) {
        agariHai = agariExtResult.value.closed[0];
      } else {
        return undefined;
      }
    }

    if (agariHai === undefined) return undefined;

    const bakaze = parseKazehai(baStr) ?? HaiKind.Ton;
    const jikaze = parseKazehai(jiStr) ?? HaiKind.Ton;

    const uraDoraMarkers = uraDoraStr ? parseHais(uraDoraStr) : undefined;
    const isOya = jikaze === HaiKind.Ton;

    const answer = calculateScoreForTehai(tehai, {
      agariHai,
      isTsumo,
      jikaze,
      bakaze,
      doraMarkers,
    });

    if (answer.han === 0) return { type: "error", message: "No yaku (Yaku Nashi)." };

    const yakuResult = detectYaku(tehai, { agariHai, bakaze, jikaze, doraMarkers, uraDoraMarkers, isTsumo });
    const yakuDetails: YakuDetail[] = yakuResult.map(([name, han]) => ({
      name: getYakuNameJa(name),
      han,
    }));

    // リーチ・裏ドラの加算
    let finalAnswer = answer;
    if (isRiichi) {
      const addedHan = 1;
      const uraDoraHan = uraDoraMarkers ? countDoraInTehai(tehai, uraDoraMarkers) : 0;

      finalAnswer = recalculateScore(answer, answer.han + addedHan + uraDoraHan, { isTsumo, isOya });

      yakuDetails.unshift({ name: "立直", han: 1 });
      if (uraDoraHan > 0) {
        yakuDetails.push({ name: "裏ドラ", han: uraDoraHan });
      }
    }

    // ドラ（表ドラ）の加算
    const doraHan = countDoraInTehai(tehai, doraMarkers);

    if (doraHan > 0) {
      yakuDetails.push({ name: "ドラ", han: doraHan });
    }

    return {
      type: "success",
      question: {
        tehai,
        agariHai,
        isTsumo,
        jikaze,
        bakaze,
        doraMarkers,
        isRiichi,
        uraDoraMarkers,
        answer: finalAnswer,
        fuDetails: answer.detail
          ? convertScoreDetailToFuDetails(answer.detail, { agariHai, isTsumo, bakaze, jikaze })
          : undefined,
        yakuDetails,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error occurred during parsing.";
    return { type: "error", message };
  }
}

/**
 * DrillQuestion から URL（Path + Query）を生成する
 * 問題URLパス生成
 */
export function generatePathAndQueryFromQuestion(question: Readonly<DrillQuestion>): string {
  const params = buildDrillQueryParams(question);
  return `/problems/score/play?${params.toString()}`;
}

/**
 * DrillQuestion から URLSearchParams を構築する
 * ドリルクエリパラメータ構築
 */
export function buildDrillQueryParams(question: Readonly<DrillQuestion>): URLSearchParams {
  const params = new URLSearchParams();

  params.set("tehai", tehaiToMspz(question.tehai));

  params.set("agari", haiIdToMspz(question.agariHai));

  if (question.doraMarkers.length > 0) {
    params.set("dora", question.doraMarkers.map((id) => haiIdToMspz(id)).join(""));
  }

  if (question.uraDoraMarkers && question.uraDoraMarkers.length > 0) {
    params.set("ura", question.uraDoraMarkers.map((id) => haiIdToMspz(id)).join(""));
  }

  if (question.isTsumo) params.set("tsumo", "true");
  if (question.isRiichi) params.set("riichi", "true");

  params.set("ba", kazeIdToMspz(question.bakaze));
  params.set("ji", kazeIdToMspz(question.jikaze));

  return params;
}

/**
 * 牌種IDをMSPZ文字列に変換する
 * 牌ID→MSPZ変換
 */
function haiIdToMspz(id: HaiKindId): string {
  if (id >= 0 && id <= 8) return `${id + 1}m`;
  if (id >= 9 && id <= 17) return `${id - 9 + 1}p`;
  if (id >= 18 && id <= 26) return `${id - 18 + 1}s`;
  if (id >= 27 && id <= 33) return `${id - 27 + 1}z`;
  return "1m";
}

/**
 * 風牌IDをMSPZ文字列に変換する
 * 風牌ID→MSPZ変換
 */
function kazeIdToMspz(id: Kazehai): string {
  if (id === HaiKind.Ton) return "1z";
  if (id === HaiKind.Nan) return "2z";
  if (id === HaiKind.Sha) return "3z";
  if (id === HaiKind.Pei) return "4z";
  return "1z";
}

/**
 * 手牌をMSPZ文字列に変換する
 * 手牌→MSPZ変換
 */
function tehaiToMspz(tehai: Tehai14): string {
  let result = "";
  const mans: number[] = [];
  const pins: number[] = [];
  const sous: number[] = [];
  const zis: number[] = [];

  const sortAndPush = (id: HaiKindId) => {
    if (id >= 0 && id <= 8) mans.push(id + 1);
    else if (id >= 9 && id <= 17) pins.push(id - 9 + 1);
    else if (id >= 18 && id <= 26) sous.push(id - 18 + 1);
    else if (id >= 27 && id <= 33) zis.push(id - 27 + 1);
  };

  for (const h of tehai.closed) sortAndPush(h);

  mans.sort((a, b) => a - b);
  pins.sort((a, b) => a - b);
  sous.sort((a, b) => a - b);
  zis.sort((a, b) => a - b);

  if (mans.length) result += mans.join("") + "m";
  if (pins.length) result += pins.join("") + "p";
  if (sous.length) result += sous.join("") + "s";
  if (zis.length) result += zis.join("") + "z";

  for (const meld of tehai.exposed) {
    let meldStr = "";
    const mMans: number[] = [];
    const mPins: number[] = [];
    const mSous: number[] = [];
    const mZis: number[] = [];

    const mSortAndPush = (id: HaiKindId) => {
      if (id >= 0 && id <= 8) mMans.push(id + 1);
      else if (id >= 9 && id <= 17) mPins.push(id - 9 + 1);
      else if (id >= 18 && id <= 26) mSous.push(id - 18 + 1);
      else if (id >= 27 && id <= 33) mZis.push(id - 27 + 1);
    };

    for (const h of meld.hais) mSortAndPush(h);
    mMans.sort((a, b) => a - b);
    mPins.sort((a, b) => a - b);
    mSous.sort((a, b) => a - b);
    mZis.sort((a, b) => a - b);

    if (mMans.length) meldStr += mMans.join("") + "m";
    if (mPins.length) meldStr += mPins.join("") + "p";
    if (mSous.length) meldStr += mSous.join("") + "s";
    if (mZis.length) meldStr += mZis.join("") + "z";

    if (meld.type === "Kantsu" && !meld.furo) {
      // 暗槓: (...) 表記
      result += `(${meldStr})`;
    } else {
      // 副露（チー・ポン・大明槓）: [...] 表記
      result += `[${meldStr}]`;
    }
  }

  return result;
}

/**
 * 牌文字列（MSPZ）をIDリストに変換する
 * MSPZ→牌IDリスト変換
 */
function parseHais(str: string | undefined): HaiKindId[] {
  if (!str) return [];
  const result = parseMspz(str);
  if (result.isOk()) return [...result.value.closed];

  const extResult = parseExtendedMspz(str);
  if (extResult.isOk()) return [...extResult.value.closed];

  return [];
}

/**
 * 風牌文字列をIDに変換する
 * 風牌文字列→ID変換
 */
function parseKazehai(str: string | undefined): Kazehai | undefined {
  if (!str) return undefined;
  const result = parseMspz(str);
  if (result.isErr()) return undefined;

  const id = result.value.closed[0];
  if (id === HaiKind.Ton || id === HaiKind.Nan || id === HaiKind.Sha || id === HaiKind.Pei) {
    return id;
  }
  return undefined;
}
