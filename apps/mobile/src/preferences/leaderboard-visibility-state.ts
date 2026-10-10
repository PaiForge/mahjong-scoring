/**
 * ランキングに表示しない設定の、画面の状態の遷移
 * ランキング非表示設定の状態
 *
 * 読み込み（GET）と保存（POST）が重なっても、最後に押した値と画面と
 * サーバーが食い違わないための規則を、React から切り離してここに置く
 * （`privacy-settings-section.tsx` が `useReducer` で使う）。
 *
 * @design 保存は 1 つずつ
 * 保存中は次の切り替えを受け付けない。押すたびに独立した POST を送ると、
 * 「オン → オフ」と続けて押したときに先の POST が後から DB に届き、最後の
 * 操作と逆の値が残りうる。応答を捨てても DB の書き込み順は直らないので、
 * 送る側で直列にする。
 *
 * @design 保存より前に始まった読み込みの結果を捨てる
 * 画面に戻るたびに読み直すので、保存の前に送った GET が保存の後に返り、
 * 保存前の値で画面を戻すことがある。読み込みに番号を振り、保存を始めた
 * 時点でそれまでの番号を無効にする。保存中に始まった読み込みも、保存の
 * 前に読まれた値かもしれないので受け付けない。保存が成功したら、押した値を
 * そのまま正にする（サーバーが受け付けた値なので読み直さなくてよい）。
 */
export interface LeaderboardVisibilityState {
  /** 画面に出す値。まだ 1 度も読めていなければ undefined */
  readonly hidden: boolean | undefined;
  /** 1 度も読めないまま読み込みに失敗した */
  readonly loadFailed: boolean;
  /** 保存中なら、失敗したときに戻す値 */
  readonly saving: { readonly previous: boolean } | undefined;
  /** 直前の保存が失敗した（次の切り替えまで画面に残す） */
  readonly saveFailed: boolean;
  /** 結果を受け付ける読み込みの番号。保存の開始で無効にする */
  readonly acceptedLoad: number | undefined;
}

/** 状態を変える出来事 */
export type LeaderboardVisibilityAction =
  | { readonly type: "loadStarted"; readonly load: number }
  | {
      readonly type: "loadSucceeded";
      readonly load: number;
      readonly hidden: boolean;
    }
  | { readonly type: "loadFailed"; readonly load: number }
  | { readonly type: "saveStarted"; readonly hidden: boolean }
  | { readonly type: "saveSucceeded" }
  | { readonly type: "saveFailed" };

/** 画面を開いた直後の状態 */
export const INITIAL_LEADERBOARD_VISIBILITY_STATE: LeaderboardVisibilityState =
  {
    hidden: undefined,
    loadFailed: false,
    saving: undefined,
    saveFailed: false,
    acceptedLoad: undefined,
  };

/**
 * 切り替えを今受け付けるか（読めていて、保存中でない）
 * ランキング非表示設定の操作可否
 */
export function canToggleLeaderboardVisibility(
  state: LeaderboardVisibilityState,
): boolean {
  return state.hidden !== undefined && state.saving === undefined;
}

/**
 * 出来事を状態に当てる
 * ランキング非表示設定の状態遷移
 */
export function reduceLeaderboardVisibility(
  state: LeaderboardVisibilityState,
  action: LeaderboardVisibilityAction,
): LeaderboardVisibilityState {
  switch (action.type) {
    case "loadStarted":
      // 保存中に始まった読み込みは、保存の前の値を返しうるので受け付けない
      if (state.saving !== undefined) return state;
      return { ...state, acceptedLoad: action.load };
    case "loadSucceeded":
      if (action.load !== state.acceptedLoad) return state;
      return { ...state, hidden: action.hidden, loadFailed: false };
    case "loadFailed":
      if (action.load !== state.acceptedLoad) return state;
      // 読めている値があれば、読み直しの失敗では消さない
      return { ...state, loadFailed: state.hidden === undefined };
    case "saveStarted":
      if (!canToggleLeaderboardVisibility(state) || state.hidden === undefined)
        return state;
      return {
        ...state,
        hidden: action.hidden,
        saving: { previous: state.hidden },
        saveFailed: false,
        acceptedLoad: undefined,
      };
    case "saveSucceeded":
      if (state.saving === undefined) return state;
      return { ...state, saving: undefined };
    case "saveFailed":
      if (state.saving === undefined) return state;
      return {
        ...state,
        hidden: state.saving.previous,
        saving: undefined,
        saveFailed: true,
      };
  }
}
