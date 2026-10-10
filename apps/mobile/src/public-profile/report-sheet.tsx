import { Fragment, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASONS,
  validateReportInput,
  type ReportInputError,
  type ReportReason,
} from "@mahjong-scoring/features/reports/report";

import { BottomSheet, SheetScrollView } from "../components/bottom-sheet";
import { Button } from "../components/button";
import { Divider } from "../components/divider";
import { InsetRing } from "../components/inset-ring";
import { TextField } from "../components/text-field";
import { TextLink } from "../components/text-link";
import { colors, radius } from "../lib/theme";
import { reportUser } from "./moderation-api";

/**
 * 通報のシート（web の公開プロフィールの通報フォーム）
 * 通報シート
 *
 * 理由を 6 つから 1 つ選び、詳細を書いて送る。選択肢・検証は web と同じ
 * （`reports/report.ts`。「その他」だけ詳細が必須）。送る前に同じ関数で
 * 確かめて、誤りはシートの中に出す（サーバーも同じ規則で 422 を返す）。
 *
 * 送れたらシートを閉じて `onDone` を呼ぶ（呼び出し側が受け付けた旨を出す）。
 * 送れなかった理由（通信・認証・相手がいない）は区別せず「通報できませんでした」
 * と出す — どれも本人が直せるものではなく、もう一度押すだけでよい。
 */
export function ReportSheet({
  isOpen,
  onClose,
  onDone,
  userId,
  username,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDone: () => void;
  /** 通報する本人 */
  readonly userId: string;
  /** 通報する相手 */
  readonly username: string;
}) {
  const t = useTranslations("report");
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState<ReportReason>();
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<ReportInputError | "failed">();
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    const input = validateReportInput(reason, detail);
    if (!input.ok) {
      setError(input.error);
      return;
    }
    setError(undefined);
    setSubmitting(true);
    void reportUser(userId, username, {
      reason: input.value.reason,
      detail: input.value.detail ?? "",
    }).then((result) => {
      setSubmitting(false);
      if ("error" in result) {
        setError("failed");
        return;
      }
      setReason(undefined);
      setDetail("");
      onDone();
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t("title", { username })}
      closeLabel={tCommon("close")}
    >
      <SheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>{t("lead")}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("reasonLabel")}</Text>
          <View style={styles.options} accessibilityRole="radiogroup">
            {REPORT_REASONS.map((value, i) => {
              const selected = value === reason;
              return (
                <Fragment key={value}>
                  {i > 0 && <Divider tone="row" />}
                  <Pressable
                    testID={`report-reason-${value}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setReason(value)}
                    style={({ pressed }) => [
                      styles.option,
                      selected
                        ? styles.optionSelected
                        : pressed && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}
                    >
                      {t(`reasons.${value}`)}
                    </Text>
                    {selected && <Text style={styles.check}>{"✓"}</Text>}
                    {selected && (
                      <InsetRing color={colors.primary500} borderRadius={0} />
                    )}
                  </Pressable>
                </Fragment>
              );
            })}
          </View>
        </View>

        <TextField
          testID="report-detail"
          label={
            reason === "other" ? t("detailLabelRequired") : t("detailLabel")
          }
          value={detail}
          onChangeText={setDetail}
          placeholder={t("detailPlaceholder")}
          maxLength={REPORT_DETAIL_MAX_LENGTH}
          multiline
        />

        {error !== undefined && (
          <Text style={styles.error} testID="report-error">
            {t(`errors.${error}`, { max: REPORT_DETAIL_MAX_LENGTH })}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            testID="report-submit"
            disabled={submitting}
            onPress={submit}
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
          <TextLink onPress={onClose}>{t("cancel")}</TextLink>
        </View>
      </SheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    // 末尾の「キャンセル」をホームインジケータに掛けない
    paddingBottom: 32,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface600,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface700,
  },
  options: {
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: colors.primary50,
  },
  optionPressed: {
    backgroundColor: colors.surface50,
  },
  optionLabel: {
    flexShrink: 1,
    fontSize: 15,
    color: colors.surface700,
  },
  optionLabelSelected: {
    fontWeight: "600",
    color: colors.primary800,
  },
  check: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary700,
  },
  error: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.destructiveStrong,
  },
  actions: {
    gap: 16,
    alignItems: "center",
  },
});
