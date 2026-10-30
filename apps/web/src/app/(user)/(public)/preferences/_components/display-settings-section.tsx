"use client";

import { useTranslations } from "next-intl";

import {
  SettingLinkRow,
  SettingLockedRow,
  SettingsCard,
  SettingToggleRow,
} from "@/app/(user)/_components/setting-toggle-row";
import { useAuth } from "@/app/_contexts/auth-context";
import {
  hasPracticeTools,
  PLAN_PAGE_HREF,
} from "@mahjong-scoring/features/billing/plans";
import {
  useDisplaySettingsStore,
  useTileOrderSetting,
  useTileOrientationSetting,
  useDoraDisplayMode,
  useFuHanOrder,
  useKoTsumoInput,
  useScoreInput,
  useTermLinksEnabled,
} from "@/app/_hooks/use-display-settings-store";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";
import { YAKU_ORDER_PATH } from "@mahjong-scoring/features/routes";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される「見え方」の設定を切り替える。出題内容も
 * 正解判定も変わらない（ドラの判定は常に表示牌から導く）。点数と子ツモの
 * 入力方式も受け付ける回答は変えず、答え方の形だけを変える。
 */
export function DisplaySettingsSection() {
  const t = useTranslations("settings");
  const doraDisplay = useDoraDisplayMode();
  const setDoraDisplay = useDisplaySettingsStore((s) => s.setDoraDisplay);
  const termLinks = useTermLinksEnabled();
  const setTermLinks = useDisplaySettingsStore((s) => s.setTermLinks);
  const fuHanOrder = useFuHanOrder();
  const setFuHanOrder = useDisplaySettingsStore((s) => s.setFuHanOrder);
  const scoreInput = useScoreInput();
  const setScoreInput = useDisplaySettingsStore((s) => s.setScoreInput);
  const koTsumoInput = useKoTsumoInput();
  const setKoTsumoInput = useDisplaySettingsStore((s) => s.setKoTsumoInput);
  const tileOrientation = useTileOrientationSetting();
  const setTileOrientation = useDisplaySettingsStore(
    (s) => s.setTileOrientation,
  );
  const tileOrder = useTileOrderSetting();
  const setTileOrder = useDisplaySettingsStore((s) => s.setTileOrder);
  // 上下ランダム・理牌しないは Pro の特典。ここでは「スイッチを出すか料金ページへの導線を
  // 出すか」の見た目だけを決める（練習の盤面は開始時に特典を読み直して決める）。
  // 特典が無い間も保存値は書き換えない
  const { user, isLoading, profile, isProfileLoading } = useAuth();
  const isBenefitPending = isLoading || (user !== null && isProfileLoading);
  const practiceToolsAccess: PracticeToolsAccess = isBenefitPending
    ? "pending"
    : profile && hasPracticeTools(profile.benefits)
      ? "granted"
      : "locked";

  return (
    <SettingsCard>
      {/* 練習中の「ドラの見方」から `/preferences#dora-display` で直接飛んで来られる */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.doraDisplay}
        title={t("doraDisplayTitle")}
        description={t("doraDisplayDescription")}
        checked={doraDisplay === "actual"}
        onChange={(checked) => setDoraDisplay(checked ? "actual" : "indicator")}
      />

      {/* 保存値（termLinks）は「リンクを出す」で既定 true のまま、スイッチだけ
          反転して「リンクなしで表示する」として見せる。設定のスイッチは既定 OFF に
          揃えており、リンクは覚えた人が外すものなので、ON にする側を外す操作に置く */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.termLinks}
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={!termLinks}
        onChange={(checked) => setTermLinks(!checked)}
      />

      {/* 翻→符が既定なので、スイッチは「符を先にする」の向きで出す */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.fuHanOrder}
        title={t("fuHanOrderTitle")}
        description={t("fuHanOrderDescription")}
        checked={fuHanOrder === "fu-first"}
        onChange={(checked) =>
          setFuHanOrder(checked ? "fu-first" : "han-first")
        }
      />

      {/* タイルが既定なので、スイッチは「選択欄から選ぶ」の向きで出す */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.scoreInput}
        title={t("scoreInputTitle")}
        description={t("scoreInputDescription")}
        checked={scoreInput === "select"}
        onChange={(checked) => setScoreInput(checked ? "select" : "tiles")}
      />

      {/* 組の 1 つの select が既定なので、スイッチは「分けて選ぶ」の向きで出す。
          タイルで答える間（上の行がオフ）は効かないが、行は隠さず無効にもしない —
          隠すとリンク（/preferences#ko-tsumo-input）の着地先が消え、押せないスイッチは
          「壊れている」に見える（SettingLockedRow の理由と同じ）。効く条件は説明文で示す */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.koTsumoInput}
        title={t("koTsumoInputTitle")}
        description={t("koTsumoInputDescription")}
        checked={koTsumoInput === "split"}
        onChange={(checked) => setKoTsumoInput(checked ? "split" : "combined")}
      />

      <PracticeToolsToggleRow
        id={PREFERENCE_ANCHORS.tileOrientation}
        title={t("tileOrientationTitle")}
        description={t("tileOrientationDescription")}
        checked={tileOrientation === "random"}
        onChange={(checked) =>
          setTileOrientation(checked ? "random" : "upright")
        }
        access={practiceToolsAccess}
      />
      <PracticeToolsToggleRow
        id={PREFERENCE_ANCHORS.tileOrder}
        title={t("tileOrderTitle")}
        description={t("tileOrderDescription")}
        checked={tileOrder === "unsorted"}
        onChange={(checked) => setTileOrder(checked ? "unsorted" : "sorted")}
        access={practiceToolsAccess}
      />
      {/* 36役を並び替える UI は設定ページに置くと長すぎるため専用ページへ渡す */}
      <SettingLinkRow
        href={YAKU_ORDER_PATH}
        title={t("yakuOrderTitle")}
        description={t("yakuOrderDescription")}
      />
    </SettingsCard>
  );
}

/**
 * Pro の特典（`practice_tools`）の行の出し分け
 *
 * - `pending` — 特典の読み込み中。押せないスイッチを出す
 * - `granted` — 特典あり。スイッチを出す
 * - `locked` — 特典なし。スイッチの代わりに利用条件と料金ページへの導線を出す
 */
type PracticeToolsAccess = "pending" | "granted" | "locked";

interface PracticeToolsToggleRowProps {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly access: PracticeToolsAccess;
}

/**
 * Pro の特典で使える設定のトグル行
 *
 * 特典が無い間も保存値は書き換えない（鍵の行は値を触らない）。
 */
function PracticeToolsToggleRow({
  id,
  title,
  description,
  checked,
  onChange,
  access,
}: PracticeToolsToggleRowProps) {
  const t = useTranslations("settings");
  if (access === "locked") {
    return (
      <SettingLockedRow
        id={id}
        title={title}
        description={description}
        badge={t("practiceToolsPro.badge")}
        note={t("practiceToolsPro.note")}
        link={{ href: PLAN_PAGE_HREF, label: t("practiceToolsPro.link") }}
      />
    );
  }
  return (
    <SettingToggleRow
      id={id}
      title={title}
      description={description}
      checked={checked}
      onChange={onChange}
      loading={access === "pending"}
    />
  );
}
