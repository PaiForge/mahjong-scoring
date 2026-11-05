/**
 * 認証の流れの画面（ログイン・登録）
 *
 * `route` はルートのスタックでの画面の名前（expo-router がファイルの位置から
 * 付ける）、`pathname` は開くときのパス。
 */
export const AUTH_SCREENS = {
  signIn: { route: "sign-in", pathname: "/sign-in" },
  signUp: { route: "sign-up/index", pathname: "/sign-up" },
} as const;

export type AuthScreen = keyof typeof AUTH_SCREENS;

/**
 * 認証の流れの補助の画面から、流れの別の画面へ移る方法
 *
 * - `back` — 下の画面が行き先そのもの。戻れば入力した値ごと残っている
 * - `replaceBelow` — 下の画面が流れの別の画面。補助の画面を閉じ、下の画面を
 *   行き先に置き換える
 * - `replace` — 下に流れの画面が無い（ディープリンク等）。補助の画面を行き先に置き換える
 */
export type AuthScreenSwitch = "back" | "replaceBelow" | "replace";

/**
 * 補助の画面（確認メールの案内）からログイン・登録へ移る方法を決める
 * 認証画面の切り替え
 *
 * 補助の画面は、それを開いたログイン・登録の画面の上に積む（登録の打ち間違いを
 * 直すとき、入力した値の残るフォームへ戻れるように）。流れの中のログイン ⇄
 * 登録 ⇄ ユーザー名の設定は置き換えで、入口から積むのは流れの画面 1 枚だけ
 * （`useLeaveAuthFlow` が戻る 1 回で入口に帰る）。補助の画面から別の流れの画面へ
 * 移るときも、補助の画面の上に積んだり補助の画面だけを置き換えたりせず、
 * 下の流れの画面ごと置き換えて、入口の上を 1 枚に保つ。
 *
 * @param belowRoute - 補助の画面のすぐ下にある画面の名前。下が無ければ undefined
 */
export function planAuthScreenSwitch(
  belowRoute: string | undefined,
  target: AuthScreen,
): AuthScreenSwitch {
  if (belowRoute === AUTH_SCREENS[target].route) return "back";
  const belowIsAuthScreen = Object.values(AUTH_SCREENS).some(
    (screen) => screen.route === belowRoute,
  );
  return belowIsAuthScreen ? "replaceBelow" : "replace";
}
