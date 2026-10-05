import { StyleSheet, View } from "react-native";

import { Button } from "../../components/button";
import { useTrainingMode } from "../hooks/use-training-mode";

/**
 * チャレンジモード共通の送信ボタン（web の `ChallengeSubmitButton`）
 * チャレンジ送信ボタン
 *
 * トレーニングで回答後に停止している間は描かない。同じ位置にシェルが
 * 「次の問題へ」を出すため、無効化した送信ボタンと二段に並ぶのを避ける。
 */
export function ChallengeSubmitButton({
  disabled,
  onPress,
  children,
}: {
  /** ボタンが無効かどうか */
  readonly disabled: boolean;
  readonly onPress: () => void;
  /** ボタンラベル */
  readonly children: string;
}) {
  const { isHolding } = useTrainingMode();
  if (isHolding) return undefined;

  return (
    <View style={styles.root}>
      <Button size="lg" fullWidth onPress={onPress} disabled={disabled}>
        {children}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
  },
});
