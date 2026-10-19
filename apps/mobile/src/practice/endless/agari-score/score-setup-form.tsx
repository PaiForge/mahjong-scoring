import { useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";

import { Button } from "../../../components/button";
import { HelpIconButton } from "../../../components/help-icon-button";
import { PlayIcon } from "../../../components/icons/icons";
import { InfoModal } from "../../../components/info-modal";
import { MultiSelect } from "../../../components/multi-select";
import { TextLink } from "../../../components/text-link";
import {
  SettingLockedRow,
  SettingsCard,
  SettingToggleRow,
} from "../../../components/setting-toggle-row";
import type { ScoreSettingsStoreHook } from "../../../hooks/use-score-settings-store";
import { useTrainingSettingsStore } from "../../../hooks/use-training-settings-store";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import { toggleInArray } from "@mahjong-scoring/features/practice/toggle-in-array";
import { MYPAGE_PLAN_PATH } from "@mahjong-scoring/features/routes";
import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";
import { colors } from "../../../lib/theme";
import { useAuth } from "../../../auth/use-auth";
import { IAP_AVAILABLE } from "../../../billing/iap-availability";
import { usePlan } from "../../../billing/use-plan";
import { SettingCard } from "./setting-card";
import { SmallCheckbox } from "./small-checkbox";

interface ScoreSetupFormProps {
  /** 設定の保存先（和了形の点数計算と聴牌形の点数計算で保存名が違う） */
  readonly settingsStore: ScoreSettingsStoreHook;
  /** 「開始する」で開く play 画面のパス */
  readonly playPath: string;
  /** 「開始する」で開く直前に呼ぶ処理（前回の問題をストアから消す） */
  readonly onStart: () => void;
  /** 出題する役の絞り込みカードを出すか（既定 true） */
  readonly showYakuFilter?: boolean;
  /** 開始ボタンの下に添える注記（出題範囲の但し書きなど） */
  readonly children?: ReactNode;
}

/**
 * 点数計算練習の設定画面（web の `ScoreSetupForm`）
 * 練習設定画面
 *
 * 和了形の点数計算と聴牌形の点数計算で共有する。設定項目（役の回答・5翻以上の
 * 翻数回答・符の入力・自動で次へ・親子・点数帯）は同じで、保存先と遷移先だけが
 * 練習ごとに違う。
 *
 * 「回答時間を計測する」（Pro の拡張機能）は iOS だけに出す（Android は Pro を
 * 扱わない）。中身は {@link MeasureTimeRow}。web は設定をクエリに書いて play へ
 * 渡すが、モバイルの play は開いたときの設定をストアから直接読む（共有される
 * URL が無いため）。
 */
export function ScoreSetupForm({
  settingsStore: useSettingsStore,
  playPath,
  onStart,
  showYakuFilter = true,
  children,
}: ScoreSetupFormProps) {
  const t = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const tPicker = useTranslations("common.yakuPicker");
  const tSettings = useTranslations("settings");
  // 「正解したら自動で次へ」はトレーニングと共通の設定（web と同じ）。練習ごとの
  // 保存先（settingsStore）には持たず、設定画面と同じ値を読み書きする
  const autoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.autoAdvanceOnCorrect,
  );
  const setAutoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.setAutoAdvanceOnCorrect,
  );
  const router = useRouter();
  const yakuLabelOf = useYakuLabel();
  const [showExactHanInfo, setShowExactHanInfo] = useState(false);
  const {
    requireYaku,
    setRequireYaku,
    requireHanFu,
    setRequireHanFu,
    exactHan,
    setExactHan,
    requireFuForMangan,
    setRequireFuForMangan,
    targetScoreRanges,
    setTargetScoreRanges,
    includeParent,
    setIncludeParent,
    includeChild,
    setIncludeChild,
    targetYaku,
    setTargetYaku,
    measureTime,
    setMeasureTime,
  } = useSettingsStore();

  // 並びは allowlist の定義順（実戦出現率順）で固定し、役の並び替え設定は
  // 適用しない（web と同じ。選択肢が少なく、2 画面で並びが揃わない混乱の
  // ほうが大きいため）
  const yakuFilterOptions = useMemo(
    () =>
      SCORE_FILTERABLE_YAKU.map((name) => ({
        value: name,
        label: yakuLabelOf(name),
      })),
    [yakuLabelOf],
  );

  const isDisabled =
    targetScoreRanges.length === 0 || (!includeParent && !includeChild);

  const handleStart = () => {
    onStart();
    router.push(playPath);
  };

  return (
    <View style={styles.form}>
      <SettingsCard>
        <SettingToggleRow
          title={t("setup.requireYaku")}
          checked={requireYaku}
          onChange={setRequireYaku}
        />
        <SettingToggleRow
          title={t("setup.requireHanFu")}
          checked={requireHanFu}
          onChange={setRequireHanFu}
        />
        {/* 翻数と符の答え方の細目。翻数と符を答えないときは意味が無いので出さない */}
        {requireHanFu && (
          <>
            <SettingToggleRow
              title={t("setup.exactHan")}
              checked={exactHan}
              onChange={setExactHan}
              titleAction={
                <HelpIconButton
                  onPress={() => setShowExactHanInfo(true)}
                  label={tCommon("showDetailInfo")}
                />
              }
            />
            <SettingToggleRow
              title={t("setup.requireFu")}
              checked={requireFuForMangan}
              onChange={setRequireFuForMangan}
            />
          </>
        )}
        <SettingToggleRow
          title={tSettings("autoAdvanceOnCorrectTitle")}
          checked={autoAdvanceOnCorrect}
          onChange={setAutoAdvanceOnCorrect}
        />
        {IAP_AVAILABLE && (
          <MeasureTimeRow checked={measureTime} onChange={setMeasureTime} />
        )}
      </SettingsCard>

      <SettingCard title={t("setup.questionMode")}>
        <SmallCheckbox
          checked={includeParent}
          onChange={setIncludeParent}
          label={t("setup.oya")}
        />
        <SmallCheckbox
          checked={includeChild}
          onChange={setIncludeChild}
          label={t("setup.ko")}
        />
      </SettingCard>

      <SettingCard title={t("setup.targetScore")}>
        <SmallCheckbox
          checked={targetScoreRanges.includes("nonMangan")}
          onChange={() =>
            setTargetScoreRanges(toggleInArray(targetScoreRanges, "nonMangan"))
          }
          label={t("setup.nonMangan")}
        />
        <SmallCheckbox
          checked={targetScoreRanges.includes("manganPlus")}
          onChange={() =>
            setTargetScoreRanges(toggleInArray(targetScoreRanges, "manganPlus"))
          }
          label={t("setup.manganPlus")}
        />
      </SettingCard>

      {/* 選んだ役のいずれかが成立する手牌に絞る（空 = 絞り込みなし）。
          選択肢は生成器が安定して作れる役（SCORE_FILTERABLE_YAKU）に限る */}
      {showYakuFilter && (
        <SettingCard title={t("setup.targetYaku")}>
          <MultiSelect
            options={yakuFilterOptions}
            value={targetYaku}
            onChange={setTargetYaku}
            placeholder={t("setup.yakuFilterPlaceholder")}
            labels={{
              add: tPicker("add"),
              title: tPicker("title"),
              done: tPicker("done"),
            }}
          />
          {targetYaku.length >= 2 && (
            <Text style={styles.note}>{t("setup.yakuFilterNote")}</Text>
          )}
          {/* 選んだ役を 1 つずつ × で外す手間を省く。外すと「指定しない」に戻る */}
          {targetYaku.length > 0 && (
            <View style={styles.clearRow}>
              <TextLink
                onPress={() => setTargetYaku([])}
                testID="setup-target-yaku-clear"
              >
                {t("setup.yakuFilterClear")}
              </TextLink>
            </View>
          )}
        </SettingCard>
      )}

      <Button
        onPress={handleStart}
        disabled={isDisabled}
        size="lg"
        fullWidth
        icon={
          <PlayIcon
            size={16}
            color={isDisabled ? colors.surface400 : colors.white}
          />
        }
      >
        {t("setup.start")}
      </Button>

      {children}

      <InfoModal
        isOpen={showExactHanInfo}
        onClose={() => setShowExactHanInfo(false)}
        title={t("setup.exactHan")}
        closeLabel={tCommon("close")}
      >
        {t("setup.exactHanInfo")}
      </InfoModal>
    </View>
  );
}

interface MeasureTimeRowProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/**
 * 「回答時間を計測する」の行（iOS だけ）
 * 回答時間設定行
 *
 * Pro（`practice_tools`）ならスイッチ、そうでなければ鍵の掛かった行。鍵の行は
 * ログイン中ならプラン画面へ、ゲストならログインへ送る（購入はログインして
 * からプラン画面で行う）。盤面は、このスイッチに加えてゲートが返した特典にも
 * `practice_tools` があるときだけ回答時間を出す（web と同じ二重の判定）ので、
 * Pro が切れた後にスイッチがオンのまま残っても計測は出ない。
 */
function MeasureTimeRow(props: MeasureTimeRowProps) {
  const { status, user } = useAuth();
  if (status === "signedIn" && user !== undefined)
    return <SignedInMeasureTimeRow userId={user.id} {...props} />;
  return <LockedMeasureTimeRow href="/sign-in" />;
}

/**
 * ログイン中の行
 *
 * プランの特典を読んでいる間は、保存済みの値のまま押せないスイッチを出す。
 * 読み込み中に鍵の行を出すと、Pro の人にも一瞬鍵が見え、そこで押すとプラン
 * 画面へ飛んでしまう。読み終えて Pro でなければ鍵の行に替わる。読めなかった
 * ときは鍵の行（特典の判定は fail-closed）。
 */
function SignedInMeasureTimeRow({
  userId,
  checked,
  onChange,
}: MeasureTimeRowProps & { readonly userId: string }) {
  const t = useTranslations("agariScore");
  const { state } = usePlan(userId);
  const loading = state.kind === "loading";
  const hasPracticeTools =
    state.kind === "loaded" &&
    state.value.benefits.includes(PlanBenefit.PracticeTools);
  if (!loading && !hasPracticeTools)
    return <LockedMeasureTimeRow href={MYPAGE_PLAN_PATH} />;
  return (
    <SettingToggleRow
      title={t("setup.measureTime")}
      checked={checked}
      onChange={onChange}
      disabled={loading}
      testID="setup-measure-time"
    />
  );
}

/** Pro でない人の鍵の行。押すと `href` へ */
function LockedMeasureTimeRow({ href }: { readonly href: string }) {
  const t = useTranslations("agariScore");
  const router = useRouter();
  return (
    <SettingLockedRow
      title={t("setup.measureTime")}
      badge={t("setup.measureTimePro.badge")}
      note={t("setup.measureTimePro.note")}
      onPress={() => router.push(href)}
      testID="setup-measure-time-locked"
    />
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  note: {
    fontSize: 12,
    color: colors.surface500,
  },
  clearRow: {
    alignItems: "flex-end",
  },
});
