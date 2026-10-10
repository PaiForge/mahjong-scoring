import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { TsumoPayment } from "@mahjong-scoring/core";
import { deriveKoTsumoFromRon } from "@mahjong-scoring/features/curriculum/ko-tsumo-halving";

import { Divider } from "../../components/divider";
import { ArrowDownIcon } from "../../components/icons/icons";
import { colors, radius } from "../../lib/theme";
import { lessonColors } from "../lesson-colors";
import { TsumoScore } from "./tsumo-score";

/**
 * 「ある数字から別の数字を導く」章の図の外殻（web の `DerivationFigure`）
 * 導出図
 *
 * web は広い画面で横に並べ、狭い画面で矢印を下向きにして縦に積む。
 * モバイルは常に縦に積む。
 */
export function DerivationFigure({
  caption,
  children,
  footer,
}: {
  readonly caption: string;
  /** 鎖の中身。{@link DerivationStep} と {@link DerivationArrow} を交互に並べる */
  readonly children: ReactNode;
  /** 鎖の下に置く答え合わせや一言 */
  readonly footer?: ReactNode;
}) {
  return (
    <View style={styles.figure}>
      <Text style={styles.caption}>{caption}</Text>
      <View style={styles.chain}>{children}</View>
      {footer}
    </View>
  );
}

/**
 * 鎖の1項。導出の途中で出た数字を、何を指す額なのかと一緒に置く
 *
 * 数字はそのまま、点数表と同じ体裁で見せたい段は `TsumoScore` を渡す。
 */
export function DerivationStep({
  label,
  children,
  highlighted = false,
}: {
  readonly label: string;
  readonly children: number | ReactNode;
  /** 導出の結果として強調するか（出発点や途中の項は強調しない） */
  readonly highlighted?: boolean;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepLabel}>{label}</Text>
      {typeof children === "number" ? (
        <Text style={highlighted ? styles.highlighted : styles.stepValue}>
          {children}
        </Text>
      ) : (
        <View
          style={[styles.stepBox, highlighted && styles.stepBoxHighlighted]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

/** 鎖のつなぎ目。矢印の下に、そこで何をしたのかを書く */
export function DerivationArrow({ label }: { readonly label: string }) {
  return (
    <View style={styles.step}>
      <ArrowDownIcon size={24} color={colors.surface500} />
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

/** 鎖の下に置く答え合わせの段（破線で区切り、点数表の実際の値を見せる） */
function DerivationResult({
  label,
  payment,
}: {
  readonly label: string;
  readonly payment: TsumoPayment;
}) {
  return (
    <View style={styles.resultBlock}>
      <Divider />
      <View style={styles.result}>
        <Text style={styles.stepLabel}>{label}</Text>
        <TsumoScore payment={payment} color={colors.surface900} />
      </View>
    </View>
  );
}

/**
 * 子のロンを2回半分にして子ツモへたどり着く図（web の `HalvingDiagram`）
 * 半分ずつの図
 *
 * 導出は features の `deriveKoTsumoFromRon` を通し、答え合わせの側は
 * 呼び出し元が点数表から取って渡す。
 */
export function HalvingDiagram({
  caption,
  ron,
  payment,
}: {
  readonly caption: string;
  readonly ron: number;
  readonly payment: TsumoPayment;
}) {
  const t = useTranslations("learnCurriculum.halvingDiagram");
  const derived = deriveKoTsumoFromRon(ron);
  if (derived.type !== "koTsumo") return undefined;
  return (
    <DerivationFigure
      caption={caption}
      footer={<DerivationResult label={t("resultLabel")} payment={payment} />}
    >
      <DerivationStep label={t("ronLabel")}>{ron}</DerivationStep>
      <DerivationArrow label={t("arrowLabel")} />
      <DerivationStep label={t("oyaLabel")} highlighted>
        {derived.fromOya}
      </DerivationStep>
      <DerivationArrow label={t("arrowLabel")} />
      <DerivationStep label={t("koLabel")} highlighted>
        {derived.fromKo}
      </DerivationStep>
    </DerivationFigure>
  );
}

/** 親のツモを分け合う人数（子3人） */
const KO_COUNT = 3;

/**
 * 親のロンを3で割ってオールへたどり着く図（web の `OyaAllDiagram`）
 * オール導出図
 *
 * 満貫以上の親のロンはどれも3で割り切れ、この章はその範囲しか扱わないので、
 * 割り算は図の中で行う。
 */
export function OyaAllDiagram({
  caption,
  ron,
  payment,
}: {
  readonly caption: string;
  readonly ron: number;
  readonly payment: TsumoPayment;
}) {
  const t = useTranslations("manganOyaTsumo.learn");
  return (
    <DerivationFigure
      caption={caption}
      footer={
        <DerivationResult label={t("divisionResultLabel")} payment={payment} />
      }
    >
      <DerivationStep label={t("divisionRonLabel")}>{ron}</DerivationStep>
      <DerivationArrow label={t("divisionArrowLabel")} />
      <DerivationStep label={t("divisionAllLabel")} highlighted>
        {ron / KO_COUNT}
      </DerivationStep>
    </DerivationFigure>
  );
}

const styles = StyleSheet.create({
  figure: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
    padding: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.surface400,
  },
  chain: {
    alignItems: "center",
    gap: 12,
  },
  step: {
    alignItems: "center",
    gap: 4,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.surface500,
  },
  stepBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  stepBoxHighlighted: {
    backgroundColor: lessonColors.amber50Solid,
  },
  stepValue: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 18,
    fontWeight: "600",
    color: colors.surface900,
  },
  highlighted: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: lessonColors.amber50Solid,
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
  },
  resultBlock: {
    gap: 12,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
