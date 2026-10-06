import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { TriangleRightIcon } from "../../components/icons/icons";
import { colors } from "../../lib/theme";
import { ReferenceLinkButton } from "./reference-link-button";

/**
 * 押すと開く内訳（web の `CollapsibleDetail`）
 *
 * 右寄せの小さな入口で開閉する。答え合わせの補足（符・翻の内訳）は既定で畳む。
 */
export function CollapsibleDetail({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.root}>
      <View style={styles.trigger}>
        <ReferenceLinkButton
          onPress={() => setIsOpen((prev) => !prev)}
          expanded={isOpen}
          icon={
            <View style={isOpen && styles.open}>
              <TriangleRightIcon size={10} color={colors.mutedForeground} />
            </View>
          }
          label={title}
        />
      </View>
      {isOpen && children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  trigger: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  open: {
    transform: [{ rotate: "90deg" }],
  },
});
