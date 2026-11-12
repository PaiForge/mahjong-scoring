import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "../lib/theme";
import { SymbolIcon, type SymbolName } from "./icons/symbol-icon";

/** ヘッダーのボタン 1 つ分（`Screen` が並べる） */
export interface HeaderAction {
  readonly label: string;
  readonly testID?: string;
  readonly icon?: SymbolName;
  readonly element?: ReactNode;
  /** 押したとき。登録した側の最新の `onPress` を呼ぶ */
  readonly onPress: () => void;
}

/** `Screen` が子孫へ配る登録口 */
export interface HeaderActionRegistry {
  readonly set: (id: string, action: HeaderAction) => void;
  readonly remove: (id: string) => void;
}

/** 最寄りの `Screen` の登録口（`Screen` の外では無い） */
export const HeaderActionContext = createContext<
  HeaderActionRegistry | undefined
>(undefined);

type HeaderIconButtonProps = {
  /** 読み上げの名前（記号だけのボタンなので必ず渡す） */
  readonly label: string;
  readonly onPress: () => void;
  readonly testID?: string;
} & (
  | { readonly icon: SymbolName; readonly element?: undefined }
  | { readonly element: ReactNode; readonly icon?: undefined }
);

/**
 * 最寄りの `Screen` のヘッダー右にボタンを出す（自分は何も描かない）
 * ヘッダーのボタン
 *
 * ヘッダーは OS のもの（ネイティブスタックのヘッダー）で、右の要素は
 * `Stack.Toolbar placement="right"` の `Stack.Toolbar.View` に置く。その中身は
 * ナビゲーターが画面の外で描くので、画面の中の Context（`Screen` の中の
 * Provider 等）と画面の状態を持てない（ルートの Provider は届く）。そこで、
 * ボタンを置きたい部品（「?」とそれが開くシート等）は本文の木の中に描いたまま、
 * ボタンの中身（記号・読み上げ名・押したときの関数）だけをこの部品で最寄りの
 * `Screen` に登録し、`Screen` がヘッダーへ並べる。シートの開閉の状態は画面の
 * 木に残るので、ヘッダーが描き直されても消えない。`Screen` の `titleAction` に
 * 渡す部品の中で使う（呼び出し側は `titleAction` を変えずに済む）。
 *
 * ボタンは `Pressable`（`testID` 付き）+ `SymbolIcon` で作る。iOS 26 以降は
 * ヘッダーのボタンに OS がガラスの面を付ける。`Stack.Toolbar.Button` を使わない
 * のは、Android で記号を受けず（画像だけ）`testID` も持たないため — Maestro は
 * testID で押す決まり。OS 標準の戻る（`<`）には testID が無い。
 *
 * `onPress` は登録した時点の関数ではなく、いつも最新のものを呼ぶ
 * （ヘッダーの要素を描き直さずに済ませるため、関数は ref で持つ）。
 *
 * @param icon ヘッダーに出す記号（`element` とどちらか）
 * @param element 記号の代わりに出す要素（ホームのアバター）。ナビゲーターが
 *   描くので、画面の中の Context に頼らない部品にする
 */
export function HeaderIconButton({
  label,
  onPress,
  testID,
  icon,
  element,
}: HeaderIconButtonProps): null {
  const registry = use(HeaderActionContext);
  const id = useId();
  const onPressRef = useRef(onPress);
  useLayoutEffect(() => {
    onPressRef.current = onPress;
  });
  useLayoutEffect(() => {
    if (registry === undefined) return;
    registry.set(id, {
      label,
      testID,
      icon,
      element,
      onPress: () => onPressRef.current(),
    });
  }, [registry, id, label, testID, icon, element]);
  useLayoutEffect(() => {
    if (registry === undefined) return;
    return () => registry.remove(id);
  }, [registry, id]);
  return null;
}

/**
 * ヘッダーに置くボタンの見た目（`Screen` が左右の要素に使う）
 *
 * 当たり判定は 36pt 四方 + `hitSlop`（44pt 以上）。押したときは薄くする
 * （ガラスの面の上なので地の色を塗らない）。
 */
export function HeaderButton({ action }: { readonly action: HeaderAction }) {
  return (
    <Pressable
      testID={action.testID}
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {action.element ??
        (action.icon !== undefined && (
          <SymbolIcon name={action.icon} size={20} color={colors.foreground} />
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.5,
  },
});
