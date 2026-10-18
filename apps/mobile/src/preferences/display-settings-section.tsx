import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useAuth } from "../auth/use-auth";
import { IAP_AVAILABLE } from "../billing/iap-availability";
import { usePlan } from "../billing/use-plan";
import {
  SettingLinkRow,
  SettingLockedRow,
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import {
  useDisplaySettingsStore,
  useTileOrientationSetting,
  useDoraDisplayMode,
  useFuHanOrder,
  useKoTsumoInput,
  useTermLinksEnabled,
} from "../hooks/use-display-settings-store";
import {
  MYPAGE_PLAN_PATH,
  YAKU_ORDER_PATH,
} from "@mahjong-scoring/features/routes";
import {
  resolvePracticeToolsAccess,
  type PracticeToolsAccess,
} from "./practice-tools-access";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される「見え方」の設定を切り替える。出題内容も
 * 正解判定も変わらない（ドラの判定は常に表示牌から導く）。子ツモの入力方式も
 * 受け付ける回答は変えず、答え方の形だけを変える
 * （web の `DisplaySettingsSection`）。
 */
export function DisplaySettingsSection() {
  const t = useTranslations("settings");
  const router = useRouter();
  const doraDisplay = useDoraDisplayMode();
  const setDoraDisplay = useDisplaySettingsStore((s) => s.setDoraDisplay);
  const termLinks = useTermLinksEnabled();
  const setTermLinks = useDisplaySettingsStore((s) => s.setTermLinks);
  const fuHanOrder = useFuHanOrder();
  const setFuHanOrder = useDisplaySettingsStore((s) => s.setFuHanOrder);
  const koTsumoInput = useKoTsumoInput();
  const setKoTsumoInput = useDisplaySettingsStore((s) => s.setKoTsumoInput);

  return (
    <SettingsCard>
      <SettingToggleRow
        title={t("doraDisplayTitle")}
        description={t("doraDisplayDescription")}
        checked={doraDisplay === "actual"}
        onChange={(checked) => setDoraDisplay(checked ? "actual" : "indicator")}
      />
      {/* 保存値（termLinks）は「リンクを出す」で既定 true のまま、スイッチだけ
          反転して「リンクなしで表示する」として見せる。設定のスイッチは既定 OFF に
          揃えており、リンクは覚えた人が外すものなので、ON にする側を外す操作に置く */}
      <SettingToggleRow
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={!termLinks}
        onChange={(checked) => setTermLinks(!checked)}
      />
      {/* 翻→符が既定なので、スイッチは「符を先にする」の向きで出す */}
      <SettingToggleRow
        title={t("fuHanOrderTitle")}
        description={t("fuHanOrderDescription")}
        checked={fuHanOrder === "fu-first"}
        onChange={(checked) =>
          setFuHanOrder(checked ? "fu-first" : "han-first")
        }
      />
      {/* 組の 1 つの select が既定なので、スイッチは「分けて選ぶ」の向きで出す */}
      <SettingToggleRow
        title={t("koTsumoInputTitle")}
        description={t("koTsumoInputDescription")}
        checked={koTsumoInput === "split"}
        onChange={(checked) => setKoTsumoInput(checked ? "split" : "combined")}
      />
      {/* Pro は iOS だけで扱う（Android は行を出さず、盤面も常に正規の向き） */}
      {IAP_AVAILABLE && <PracticeToolsRows />}
      {/* 36役を並び替える UI は設定画面に置くと長すぎるため専用画面へ渡す */}
      <SettingLinkRow
        onPress={() => router.push(YAKU_ORDER_PATH)}
        title={t("yakuOrderTitle")}
        description={t("yakuOrderDescription")}
      />
    </SettingsCard>
  );
}

/**
 * Pro（`practice_tools`）の行の並び（iOS だけ）
 * Pro 設定行群
 *
 * 回答時間の計測の行と同じ形。Pro ならスイッチ、そうでなければ鍵の掛かった行で、
 * ログイン中ならプラン画面へ、ゲストならログインへ送る。保存値は特典が無い間も
 * 書き換えない。練習の盤面は開始時に特典を読み直して決めるので、ここでの表示
 * （プラン画面と同じ読み取り）とは独立している。
 */
function PracticeToolsRows() {
  const { status, user } = useAuth();
  if (status === "signedIn" && user !== undefined)
    return <SignedInPracticeToolsRows userId={user.id} />;
  return <PracticeToolsRowsFor access="signedOut" />;
}

/**
 * ログイン中の Pro の行の並び
 *
 * プランはここで 1 回だけ読み、全部の行で共有する（`usePlan` はインスタンスごとに
 * 読むので、行ごとに呼ぶと画面のフォーカス・購入後の読み直しのたびに行数ぶん読む）。
 */
function SignedInPracticeToolsRows({ userId }: { readonly userId: string }) {
  const { state } = usePlan(userId);
  return <PracticeToolsRowsFor access={resolvePracticeToolsAccess(state)} />;
}

/** Pro の行を並べる */
function PracticeToolsRowsFor({
  access,
}: {
  readonly access: PracticeToolsAccess;
}) {
  const t = useTranslations("settings");
  const tileOrientation = useTileOrientationSetting();
  const setTileOrientation = useDisplaySettingsStore(
    (s) => s.setTileOrientation,
  );
  return (
    <PracticeToolsToggleRow
      access={access}
      title={t("tileOrientationTitle")}
      description={t("tileOrientationDescription")}
      checked={tileOrientation === "random"}
      onChange={(checked) => setTileOrientation(checked ? "random" : "upright")}
      testID="preferences-tile-orientation"
    />
  );
}

interface PracticeToolsToggleRowProps {
  readonly access: PracticeToolsAccess;
  readonly title: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** スイッチの行の testID。鍵の行は末尾に `-locked` を付ける */
  readonly testID: string;
}

/**
 * Pro の特典で使える設定の行
 *
 * 特典を読んでいる間は保存値のまま押せないスイッチ、特典が無い・読めなければ鍵の行。
 */
function PracticeToolsToggleRow({
  access,
  title,
  description,
  checked,
  onChange,
  testID,
}: PracticeToolsToggleRowProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  if (access === "locked" || access === "signedOut")
    return (
      <SettingLockedRow
        title={title}
        badge={t("practiceToolsPro.badge")}
        note={t("practiceToolsPro.note")}
        onPress={() =>
          router.push(access === "signedOut" ? "/sign-in" : MYPAGE_PLAN_PATH)
        }
        testID={`${testID}-locked`}
      />
    );
  return (
    <SettingToggleRow
      title={title}
      description={description}
      checked={checked}
      onChange={onChange}
      disabled={access === "pending"}
      testID={testID}
    />
  );
}
