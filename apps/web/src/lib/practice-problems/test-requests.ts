/**
 * 問題の保存の要求のテスト用の盤面
 * 問題保存テスト要求
 *
 * 送信経路（JSON）を通した後の形で組む。牌は牌種 ID（0〜8 萬子・9〜17 筒子・
 * 18〜26 索子・27〜30 東南西北・31〜33 白發中）。チーの `hais` は昇順に並べる
 * （検証が昇順でないチーを拒む）。
 *
 * このモジュールはテスト専用。アプリ本体から import しないこと。
 */

/** 鳴き元 */
type From = "kamicha" | "toimen" | "shimocha";

/**
 * 4 副露の和了形（ツモ）: チー 234m（3m を鳴く）→ ポン 白 → 大明槓 9p → 加槓 1s。
 * 6m の単騎で和了
 *
 * @param options.ponFrom - ポンの鳴き元（同一性に入らない）
 * @param options.ninePinKan - 9p の槓の種別（同一性に入る）
 */
export function meldedAgariRequest({
  ponFrom = "shimocha",
  ninePinKan = "daiminkan",
}: {
  readonly ponFrom?: From;
  readonly ninePinKan?: "daiminkan" | "kakan";
} = {}): Record<string, unknown> {
  return {
    kind: "agari-score",
    schemaVersion: 1,
    payload: {
      hand: {
        closed: [5, 5],
        exposed: [
          { type: "chi", hais: [1, 2, 3], nakiHai: 2 },
          { type: "pon", hais: [31, 31, 31], from: ponFrom },
          { type: ninePinKan, hais: [17, 17, 17, 17], from: "kamicha" },
          { type: "kakan", hais: [18, 18, 18, 18], from: "toimen" },
        ],
      },
      agariHai: 5,
      isTsumo: true,
      jikaze: 28,
      bakaze: 27,
      doraMarkers: [30, 0, 22],
      riichi: null,
    },
  };
}

/** リーチした門前の両面待ち（2・5・8p の三面）の聴牌形: 234m 34567p 678s 55s */
export function riichiTenpaiRequest(): Record<string, unknown> {
  return {
    kind: "tenpai-score",
    schemaVersion: 1,
    payload: {
      hand: {
        closed: [1, 2, 3, 11, 12, 13, 14, 15, 23, 24, 25, 22, 22],
        exposed: [],
      },
      jikaze: 27,
      bakaze: 27,
      doraMarkers: [32],
      riichi: { uraDoraMarkers: [8] },
    },
  };
}

/**
 * 和了形の最大構成その 1: 副露 4 つすべて槓（鳴き元はいちばん長い名前）・
 * リーチなし・表ドラ表示牌 5 枚
 */
export function allKanAgariRequest(): Record<string, unknown> {
  return {
    kind: "agari-score",
    schemaVersion: 1,
    payload: {
      hand: {
        closed: [33, 33],
        exposed: [
          { type: "daiminkan", hais: [17, 17, 17, 17], from: "shimocha" },
          { type: "kakan", hais: [26, 26, 26, 26], from: "shimocha" },
          { type: "daiminkan", hais: [31, 31, 31, 31], from: "shimocha" },
          { type: "kakan", hais: [32, 32, 32, 32], from: "shimocha" },
        ],
      },
      agariHai: 33,
      isTsumo: false,
      jikaze: 30,
      bakaze: 29,
      doraMarkers: [27, 28, 29, 30, 27],
      riichi: null,
    },
  };
}

/**
 * 和了形の最大構成その 2: 門前リーチで暗槓 4 つ・表ドラと裏ドラの表示牌 5 枚ずつ（ツモ）
 *
 * 槓子は中張牌にする。么九牌の暗槓 4 つは符が回答の選択肢を超えて検証が拒む
 */
export function allAnkanRiichiAgariRequest(): Record<string, unknown> {
  return {
    kind: "agari-score",
    schemaVersion: 1,
    payload: {
      hand: {
        closed: [33, 33],
        exposed: [
          { type: "ankan", hais: [10, 10, 10, 10] },
          { type: "ankan", hais: [11, 11, 11, 11] },
          { type: "ankan", hais: [21, 21, 21, 21] },
          { type: "ankan", hais: [22, 22, 22, 22] },
        ],
      },
      agariHai: 33,
      isTsumo: true,
      jikaze: 30,
      bakaze: 29,
      doraMarkers: [27, 28, 29, 30, 27],
      riichi: { uraDoraMarkers: [28, 29, 30, 27, 28] },
    },
  };
}
