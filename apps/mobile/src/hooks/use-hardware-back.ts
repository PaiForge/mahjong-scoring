import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect } from "expo-router";

/**
 * Android の戻るボタンを、この画面が手前にある間だけ引き受ける
 * 戻るボタンのフック
 *
 * 購読を画面のマウントに結び付けると、上に別の画面（設定・ランキング等）を
 * 積んでも下の画面の購読が残り、上の画面で押した戻るを下の画面が消費する
 * （設定から戻ろうとして背後のチャレンジの中止の確認が開く等）。購読は
 * フォーカスに結び付け、外れたら外す（React Navigation の公式の書き方）。
 *
 * @param onBack 押されたときの処理。戻る既定の動作（1 画面戻る）は行わない
 */
export function useHardwareBack(onBack: () => void): void {
  useFocusEffect(
    useCallback(() => {
      // web（画面確認用）には戻るボタンの仕組みが無く、登録すると警告が出る
      if (Platform.OS === "web") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => sub.remove();
    }, [onBack]),
  );
}
