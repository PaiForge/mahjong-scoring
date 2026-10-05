import { memo, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { getKazeName, isOya } from "@mahjong-scoring/core";
import type { HaiKindId, Tehai } from "@mahjong-scoring/core";
import type { TehaiContext } from "@mahjong-scoring/features/board/tehai-context";
import { resolveBoardDora } from "@mahjong-scoring/features/settings/dora-display";

import { AutoScale } from "../components/auto-scale";
import { HelpIconButton } from "../components/help-icon-button";
import { InfoModal } from "../components/info-modal";
import { TextLink } from "../components/text-link";
import { useDoraDisplayMode } from "../hooks/use-display-settings-store";
import { colors, radius } from "../lib/theme";
import { useBoardBleed } from "./board-bleed";
import { RiichiStick } from "./riichi-stick";
import { HAI_SM_HEIGHT, REFERENCE_HAND_WIDTH, TehaiHand } from "./tehai-hand";

/** 牌を含まない状況行の高さ（px）。リーチ棒とその名札が収まる高さ */
const TEXT_ROW_HEIGHT = 22;

interface TehaiDisplayProps {
  /** 表示する手牌（純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  readonly context: TehaiContext;
  /**
   * 左右を画面端まで広げるか（省略時は置き場所の {@link useBoardBleed} に従う）
   */
  readonly fullBleed?: boolean;
}

/** 状況行のドラ・裏ドラ（名札 + 牌列） */
function DoraGroup({
  label,
  tiles,
  onHelp,
  helpLabel,
}: {
  readonly label: string;
  readonly tiles: readonly HaiKindId[];
  readonly onHelp?: () => void;
  readonly helpLabel?: string;
}) {
  return (
    <View style={styles.doraGroup}>
      <Text style={styles.doraLabel}>{label}</Text>
      {onHelp !== undefined && helpLabel !== undefined && (
        <HelpIconButton onPress={onHelp} label={helpLabel} fontSize={12} />
      )}
      <View style={styles.doraTiles} pointerEvents="none">
        {tiles.map((tile, i) => (
          <Hai key={i} hai={tile} size="sm" />
        ))}
      </View>
    </View>
  );
}

/**
 * 出題盤面の手牌表示
 * 手牌表示
 *
 * web の `TehaiDisplay` の移植。濃い緑の盤面に、上段で手牌の外から来る条件
 * （場・自風・親子・リーチ・ドラ）を 1 行で並べ、下段に手牌を置く。
 * 状況行も折り返さず、手牌と同じ倍率まで縮めて幅に収める。ドラの「?」で
 * ドラの見方（表示牌かドラそのものか）を説明し、設定へ送る。
 */
export const TehaiDisplay = memo(function TehaiDisplayComponent({
  tehai,
  context,
  fullBleed: fullBleedProp,
}: TehaiDisplayProps) {
  const bleed = useBoardBleed();
  const fullBleed = fullBleedProp ?? bleed;
  const t = useTranslations("common");
  const router = useRouter();
  const doraDisplay = useDoraDisplayMode();
  const isIndicator = doraDisplay === "indicator";
  const [showDoraInfo, setShowDoraInfo] = useState(false);
  const [scale, setScale] = useState(1);

  const { doraTiles, uraDoraTiles } = useMemo(
    () => resolveBoardDora(context, doraDisplay),
    [context, doraDisplay],
  );
  const hasDoraTiles = doraTiles.length > 0 || uraDoraTiles.length > 0;
  const oya = isOya(context.jikaze);

  return (
    <View style={[styles.frame, fullBleed ? styles.fullBleed : styles.inset]}>
      <View style={styles.infoRow}>
        <AutoScale
          referenceWidth={REFERENCE_HAND_WIDTH}
          naturalHeight={hasDoraTiles ? HAI_SM_HEIGHT : TEXT_ROW_HEIGHT}
          maxScale={scale}
          anchor="top"
        >
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              {getKazeName(context.bakaze)}
              {t("round")} {getKazeName(context.jikaze)}
              {t("wind")}
              <Text style={oya ? styles.oya : undefined}>
                {"  "}
                {oya ? t("dealer") : t("nonDealer")}
              </Text>
            </Text>
            {context.isRiichi && <RiichiStick label={t("riichi")} />}
            {doraTiles.length > 0 && (
              <DoraGroup
                label={t(isIndicator ? "doraIndicator" : "dora")}
                tiles={doraTiles}
                onHelp={() => setShowDoraInfo(true)}
                helpLabel={t("showDetailInfo")}
              />
            )}
            {uraDoraTiles.length > 0 && (
              <DoraGroup
                label={t(isIndicator ? "uraDoraIndicator" : "uraDora")}
                tiles={uraDoraTiles}
              />
            )}
          </View>
        </AutoScale>
      </View>

      <TehaiHand
        tehai={tehai}
        agariHai={context.agariHai}
        agariLabel={
          context.isTsumo === undefined
            ? undefined
            : context.isTsumo
              ? t("tsumo")
              : t("ron")
        }
        onScaleChange={setScale}
      />

      <InfoModal
        isOpen={showDoraInfo}
        onClose={() => setShowDoraInfo(false)}
        title={t("doraInfoTitle")}
        closeLabel={t("close")}
        footnote={
          <TextLink
            onPress={() => {
              setShowDoraInfo(false);
              router.push("/preferences");
            }}
          >
            {t("doraInfoSettingsLink")}
          </TextLink>
        }
      >
        {t(isIndicator ? "doraInfoIndicator" : "doraInfoActual")}
      </InfoModal>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.primary800,
    borderColor: colors.ink,
    paddingVertical: 12,
  },
  inset: {
    borderWidth: 3,
    borderRadius: radius.xl,
    paddingHorizontal: 12,
  },
  fullBleed: {
    marginHorizontal: -16,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    paddingHorizontal: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.white,
  },
  oya: {
    color: "#fde047",
  },
  doraGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  doraLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  doraTiles: {
    flexDirection: "row",
    gap: 2,
  },
});
