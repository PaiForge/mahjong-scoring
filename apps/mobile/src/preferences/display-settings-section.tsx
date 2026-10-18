import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import type { TileOrientationMode } from "@mahjong-scoring/features/settings/tile-orientation";

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
      {IAP_AVAILABLE && <TileOrientationRow />}
      {/* 36役を並び替える UI は設定画面に置くと長すぎるため専用画面へ渡す */}
      <SettingLinkRow
        onPress={() => router.push(YAKU_ORDER_PATH)}
        title={t("yakuOrderTitle")}
        description={t("yakuOrderDescription")}
      />
    </SettingsCard>
  );
}

interface TileOrientationToggleProps {
  readonly saved: TileOrientationMode;
  readonly onChange: (mode: TileOrientationMode) => void;
}

/**
 * 「手牌の上下をランダムにする」の行（iOS だけ）
 * 牌の向き設定行
 *
 * 回答時間の計測の行と同じ形。Pro（`practice_tools`）ならスイッチ、そうでなければ
 * 鍵の掛かった行で、ログイン中ならプラン画面へ、ゲストならログインへ送る。
 * 保存値は特典が無い間も書き換えない。練習の盤面は開始時に特典を読み直して
 * 決めるので、ここでの表示（プラン画面と同じ読み取り）とは独立している。
 */
function TileOrientationRow() {
  const { status, user } = useAuth();
  const saved = useTileOrientationSetting();
  const setTileOrientation = useDisplaySettingsStore(
    (s) => s.setTileOrientation,
  );
  if (status === "signedIn" && user !== undefined)
    return (
      <SignedInTileOrientationRow
        userId={user.id}
        saved={saved}
        onChange={setTileOrientation}
      />
    );
  return <LockedTileOrientationRow href="/sign-in" />;
}

/**
 * ログイン中の行
 *
 * 特典を読んでいる間は、保存値のまま押せないスイッチを出す（読み込み中に鍵の行を
 * 出すと、Pro の人にも一瞬鍵が見える）。読めなかったときは鍵の行。
 */
function SignedInTileOrientationRow({
  userId,
  saved,
  onChange,
}: TileOrientationToggleProps & { readonly userId: string }) {
  const t = useTranslations("settings");
  const { state } = usePlan(userId);
  const loading = state.kind === "loading";
  const hasPracticeTools =
    state.kind === "loaded" &&
    state.value.benefits.includes(PlanBenefit.PracticeTools);
  if (!loading && !hasPracticeTools)
    return <LockedTileOrientationRow href={MYPAGE_PLAN_PATH} />;
  return (
    <SettingToggleRow
      title={t("tileOrientationTitle")}
      description={t("tileOrientationDescription")}
      checked={saved === "random"}
      onChange={(checked) => onChange(checked ? "random" : "upright")}
      disabled={loading}
      testID="preferences-tile-orientation"
    />
  );
}

/** Pro でない人の鍵の行。押すと `href` へ */
function LockedTileOrientationRow({ href }: { readonly href: string }) {
  const t = useTranslations("settings");
  const router = useRouter();
  return (
    <SettingLockedRow
      title={t("tileOrientationTitle")}
      badge={t("practiceToolsPro.badge")}
      note={t("practiceToolsPro.note")}
      onPress={() => router.push(href)}
      testID="preferences-tile-orientation-locked"
    />
  );
}
