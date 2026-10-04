import {
  FU_VALUES,
  HaiKind,
  calculateTotalFu,
  parseTehai,
  validateTehai14,
  type AgariContext,
  type HaiKindId,
  type Kazehai,
  type Tehai14,
} from "@mahjong-scoring/core";

import type { LessonQuestion, LessonQuiz } from "./quiz";

/** 出題する手牌 1 つ（牌は Extended MSPZ。副露は `[...]`） */
interface TehaiFuQuestionSource {
  readonly key: string;
  readonly mspz: string;
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
}

/**
 * 確認問題で問う手牌（出題順）
 *
 * 1 問目で積み上げと切り上げを確かめ、2〜4 問目で章の「よくある間違い」を
 * 1 つずつ確かめる。どの手も、間違えると切り上げの段が変わって答えが
 * 1 つずれるように符を組んである（間違えても切り上げで同じ答えに
 * 収まる手では、その間違いを確かめられない）。
 * 1. 副露ロン: 副底 20 + 白の明刻 4 + 嵌張 2 = 26 → 30 符（副露のロンには
 *    和了の符が付かない。切り上げ）
 * 2. 副露ツモ: 1 問目の形に暗刻を足してツモ。20 + ツモ 2 + 4 + 暗刻 4 + 2
 *    = 32 → 40 符（ツモ符を忘れると 30 符）
 * 3. 双碰のロン: 門前ロン 30 + 么九牌の暗刻 8 × 2 + ロンで完成した白の
 *    刻子は明刻 4 = 50 符（暗刻と数えると 54 → 60 符）
 * 4. 南場の雀頭: 南場・西家のツモ。20 + 2 + 九萬の暗刻 8 + 南の雀頭（場風）2
 *    = 32 → 40 符（東を場風と取り違えて南を 0 符にすると 30 符）
 * 役は和了に必要なので、白（役牌）か門前ツモで持たせる。連風牌は設定で
 * 符が割れるので、場風と自風は必ず別にする。
 */
const QUESTIONS: readonly TehaiFuQuestionSource[] = [
  {
    key: "furoRon",
    mspz: "234m22m567p46s[555z]",
    agariHai: HaiKind.SouZu5,
    isTsumo: false,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
  },
  {
    key: "furoTsumo",
    mspz: "234m22m888p46s[555z]",
    agariHai: HaiKind.SouZu5,
    isTsumo: true,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
  },
  {
    key: "shanponRon",
    mspz: "999m111p567s33s55z",
    agariHai: HaiKind.Haku,
    isTsumo: false,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
  },
  {
    key: "nanBakaze",
    mspz: "999m34m234p678s22z",
    agariHai: HaiKind.ManZu5,
    isTsumo: true,
    bakaze: HaiKind.Nan,
    jikaze: HaiKind.Sha,
  },
];

/** 聴牌形（13 枚）に和了牌を足した和了形（14 枚）にする */
function toAgariTehai(source: TehaiFuQuestionSource): Tehai14 {
  const tenpai = parseTehai(source.mspz);
  if (tenpai === undefined) {
    throw new Error(`${source.key}: 手牌を読めない`);
  }
  const result = validateTehai14({
    ...tenpai,
    closed: [...tenpai.closed, source.agariHai],
  });
  if (result.isErr()) {
    throw new Error(`${source.key}: 和了形の手牌になっていない`);
  }
  return result.value;
}

/**
 * 「手牌全体の符」レッスンの確認問題
 * 手牌符レッスン確認問題
 *
 * 和了形の手牌と和了状況を示して、手牌全体の符（切り上げ後）を選ばせる。
 * 符は core の `calculateTotalFu`（合計符の練習と同じ計算）から引く。
 * 選択肢は練習と同じ符の一覧から、章が積み上げの外に置く 20 符（平和ツモ）
 * と 25 符（七対子）を除いたもの。
 */
export const TEHAI_FU_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map((source): LessonQuestion => {
    const tehai = toAgariTehai(source);
    const context: AgariContext = {
      agariHai: source.agariHai,
      isTsumo: source.isTsumo,
      bakaze: source.bakaze,
      jikaze: source.jikaze,
    };
    const fu = calculateTotalFu(tehai, context);
    if (fu === undefined) {
      throw new Error(`${source.key}: 役が無く和了できない`);
    }
    return {
      key: source.key,
      prompt: { kind: "tehai", tehai, context },
      answer: { kind: "fu", fu },
    };
  }),
  choices: FU_VALUES.filter((fu) => fu >= 30).map((fu) => ({
    kind: "fu",
    fu,
  })),
};
