import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";
import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";

import { Button } from "../components/button";
import { ConfirmationModal } from "../components/confirmation-modal";
import { DashedDivider } from "../components/dashed-divider";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "../components/icons/icons";
import { colors, radius } from "../lib/theme";
import { useYakuOrder, useYakuOrderStore } from "../hooks/use-yaku-order-store";

/** 保存・既定に戻した知らせを鍵の横に出しておく時間 */
const NOTICE_MS = 2500;

/** 2 つの並びが同じ役を同じ順で持つか */
function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

/** 並びの index 番目を 1 つ上（-1）か下（+1）の役と入れ替える */
function swapAdjacent(
  order: readonly string[],
  index: number,
  direction: -1 | 1,
): readonly string[] {
  const target = index + direction;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  const moving = next[index];
  const other = next[target];
  if (moving === undefined || other === undefined) return order;
  next[index] = other;
  next[target] = moving;
  return next;
}

interface YakuOrderRowProps {
  readonly label: string;
  readonly position: number;
  /** 解錠中だけ上下の操作を出す */
  readonly sortable: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onMove: (direction: -1 | 1) => void;
  readonly moveUpLabel: string;
  readonly moveDownLabel: string;
}

/** 並び替えできる 1 行（役の並び順の行） */
function YakuOrderRow({
  label,
  position,
  sortable,
  isFirst,
  isLast,
  onMove,
  moveUpLabel,
  moveDownLabel,
}: YakuOrderRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.position}>{position}</Text>
      <Text style={styles.label}>{label}</Text>
      {sortable && (
        <View style={styles.moveButtons}>
          <MoveButton
            onPress={() => onMove(-1)}
            disabled={isFirst}
            accessibilityLabel={`${label} — ${moveUpLabel}`}
            direction="up"
          />
          <MoveButton
            onPress={() => onMove(1)}
            disabled={isLast}
            accessibilityLabel={`${label} — ${moveDownLabel}`}
            direction="down"
          />
        </View>
      )}
    </View>
  );
}

/** 1 つ上・下へ動かす小さなボタン（44px の指の的を保つ） */
function MoveButton({
  onPress,
  disabled,
  accessibilityLabel,
  direction,
}: {
  readonly onPress: () => void;
  readonly disabled: boolean;
  readonly accessibilityLabel: string;
  readonly direction: "up" | "down";
}) {
  const color = disabled ? colors.surface200 : colors.surface500;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.moveButton,
        pressed && styles.moveButtonPressed,
      ]}
    >
      {direction === "up" ? (
        <ChevronUpIcon size={18} color={color} />
      ) : (
        <ChevronDownIcon size={18} color={color} />
      )}
    </Pressable>
  );
}

interface YakuOrderSectionProps {
  /**
   * 鍵と保存の帯の描画を外へ渡す。帯は 36 行の上に追従させるため、
   * 画面のスクロールの直接の子として置く必要がある（`stickyHeaderIndices`）。
   */
  readonly renderLayout: (parts: YakuOrderSectionParts) => ReactNode;
}

/** 役の並び順の画面を組む部品 */
export interface YakuOrderSectionParts {
  readonly description: ReactNode;
  readonly toolbar: ReactNode;
  readonly list: ReactNode;
  readonly footer: ReactNode;
}

/**
 * 役の並び順設定セクション（web の `YakuOrderSection`）
 *
 * 役の選択練習と点数計算練習の選択肢の並びを、よく使う順に並び替える。
 * 出題内容も正解判定も変わらない。
 *
 * web はつまみのドラッグ（dnd-kit）で並び替えるが、モバイルは依存を増やさず
 * 各行の ▲ ▼ で 1 つずつ動かす。施錠・下書き・保存・既定に戻すの流れは web と同じで、
 * 施錠中は読むだけの一覧に戻し、解錠したときだけ ▲ ▼ を出す（触っただけで
 * 並びが変わるのを防ぐ）。保存の知らせは web のトーストの代わりに、鍵の横の
 * ラベルを一時的に差し替えて出す（操作とその結果を同じ場所に置く）。
 */
export function YakuOrderSection({ renderLayout }: YakuOrderSectionProps) {
  const t = useTranslations("settings.yakuOrder");
  const savedOrder = useYakuOrder();
  const labelOf = useYakuLabel();
  const setOrder = useYakuOrderStore((s) => s.setOrder);
  const resetOrder = useYakuOrderStore((s) => s.reset);

  /** 解錠中の並び。undefined なら施錠中で、保存済みの並びをそのまま映す */
  const [draft, setDraft] = useState<readonly string[] | undefined>(undefined);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const isEditing = draft !== undefined;
  const items = draft ?? savedOrder;
  const hasUnsavedChanges =
    draft !== undefined && !isSameOrder(draft, savedOrder);
  // 戻す先が今の状態と同じなら押させない。保存済みが既定でも、下書きに
  // 保存していない並び替えが残っていれば戻す意味がある。
  const canResetToDefault =
    !isSameOrder(savedOrder, YAKU_DEFAULT_ORDER) || hasUnsavedChanges;

  useEffect(() => {
    if (notice === undefined) return;
    const timer = setTimeout(() => setNotice(undefined), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleMove = useCallback((index: number, direction: -1 | 1) => {
    setDraft((current) =>
      current === undefined ? current : swapAdjacent(current, index, direction),
    );
  }, []);

  const handleUnlock = useCallback(() => {
    setNotice(undefined);
    setDraft([...savedOrder]);
  }, [savedOrder]);

  const handleRequestDiscard = useCallback(() => {
    // 並び替えていないなら確認を挟まない（何も失わない操作にモーダルを見せない）
    if (!hasUnsavedChanges) {
      setDraft(undefined);
      return;
    }
    setIsDiscardConfirmOpen(true);
  }, [hasUnsavedChanges]);

  const handleConfirmDiscard = useCallback(() => {
    setIsDiscardConfirmOpen(false);
    setDraft(undefined);
  }, []);

  // 鍵を閉じる操作は「取り消す」と同じ経路を通す
  const handleToggleLock = isEditing ? handleRequestDiscard : handleUnlock;

  const handleSave = useCallback(() => {
    if (draft === undefined) return;
    // 既定順そのものは保存しない。保存してしまうと既定順を変えたときに
    // その変更が届かなくなる（use-yaku-order-store の order を参照）。
    if (isSameOrder(draft, YAKU_DEFAULT_ORDER)) {
      resetOrder();
    } else {
      setOrder(draft);
    }
    setDraft(undefined);
    setIsDiscardConfirmOpen(false);
    setNotice(t("savedToast"));
  }, [draft, resetOrder, setOrder, t]);

  const handleConfirmReset = useCallback(() => {
    // 既定順そのものは保存しない（handleSave と同じ理由）
    resetOrder();
    setDraft(undefined);
    setIsResetConfirmOpen(false);
    setNotice(t("resetToast"));
  }, [resetOrder, t]);

  const description = (
    <Text style={styles.description}>{t("description")}</Text>
  );

  const toolbar = (
    <View style={styles.toolbarWrap}>
      <View
        style={[
          styles.toolbar,
          isEditing ? styles.toolbarEditing : styles.toolbarLocked,
        ]}
      >
        <Pressable
          onPress={handleToggleLock}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? t("lockAria") : t("unlockAria")}
          accessibilityState={{ selected: isEditing }}
          style={styles.lockButton}
        >
          {isEditing ? (
            <LockOpenIcon size={20} color={colors.warning} />
          ) : (
            <LockClosedIcon size={20} color={colors.surface500} />
          )}
        </Pressable>
        <Text
          style={[
            styles.toolbarLabel,
            isEditing && styles.toolbarLabelEditing,
            !isEditing && notice !== undefined && styles.toolbarLabelNotice,
          ]}
          accessibilityLiveRegion="polite"
        >
          {isEditing ? t("editingLabel") : (notice ?? t("lockedLabel"))}
        </Text>
        {isEditing && (
          <>
            <Button variant="neutral" size="sm" onPress={handleRequestDiscard}>
              {t("cancel")}
            </Button>
            <Button variant="primary" size="sm" onPress={handleSave}>
              {t("save")}
            </Button>
          </>
        )}
      </View>
      {/* ▲ ▼ で動かせることは解錠したときにその場で言う */}
      {isEditing && <Text style={styles.hint}>{t("moveHint")}</Text>}
    </View>
  );

  const list = (
    <View style={styles.list}>
      {items.map((name, index) => (
        <View key={name}>
          {index > 0 && <DashedDivider thickness={2} />}
          <YakuOrderRow
            label={labelOf(name)}
            position={index + 1}
            sortable={isEditing}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onMove={(direction) => handleMove(index, direction)}
            moveUpLabel={t("moveUpAria")}
            moveDownLabel={t("moveDownAria")}
          />
        </View>
      ))}
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      <Button
        variant="neutral"
        size="sm"
        onPress={() => setIsResetConfirmOpen(true)}
        disabled={!canResetToDefault}
      >
        {t("reset")}
      </Button>

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title={t("resetTitle")}
        confirmText={t("resetConfirm")}
        cancelText={t("resetCancel")}
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={handleConfirmDiscard}
        title={t("discardTitle")}
        message={t("discardMessage")}
        confirmText={t("discardConfirm")}
        cancelText={t("discardCancel")}
        confirmVariant="danger"
      />
    </View>
  );

  return renderLayout({ description, toolbar, list, footer });
}

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface600,
  },
  toolbarWrap: {
    gap: 8,
    // 追従中に下の行が透けないよう、帯の外側も白で塗る
    backgroundColor: colors.card,
    paddingVertical: 4,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 3,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toolbarLocked: {
    borderColor: "transparent",
    backgroundColor: colors.surface100,
  },
  toolbarEditing: {
    borderColor: colors.amber500,
    backgroundColor: colors.amber50,
  },
  lockButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  toolbarLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.surface600,
  },
  toolbarLabelEditing: {
    fontWeight: "700",
    color: colors.warning,
  },
  toolbarLabelNotice: {
    fontWeight: "700",
    color: colors.primary700,
  },
  hint: {
    paddingHorizontal: 4,
    textAlign: "right",
    fontSize: 12,
    lineHeight: 18,
    color: colors.surface500,
  },
  list: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 46,
  },
  position: {
    width: 24,
    textAlign: "right",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    color: colors.surface400,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: colors.surface900,
    paddingVertical: 12,
  },
  moveButtons: {
    flexDirection: "row",
    marginRight: -8,
  },
  moveButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  moveButtonPressed: {
    backgroundColor: colors.surface100,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
