import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  DOJO_PATH,
  practicePlayHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";

import { BottomSheet } from "../../components/bottom-sheet";
import { Button, buttonForeground } from "../../components/button";
import {
  InfinityIcon,
  LockClosedIcon,
  PlayIcon,
} from "../../components/icons/icons";
import { BeltButton } from "../../dojo/belt-button";
import { useGoToTab } from "../../hooks/use-go-to-tab";
import { colors } from "../../lib/theme";
import {
  useLockedExamMessage,
  useRealExamGate,
  type RealExamGate,
} from "./exam-start-gate";

/** 本番を始められないときの状態（鍵の付いたボタンとシートで理由を出す） */
type BlockedGate = Extract<
  RealExamGate,
  { kind: "signedOut" | "usernameMissing" | "locked" }
>;

/**
 * 昇級試験の説明画面の下端の帯（`Screen` の `footer`）
 *
 * @description
 * 練習の説明画面の帯（`PracticeStartCta`）と同じ形: 上に 1 行の補足、その下に
 * 等幅の 2 つのボタン（左に模試、右に本番の試験）。並びと文言は受験できるか
 * どうかに依らず固定し、状態は色と鍵の印で示す。
 *
 * - 緑の塗りは「今すぐ始められる方」に付ける。本番を受けられる人は右の本番、
 *   受けられない人（ゲスト・ユーザー名が無い・先に取る級がある）は左の模試
 * - 受けられないときの本番は白地に鍵の印。押すと下からのシートで理由と次の
 *   一手（登録 / ログイン・ユーザー名の設定・道場）を出す
 * - 本番の導線を出せないとき（ログインを出せないビルド・BAN 中）は模試だけを
 *   幅いっぱいの緑で出す
 *
 * 却下: 右のボタンを状態ごとに「アカウント登録に進む」「道場で次の目標を
 * 確認する」へ差し替える形（web の `ExamStartGate` と、以前のアプリの本文の
 * 並び）。帯に並べると状態ごとに別のボタンに見え、ゲストには試験を始める
 * 画面に見えない。補足の文も帯の 1 行に収まらない。
 */
export function ExamStartFooter({ slug }: { readonly slug: PracticeMenuSlug }) {
  const tExam = useTranslations("examTraining");
  const router = useRouter();
  const gate = useRealExamGate(slug);
  const [blocked, setBlocked] = useState<BlockedGate | undefined>(undefined);
  const { timeLimit, mistakeLimit } = practiceMenuBySlug(slug);

  const startTraining = () => router.push(practiceTrainingHref(slug));

  if (gate.kind === "hidden") {
    return (
      <View style={styles.frame}>
        <Text style={styles.hint}>{tExam("hint")}</Text>
        <Button
          size="lg"
          fullWidth
          icon={<InfinityIcon size={16} color={buttonForeground("primary")} />}
          onPress={startTraining}
          testID="start-training"
        >
          {tExam("footerMockButton")}
        </Button>
      </View>
    );
  }

  const canStart = gate.kind === "start";
  const trainingVariant = canStart ? "secondary" : "primary";
  const realDisabled = canStart && !gate.ready;

  return (
    <View style={styles.frame}>
      <Text style={styles.hint}>
        {tExam("realExamHint", { timeLimit, mistakeLimit })}
      </Text>
      <View style={styles.buttons}>
        <Button
          variant={trainingVariant}
          size="lg"
          style={styles.half}
          icon={
            <InfinityIcon size={16} color={buttonForeground(trainingVariant)} />
          }
          onPress={startTraining}
          testID="start-training"
        >
          {tExam("footerMockButton")}
        </Button>
        {canStart ? (
          <Button
            size="lg"
            style={styles.half}
            disabled={realDisabled}
            icon={
              <PlayIcon
                size={16}
                color={buttonForeground("primary", realDisabled)}
              />
            }
            onPress={() => router.push(practicePlayHref(slug))}
            testID="start-exam"
          >
            {tExam("footerRealButton")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            style={styles.half}
            icon={
              <LockClosedIcon size={16} color={buttonForeground("secondary")} />
            }
            onPress={() => setBlocked(gate)}
            testID="start-exam-locked"
          >
            {tExam("footerRealButton")}
          </Button>
        )}
      </View>
      <BlockedExamSheet gate={blocked} onClose={() => setBlocked(undefined)} />
    </View>
  );
}

/**
 * 本番を受けられない理由と次の一手のシート
 *
 * 行き先へ移る前にシートを閉じる（開いたまま積むと、シートの下に画面が入る）。
 */
function BlockedExamSheet({
  gate,
  onClose,
}: {
  readonly gate: BlockedGate | undefined;
  readonly onClose: () => void;
}) {
  const t = useTranslations("ranks");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const goToTab = useGoToTab();
  const lockedMessage = useLockedExamMessage();
  const go = (move: () => void) => {
    onClose();
    move();
  };

  return (
    <BottomSheet
      isOpen={gate !== undefined}
      onClose={onClose}
      title={t("examGate.sheetTitle")}
    >
      <View style={styles.sheetBody}>
        {gate?.kind === "signedOut" && (
          <>
            <Text style={styles.text}>{t("examGate.signUpNote")}</Text>
            <Text style={styles.text}>{t("examGate.signUpReason")}</Text>
            <View style={styles.actions}>
              <Button
                fullWidth
                onPress={() => go(() => router.push("/sign-up"))}
                testID="exam-sign-up"
              >
                {t("examGate.signUpButton")}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onPress={() => go(() => router.push("/sign-in"))}
                testID="exam-sign-in"
              >
                {t("examGate.signInButton")}
              </Button>
            </View>
          </>
        )}
        {gate?.kind === "usernameMissing" && (
          <>
            <Text style={styles.text}>{t("examGate.usernameNote")}</Text>
            <View style={styles.actions}>
              <Button
                fullWidth
                onPress={() => go(() => router.push("/mypage/setup-username"))}
                testID="exam-setup-username"
              >
                {t("examGate.usernameButton")}
              </Button>
            </View>
          </>
        )}
        {gate?.kind === "locked" && (
          <>
            <Text style={styles.text}>{lockedMessage(gate.eligibility)}</Text>
            <View style={styles.actions}>
              <BeltButton
                slug={gate.eligibility.requiredRank.slug}
                onPress={() => go(() => goToTab(DOJO_PATH))}
              >
                {t("examGate.dojoButton")}
              </BeltButton>
            </View>
          </>
        )}
        <Button
          variant="neutral"
          fullWidth
          onPress={onClose}
          testID="exam-gate-close"
        >
          {tCommon("close")}
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  frame: {
    gap: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.surface500,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  // 2 つのボタンで行を等分する（文字の幅に依らない）
  half: {
    flex: 1,
    flexBasis: 0,
  },
  sheetBody: {
    gap: 16,
    paddingBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  actions: {
    gap: 8,
  },
});
