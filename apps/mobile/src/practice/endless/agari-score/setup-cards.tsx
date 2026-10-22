import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";
import type { ScoreSettingsState } from "@mahjong-scoring/features/settings/use-score-settings-store";
import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";

import { HelpIconButton } from "../../../components/help-icon-button";
import { MultiSelect } from "../../../components/multi-select";
import { TextLink } from "../../../components/text-link";
import {
  SettingRows,
  SettingToggleGroup,
  SettingToggleRow,
} from "../../../components/setting-toggle-row";
import { colors } from "../../../lib/theme";
import { SettingCard } from "./setting-card";

/**
 * 「回答する項目」のカード（役・翻数と符・その細目）
 * 回答項目カード
 */
export function AnswerItemsCard({
  settings,
  onShowExactHanInfo,
}: {
  readonly settings: Pick<
    ScoreSettingsState,
    | "requireYaku"
    | "setRequireYaku"
    | "requireHanFu"
    | "setRequireHanFu"
    | "exactHan"
    | "setExactHan"
    | "requireFuForMangan"
    | "setRequireFuForMangan"
  >;
  readonly onShowExactHanInfo: () => void;
}) {
  const t = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  return (
    <SettingCard title={t("setup.answerItems")} flush>
      <SettingRows>
        <SettingToggleRow
          title={t("setup.requireYaku")}
          checked={settings.requireYaku}
          onChange={settings.setRequireYaku}
        />
        {/* 細目を開いても親の行との間に線を引かない（親と細目を 1 行として数える） */}
        <View>
          <SettingToggleRow
            title={t("setup.requireHanFu")}
            checked={settings.requireHanFu}
            onChange={settings.setRequireHanFu}
          />
          {/* 翻数と符の答え方の細目。翻数と符を答えないときは意味が無いので出さない */}
          {settings.requireHanFu && (
            <SettingToggleGroup>
              <SettingToggleRow
                title={t("setup.exactHan")}
                checked={settings.exactHan}
                onChange={settings.setExactHan}
                nested={true}
                titleAction={
                  <HelpIconButton
                    onPress={onShowExactHanInfo}
                    label={tCommon("showDetailInfo")}
                  />
                }
              />
              <SettingToggleRow
                title={t("setup.requireFu")}
                checked={settings.requireFuForMangan}
                onChange={settings.setRequireFuForMangan}
                nested={true}
              />
            </SettingToggleGroup>
          )}
        </View>
      </SettingRows>
    </SettingCard>
  );
}

/**
 * 「出題する役」のカード。選んだ役のいずれかが成立する手牌に絞る（空 = 絞り込みなし）
 * 出題役カード
 *
 * 選択肢は生成器が安定して作れる役（SCORE_FILTERABLE_YAKU）に限る。並びは
 * allowlist の定義順（実戦出現率順）で固定し、役の並び替え設定は適用しない
 * （web と同じ。選択肢が少なく、2 画面で並びが揃わない混乱のほうが大きいため）
 */
export function TargetYakuCard({
  targetYaku,
  onChange,
}: {
  readonly targetYaku: readonly string[];
  readonly onChange: (names: string[]) => void;
}) {
  const t = useTranslations("agariScore");
  const tPicker = useTranslations("common.yakuPicker");
  const yakuLabelOf = useYakuLabel();
  const options = SCORE_FILTERABLE_YAKU.map((name) => ({
    value: name,
    label: yakuLabelOf(name),
  }));
  return (
    <SettingCard title={t("setup.targetYaku")}>
      <MultiSelect
        options={options}
        value={targetYaku}
        onChange={onChange}
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
            onPress={() => onChange([])}
            testID="setup-target-yaku-clear"
          >
            {t("setup.yakuFilterClear")}
          </TextLink>
        </View>
      )}
    </SettingCard>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 12,
    color: colors.surface500,
  },
  clearRow: {
    alignItems: "flex-end",
  },
});
