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
  useDisplaySettingsStore,
  useKoTsumoInput,
  useScoreInput,
  useTileOrderSetting,
  useTileOrientationSetting,
} from "@/app/_hooks/use-display-settings-store";
import {
  useAutoAdvanceOnCorrect,
  useTrainingSettingsStore,
} from "@/app/_hooks/use-training-settings-store";
import {
  hasPracticeTools,
  PLAN_PAGE_HREF,
} from "@mahjong-scoring/features/billing/plans";
import { YAKU_ORDER_PATH } from "@mahjong-scoring/features/routes";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";

/**
 * 練習設定セクション
 *
 * 問題を解く画面でだけ効く設定 — 進め方（正解したら自動で次へ）・答え方（点数と
 * 子ツモの入力方式）・盤面の見せ方（Pro の上下ランダム・理牌しない）・役の並び順
 * （専用ページへのリンク）— を 1 つの節にまとめる。効く画面は行ごとに違う: 自動で次へは
 * トレーニング（模試を含む）と点数計算の演習だけ、入力方式と盤面の見せ方は昇級試験の
 * 本番にも効く。
 * どれも端末ローカルに保存され、出題内容も受け付ける回答（正解判定）も変えない。
 *
 * 節とストアは別の分類で、一致させない。自動で次へはトレーニング設定ストア、入力方式と
 * Pro の 2 行は表示設定ストア（`mahjong-display-settings`）の項目のままで、表示設定
 * ストアの項目は「練習」と「表示」の 2 節に跨る（理由はページの TSDoc）。
 *
 * 節の名前を「トレーニング」にしないのは、トレーニングがこのアプリでは時間無制限・記録なしの
 * 練習だけを指す語で、チャレンジ（昇級試験を含む）にも効く入力方式の行を載せる節には
 * 合わないため。
 *
 * 行の順は 進め方 → 答え方 → 盤面 → 別画面へのリンク。各行のアンカー
 * （`PREFERENCE_ANCHORS`）は節を移っても変えないので、他の画面からのリンクの着地は
 * そのまま効く。
 */
export function PracticeSettingsSection() {
  const t = useTranslations("settings");
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  const setAutoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.setAutoAdvanceOnCorrect,
  );
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
      {/* 進め方。トレーニングの進み方だけを変え、チャレンジ（制限時間あり）には効かない */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.autoAdvanceOnCorrect}
        title={t("autoAdvanceOnCorrectTitle")}
        description={t("autoAdvanceOnCorrectDescription")}
        checked={autoAdvanceOnCorrect}
        onChange={setAutoAdvanceOnCorrect}
      />

      {/* 答え方。タイルが既定なので、スイッチは「選択欄から選ぶ」の向きで出す */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.scoreInput}
        title={t("scoreInputTitle")}
        description={t("scoreInputDescription")}
        checked={scoreInput === "select"}
        onChange={(checked) => setScoreInput(checked ? "select" : "tiles")}
      />

      {/* 答え方の続き。上の行がオンのときだけ効くので、その直下に置く。
          組の 1 つの select が既定なので、スイッチは「分けて選ぶ」の向きで出す。
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

      {/* 盤面の見せ方（Pro）。2 行は隣接させ、特典が無いときの鍵の行をまとめる */}
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

      {/* 別画面へのリンクは末尾に置く。36役を並び替える UI は設定ページに置くと
          長すぎるため専用ページへ渡す */}
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
