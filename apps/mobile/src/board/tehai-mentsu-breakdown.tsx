import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { MentsuType, resolveMentsuBreakdown } from "@mahjong-scoring/core";
import type {
  AgariContext,
  HaiKindId,
  MentsuBreakdownRow,
  Tehai,
} from "@mahjong-scoring/core";

import { DataTable } from "../components/data-table";
import { TilesIcon } from "../components/icons/icons";
import { InfoModal } from "../components/info-modal";
import { colors } from "../lib/theme";
import { FuroTiles } from "./furo-tiles";
import { ReferenceLinkButton } from "../practice/components/reference-link-button";

function ClosedTiles({
  hais,
  agariHaiIndex,
}: {
  readonly hais: readonly HaiKindId[];
  readonly agariHaiIndex?: number;
}) {
  return (
    <View style={styles.tiles} pointerEvents="none">
      {hais.map((kindId, i) => (
        <Hai key={i} hai={kindId} size="sm" highlighted={i === agariHaiIndex} />
      ))}
    </View>
  );
}

/**
 * 面子分解（web の `TehaiMentsuBreakdown`）
 *
 * 和了形を 4 面子 + 雀頭に分けた表をモーダルで見せる。答えが割れるので、
 * 盤面ではトレーニングの答え合わせ中（と結果の一覧）だけ出す。
 */
export function TehaiMentsuBreakdown({
  tehai,
  context,
}: {
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  readonly context: AgariContext;
}) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const breakdown = useMemo(
    () => resolveMentsuBreakdown(tehai, context),
    [tehai, context],
  );
  if (!breakdown) return undefined;

  const mentsuLabel = (row: MentsuBreakdownRow): string => {
    switch (row.mentsu.type) {
      case MentsuType.Shuntsu:
        return t("shuntsu");
      case MentsuType.Koutsu:
        return row.isOpen ? t("minkou") : t("ankou");
      case MentsuType.Kantsu:
        return row.isOpen ? t("minkan") : t("ankan");
    }
  };
  const hasRonMinkou = breakdown.fourMentsu.some(
    (row) => row.isOpen && !row.isExposed,
  );

  return (
    <View style={styles.trigger}>
      <ReferenceLinkButton
        icon={<TilesIcon size={14} color={colors.mutedForeground} />}
        label={t("mentsuBreakdown")}
        onPress={() => setIsOpen(true)}
      />
      <InfoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("mentsuBreakdown")}
        closeLabel={t("close")}
      >
        <View style={styles.body}>
          <DataTable
            columns={[
              { label: t("mentsuBreakdownColHai"), flex: 3 },
              { label: t("mentsuBreakdownColType"), align: "right", flex: 2 },
            ]}
            rows={[
              ...breakdown.fourMentsu.map((row) => [
                row.isExposed ? (
                  <View pointerEvents="none">
                    <FuroTiles
                      mentsu={row.mentsu}
                      furo={row.mentsu.furo}
                      size="sm"
                    />
                  </View>
                ) : (
                  <ClosedTiles
                    hais={row.mentsu.hais}
                    agariHaiIndex={row.agariHaiIndex}
                  />
                ),
                mentsuLabel(row),
              ]),
              [
                <ClosedTiles
                  key="jantou"
                  hais={breakdown.jantou.hais}
                  agariHaiIndex={breakdown.jantou.agariHaiIndex}
                />,
                t("jantou"),
              ],
            ]}
          />
          {hasRonMinkou && (
            <Text style={styles.note}>{t("mentsuBreakdownMinkouNote")}</Text>
          )}
        </View>
      </InfoModal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  body: {
    gap: 12,
  },
  tiles: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  note: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface700,
  },
});
