import {
  MentsuType,
  isYaochu,
  type HaiKindId,
  type Kazehai,
  type ScoreDetail,
} from "@pai-forge/riichi-mahjong";
import {
  calculateMentsuFu,
  isOpenMentsuForFu,
} from "../core/score-calculation";
import { jantouFuReasons } from "../problem/shared/jantou-fu";
import { openLabel, yaochuLabel } from "../problem/shared/mentsu-labels";

/** 符が付く待ち形の日本語ラベル */
const MACHI_LABELS: Readonly<Record<string, string>> = {
  Tanki: "単騎待ち",
  Kanchan: "嵌張待ち",
  Penchan: "辺張待ち",
};

/**
 * 符計算の内訳詳細
 * 符内訳
 */
export interface FuDetail {
  /** 理由（例: 副底, 中張牌 暗刻 等） */
  readonly reason: string;
  /** 符数 */
  readonly fu: number;
}

/**
 * ライブラリの ScoreDetail から表示用の FuDetail[] を構築する
 *
 * ライブラリが選択した最適構造の符内訳をそのまま使用するため、
 * answer.fu と fuDetails の合計が必ず一致する
 * 符内訳変換
 *
 * @param detail - ライブラリの ScoreDetail
 * @param config - 和了状況（和了牌、ツモ/ロン、場風、自風）
 */
export function convertScoreDetailToFuDetails(
  detail: Readonly<ScoreDetail>,
  config: {
    readonly agariHai: HaiKindId;
    readonly isTsumo: boolean;
    readonly bakaze: Kazehai;
    readonly jikaze: Kazehai;
  },
): FuDetail[] {
  const { fuResult, structure, machiType } = detail;
  const { details } = fuResult;

  // 七対子
  if (structure.type === "Chiitoitsu") {
    return [{ reason: "七対子", fu: 25 }];
  }

  // 国士無双（便宜上）
  if (structure.type === "Kokushi") {
    return [{ reason: "副底", fu: 20 }];
  }

  // 平和ツモの特例（符合計が20符の場合）
  if (fuResult.total === 20 && config.isTsumo) {
    return [{ reason: "平和ツモ", fu: 20 }];
  }

  const result: FuDetail[] = [];

  // 副底
  result.push({ reason: "副底", fu: details.base });

  // 和了符
  if (details.agari > 0) {
    if (config.isTsumo) {
      result.push({ reason: "ツモ", fu: details.agari });
    } else {
      result.push({ reason: "門前加符", fu: details.agari });
    }
  }

  // 面子符（個別の面子の内訳を構造から復元）
  if (details.mentsu > 0 && structure.type === "Mentsu") {
    for (const mentsu of structure.fourMentsu) {
      if (mentsu.type === MentsuType.Shuntsu) continue;

      const isYao = isYaochu(mentsu.hais[0]);

      // 明暗の判定（ライブラリの符計算ロジックと同一）
      const isOpen = isOpenMentsuForFu(mentsu, config);

      const fu = calculateMentsuFu({
        isKantsu: mentsu.type === MentsuType.Kantsu,
        isOpen,
        isYaochu: isYao,
      });

      const typeLabel = mentsu.type === MentsuType.Kantsu ? "槓子" : "刻子";

      result.push({
        reason: `${yaochuLabel(isYao)}${openLabel(isOpen)}${typeLabel}`,
        fu,
      });
    }
  }

  // 雀頭符
  if (details.jantou > 0 && structure.type === "Mentsu") {
    const pair = structure.jantou.hais[0];
    const reasons = jantouFuReasons(pair, config.bakaze, config.jikaze);

    result.push({
      reason: `雀頭(${reasons.join("・")})`,
      fu: details.jantou,
    });
  }

  // 待ち符
  if (details.machi > 0) {
    const machiLabel =
      machiType !== undefined ? MACHI_LABELS[machiType] : undefined;
    result.push({ reason: machiLabel ?? "待ち", fu: details.machi });
  }

  // 喰い平和の特例（合計20符を30符に切り上げ）
  const rawSum = result.reduce((acc, d) => acc + d.fu, 0);
  if (rawSum === 20 && !config.isTsumo) {
    result.push({ reason: "特例等の加符", fu: 10 });
  }

  return result;
}
