import {
  MentsuType,
  HaiKind,
  isYaochu,
  type HaiKindId,
  type Kazehai,
  type ScoreDetail,
} from "@pai-forge/riichi-mahjong";

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
      let isOpen = !!mentsu.furo;
      if (!isOpen && !config.isTsumo && mentsu.type === MentsuType.Koutsu) {
        // ロン和了で、和了牌を含む刻子は明刻扱い（シャンポン待ち）
        if (mentsu.hais.includes(config.agariHai)) {
          isOpen = true;
        }
      }

      // 符の計算
      let fu: number;
      if (mentsu.type === MentsuType.Kantsu) {
        fu = isYao ? (mentsu.furo ? 16 : 32) : (mentsu.furo ? 8 : 16);
      } else {
        // 刻子
        fu = isYao ? (isOpen ? 4 : 8) : (isOpen ? 2 : 4);
      }

      const typeLabel = mentsu.type === MentsuType.Kantsu ? "槓子" : "刻子";
      const yaoLabel = isYao ? "么九牌" : "中張牌";
      const openLabel = isOpen ? "明" : "暗";

      result.push({ reason: `${yaoLabel}${openLabel}${typeLabel}`, fu });
    }
  }

  // 雀頭符
  if (details.jantou > 0 && structure.type === "Mentsu") {
    const pair = structure.jantou.hais[0];
    const pairNamePart: string[] = [];

    if (pair === config.bakaze) pairNamePart.push("場風");
    if (pair === config.jikaze) pairNamePart.push("自風");
    if (pair === HaiKind.Haku || pair === HaiKind.Hatsu || pair === HaiKind.Chun) {
      pairNamePart.push("三元牌");
    }

    result.push({ reason: `雀頭(${pairNamePart.join("・")})`, fu: details.jantou });
  }

  // 待ち符
  if (details.machi > 0) {
    const machiLabel = machiType === "Tanki" ? "単騎待ち"
      : machiType === "Kanchan" ? "嵌張待ち"
      : machiType === "Penchan" ? "辺張待ち"
      : "待ち";
    result.push({ reason: machiLabel, fu: details.machi });
  }

  // 喰い平和の特例（合計20符を30符に切り上げ）
  const rawSum = result.reduce((acc, d) => acc + d.fu, 0);
  if (rawSum === 20 && !config.isTsumo) {
    result.push({ reason: "特例等の加符", fu: 10 });
  }

  return result;
}
