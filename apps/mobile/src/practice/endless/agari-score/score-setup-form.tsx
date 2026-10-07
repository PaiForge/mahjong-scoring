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
import {
  SettingsCard,
  SettingToggleRow,
} from "../../../components/setting-toggle-row";
import type { ScoreSettingsStoreHook } from "../../../hooks/use-score-settings-store";
import { useTrainingSettingsStore } from "../../../hooks/use-training-settings-store";
import { toggleInArray } from "@mahjong-scoring/features/practice/toggle-in-array";
import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";
import { colors } from "../../../lib/theme";
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
 * 和了形の点数計算と聴牌形の点数計算で共有する。設定項目（役の回答・満貫の
 * 簡略化・符の入力・自動で次へ・親子・点数帯）は同じで、保存先と遷移先だけが
 * 練習ごとに違う。
 *
 * web の「回答時間を計測する」（Pro の拡張機能）はモバイルに購入が無いため
 * 出さない。web は設定をクエリに書いて play へ渡すが、モバイルの play は
 * 開いたときの設定をストアから直接読む（共有される URL が無いため）。
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
  const [showSimplifyInfo, setShowSimplifyInfo] = useState(false);
  const {
    requireYaku,
    setRequireYaku,
    simplifyMangan,
    setSimplifyMangan,
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
          title={t("setup.simplifyMangan")}
          checked={simplifyMangan}
          onChange={setSimplifyMangan}
          titleAction={
            <HelpIconButton
              onPress={() => setShowSimplifyInfo(true)}
              label={tCommon("showDetailInfo")}
            />
          }
        />
        <SettingToggleRow
          title={t("setup.requireFu")}
          checked={requireFuForMangan}
          onChange={setRequireFuForMangan}
        />
        <SettingToggleRow
          title={tSettings("autoAdvanceOnCorrectTitle")}
          checked={autoAdvanceOnCorrect}
          onChange={setAutoAdvanceOnCorrect}
        />
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
        isOpen={showSimplifyInfo}
        onClose={() => setShowSimplifyInfo(false)}
        title={t("setup.simplifyMangan")}
        closeLabel={tCommon("close")}
      >
        {t("setup.simplifyManganInfo")}
      </InfoModal>
    </View>
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
});
