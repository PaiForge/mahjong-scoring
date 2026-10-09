import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Hai } from "@pai-forge/mahjong-react-ui";
import type {
  HaiKindId,
  MentsuBreakdownCandidate,
  MentsuBreakdownContext,
  Tehai,
} from "@mahjong-scoring/core";

import { DataTable } from "../components/data-table";
import { TilesIcon } from "../components/icons/icons";
import { InfoModal } from "../components/info-modal";
import { ToggleGroup, toggleLabelColor } from "../components/toggle-group";
import { useFuHanOrder } from "../hooks/use-display-settings-store";
import { colors } from "../lib/theme";
import { FuroTiles } from "./furo-tiles";
import { TehaiHand } from "./tehai-hand";
import { ReferenceLinkButton } from "../practice/components/reference-link-button";
import { hasRonMinkou } from "@mahjong-scoring/features/board/mentsu-breakdown";
import { useMentsuBreakdown } from "@mahjong-scoring/features/board/use-mentsu-breakdown";

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
 *
 * 解釈が複数ある手（面子分解が割れる・和了牌の入れ方が割れる）では、
 * 候補を高点法の順にセグメントコントロールで切り替えられる。最も高い
 * 点数になる解釈には「最高点」のバッジを付け、同じ点数の解釈には同じ
 * バッジを付ける（絵文字ではなく文字。OS で絵が変わらず、凡例も要らない）。
 * 解釈が 1 つの手では切り替えを出さない。
 *
 * 分解の上には分ける前の手牌を盤面と同じ並び（{@link TehaiHand}）で置き、
 * 盤面へ戻らなくても何を分けたのかが読めるようにする（web と同じ）。主役は
 * 分解なので、手牌は折り返さず幅に収まる倍率まで縮めてよい。
 */
export function TehaiMentsuBreakdown({
  tehai,
  context,
}: {
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了状況。出題がドラ表示牌を持つならそれも渡す（候補の順位を採点と揃える） */
  readonly context: MentsuBreakdownContext;
}) {
  const t = useTranslations("common");
  const {
    candidates,
    selected,
    select,
    isOpen,
    open,
    close,
    mentsuLabel,
    fuHanLabel,
  } = useMentsuBreakdown(tehai, context, useFuHanOrder());
  if (selected === undefined) return undefined;

  const candidateLabel = (candidate: MentsuBreakdownCandidate) => {
    const fuHan = fuHanLabel(candidate);
    const isSelected = candidate.key === selected.key;
    // 文字色はセグメントの選択状態に合わせ、バッジは枠と文字を同じ色にする
    const color = toggleLabelColor(isSelected);
    return (
      <View style={styles.segmentLabel}>
        <Text style={[styles.segmentText, { color }]}>{fuHan}</Text>
        {candidate.isBest && (
          <View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>
              {t("mentsuBreakdownBest")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const { breakdown } = selected;
  const showsCandidateTabs = candidates.length > 1;
  const showsRonMinkouNote = hasRonMinkou(breakdown.fourMentsu);

  return (
    <View style={styles.trigger}>
      <ReferenceLinkButton
        icon={<TilesIcon size={14} color={colors.mutedForeground} />}
        label={t("mentsuBreakdown")}
        onPress={open}
      />
      <InfoModal
        isOpen={isOpen}
        onClose={close}
        title={t("mentsuBreakdown")}
        closeLabel={t("close")}
      >
        <View style={styles.body}>
          <TehaiHand
            tehai={tehai}
            agariHai={context.agariHai}
            agariLabel={context.isTsumo ? t("tsumo") : t("ron")}
            agariLabelTone="light"
          />
          {showsCandidateTabs && (
            <ToggleGroup
              groups={[
                candidates.map((c) => ({
                  value: c.key,
                  label: candidateLabel(c),
                })),
              ]}
              selected={selected.key}
              onSelect={select}
              accessibilityLabel={t("mentsuBreakdown")}
            />
          )}
          <DataTable
            columns={[
              { label: t("mentsuBreakdownColHai"), flex: 3 },
              { label: t("mentsuBreakdownColType"), align: "right", flex: 2 },
            ]}
            // 雀頭と4面子を手牌の左から右と同じ順に並べる（web と同じ）
            rows={breakdown.blocks.map((block) => {
              if (block.kind === "Jantou") {
                return [
                  <ClosedTiles
                    key="jantou"
                    hais={block.row.hais}
                    agariHaiIndex={block.row.agariHaiIndex}
                  />,
                  t("jantou"),
                ];
              }
              const { row } = block;
              return [
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
              ];
            })}
          />
          {showsRonMinkouNote && (
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
  segmentLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
