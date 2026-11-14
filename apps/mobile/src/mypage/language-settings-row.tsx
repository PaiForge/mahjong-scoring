import { Linking, Platform } from "react-native";
import { useTranslations } from "use-intl";

import { GlobeIcon } from "../components/icons/icons";
import { LinkRow, LinkRowList } from "../components/link-row";
import { colors } from "../lib/theme";

/**
 * 言語の行（iOS の設定アプリのこのアプリの画面を開く）
 * 言語設定への入口
 *
 * アプリの表示言語は端末のアプリ優先言語で決まり（`lib/app-locale.ts`）、アプリ内に
 * 言語を切り替える設定は持たない。この行は切り替えの場所（iOS の「設定 > アプリ >
 * このアプリ > 言語」）を見つけやすくするための入口で、押すと
 * `Linking.openSettings()` で設定アプリのこのアプリの画面を開く。言語を変えると
 * iOS がアプリを再起動し、起動時に新しい言語で決まり直す。
 *
 * - アプリ内で切り替える案は採らない。Apple でログインのボタン・購入シート・共有など
 *   OS 側の画面は OS の言語のまま残り、アプリの言語と食い違う。Apple も独自の
 *   言語の選択より、設定アプリへ送る形を勧めている
 * - iOS だけに出す。Android 13 以上も OS にアプリごとの言語があるが、
 *   `openSettings()` が開くアプリ情報の画面から言語までは一段深く、Android 12 以前には
 *   OS 側の設定そのものが無い。Android でどう切り替えさせるかは別に決める
 * - 設定アプリの「言語」は、端末の優先する言語（「一般 > 言語と地域」）が 1 つだけだと
 *   出ない。そういう端末では開いた先に変える場所が無く行き止まりになるので、
 *   行の説明で「言語と地域」で言語を足す道を添える
 * - マイページの末尾近く（「その他」の手前）に置き、ゲストにも出す。設定の画面は
 *   ログイン中だけの規約で、そこに置くとゲストが言語を変える場所を見つけられない
 * - 説明には今の言語の名前を出す（辞書のその言語の値なので、自分の言語の綴りで出る）
 */
export function LanguageSettingsRow() {
  const t = useTranslations("mypage.cards.language");
  if (Platform.OS !== "ios") return null;
  return (
    <LinkRowList>
      <LinkRow
        testID="mypage-menu-language"
        title={t("title")}
        description={t("summary", { language: t("current") })}
        leading={<GlobeIcon size={22} color={colors.surface600} />}
        onPress={() => void Linking.openSettings()}
      />
    </LinkRowList>
  );
}
