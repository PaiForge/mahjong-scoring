import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "../lib/theme";

/** 上端を引き下げて閉じる距離（px） */
const DRAG_CLOSE_DISTANCE = 96;
/** 上端を払って閉じる速さ（px/ms）。距離が足りなくても素早く払えば閉じる */
const DRAG_CLOSE_VELOCITY = 0.8;
/** 中身を先頭からさらに引き下げて閉じる量（iOS の引っ張りの量、px） */
const PULL_CLOSE_DISTANCE = 72;

interface BottomSheetProps {
  readonly isOpen: boolean;
  /** 背景のタップ・引き下げ・Android の戻るボタンで閉じるとき */
  readonly onClose: () => void;
  /** 上端の見出し。省略すると出さない */
  readonly title?: string;
  /** 背景の読み上げ名（「閉じる」）。背景を押すと閉じることを伝える */
  readonly closeLabel: string;
  /**
   * シートの高さ
   *
   * 既定は中身の高さ（画面の 85% が上限）。一覧のように中身が自分で
   * スクロールするものは固定の高さ（画面の割合）を渡し、中身がそれを埋める
   */
  readonly height?: DimensionValue;
  readonly children: ReactNode;
}

const SheetCloseContext = createContext<(() => void) | undefined>(undefined);

/**
 * 下からせり上がるシート（ボトムシート）
 * ボトムシート
 *
 * 説明・選択肢の一覧・補足の設定など、画面の上に一時的に重ねて読ませる /
 * 選ばせるものの器。スマホアプリでは中央のダイアログより下からのシートが
 * 定石（親指で届き、背景を押せば閉じる）。
 *
 * 上端の取っ手は「引き下げて閉じられる」印で、OS 標準のシートと同じ記号。
 * 印だけで閉じられないと、指が覚えている操作が効かずに固まって見えるので、
 * 2 つの経路で閉じる:
 *
 * - 上端（取っ手と見出し）を引き下げる — 指に付いて動き、一定以上引くか
 *   素早く払えば閉じ、足りなければ戻る
 * - 中身のスクロールを先頭から更に引き下げる — 中身のスクロール枠が
 *   {@link useSheetPullToClose} を受け取って付ける（iOS の引っ張りの量で判定。
 *   Android は先頭より上へ引っ張れないので上端だけ）
 *
 * 押せる面ではないので影は持たず、web のモーダルの太枠も持たない（画面の
 * 下端から生える面なので、枠で区切るより地の暗さで浮かせる）。
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  closeLabel,
  height,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(0));
  // 引き下げて閉じた後、次に開いたときは元の位置から出す
  useEffect(() => {
    if (isOpen) translateY.setValue(0);
  }, [isOpen, translateY]);

  // 引いている間は描画し直さない（位置は Animated の値だけで動かす）ので、
  // 掴んでいる途中で作り直されることはない
  const dragHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => translateY.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_e, g) => {
          if (g.dy > DRAG_CLOSE_DISTANCE || g.vy > DRAG_CLOSE_VELOCITY) {
            onClose();
            return;
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start(),
      }).panHandlers,
    [translateY, onClose],
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        />
        <Animated.View
          style={[
            styles.sheet,
            height === undefined ? styles.sheetAuto : { height },
            { paddingBottom: Math.max(insets.bottom, 16) },
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.dragArea} {...dragHandlers}>
            <View style={styles.grabber} />
            {title !== undefined && <Text style={styles.title}>{title}</Text>}
          </View>
          <View style={height === undefined ? styles.content : styles.fill}>
            <SheetCloseContext.Provider value={onClose}>
              {children}
            </SheetCloseContext.Provider>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * シートの中のスクロール枠に付ける「先頭から引き下げて閉じる」
 *
 * 返り値をスクロール枠の `onScrollEndDrag` に渡す。シートの外では
 * `undefined`（何もしない）。
 */
export function useSheetPullToClose():
  ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | undefined {
  const close = useContext(SheetCloseContext);
  return useMemo(
    () =>
      close === undefined
        ? undefined
        : (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (event.nativeEvent.contentOffset.y < -PULL_CLOSE_DISTANCE) {
              close();
            }
          },
    [close],
  );
}

/**
 * シートの中身のスクロール枠（{@link useSheetPullToClose} を付けた `ScrollView`）
 *
 * 先頭から更に引き下げるとシートを閉じる。シートの外では素の `ScrollView`。
 */
export function SheetScrollView(props: ScrollViewProps) {
  const onPullToClose = useSheetPullToClose();
  return <ScrollView {...props} onScrollEndDrag={onPullToClose} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  sheetAuto: {
    maxHeight: "85%",
  },
  content: {
    flexShrink: 1,
  },
  // 取っ手と見出しをまとめて掴める帯。取っ手だけでは指で掴むには細い
  dragArea: {
    gap: 12,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface300,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  fill: {
    flex: 1,
  },
});
