import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
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
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "../lib/theme";

/** 上端を引き下げて閉じる距離（px） */
const DRAG_CLOSE_DISTANCE = 96;
/** 上端を払って閉じる速さ（px/ms）。距離が足りなくても素早く払えば閉じる */
const DRAG_CLOSE_VELOCITY = 0.8;
/** 中身を先頭からさらに引き下げて閉じる量（iOS の引っ張りの量、px） */
const PULL_CLOSE_DISTANCE = 72;
/** 開くときのせり上がりの長さ（ms） */
const OPEN_DURATION = 320;
/** 閉じるときの下がる長さ（ms）。指を離した位置から続けて下がる */
const CLOSE_DURATION = 240;

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
 * 枠も影も持たない（画面の下端から生える面なので、枠や影で区切るより
 * 地の暗さで浮かせる。iOS の標準のシートと同じ）。幕はその場で濃くなり、
 * シートだけが下から上がる。幕の濃さはシートの位置から引くので、引き下げて
 * いる間は引いた量だけ薄くなり、離して閉じるときはその位置から続けて下がる。
 *
 * OS 標準のシート（iOS の `UISheetPresentationController`、expo-router の
 * `presentation: "formSheet"`）は使わない。画面（ルート）として開く仕組みで、
 * 選択欄のようにその場で開いて値を返す使い方に合わず、Android には同じ部品が
 * 無い（react-native-screens が寄せて再現したものになる）。標準のシートが持つ
 * 動きのうち、ここに無いのは「中身のスクロールが先頭に戻ったら同じ指で
 * シートを下げる」受け渡し・段階の高さ（半分 / 全画面）・キーボードの回避。
 * どれかが要る中身を載せるときは、この API のまま中を `@gorhom/bottom-sheet`
 * （reanimated と gesture-handler が要る）に替える。自前で書き足さない。
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
  const { height: windowHeight } = useWindowDimensions();
  // シートが下端から上がっている量の逆（0 = 開ききった、シートの高さ = 隠れた）。
  // 位置も幕の濃さもこの 1 つの値から引くので、指で引いた量に幕が追随する
  const [offset] = useState(() => new Animated.Value(windowHeight));
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetHeightRef = useRef(0);
  // 開いた直後はシートの高さが未計測なので、最初の計測を待ってからせり上げる
  const pendingOpenRef = useRef(false);

  // 閉じるアニメーションが終わるまで Modal を出したままにする（isOpen が
  // false になった瞬間に外すと、シートも幕も下がる間もなく消える）
  const [isMounted, setIsMounted] = useState(isOpen);
  if (isOpen && !isMounted) setIsMounted(true);

  useEffect(() => {
    if (isOpen) {
      if (sheetHeightRef.current === 0) {
        pendingOpenRef.current = true;
        offset.setValue(windowHeight);
        return;
      }
      // 閉じる途中で開き直したときは、その位置から上げ直す
      Animated.timing(offset, {
        toValue: 0,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    pendingOpenRef.current = false;
    Animated.timing(offset, {
      toValue: sheetHeightRef.current || windowHeight,
      duration: CLOSE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // 開き直されて止まったときは出したままにする
      if (!finished) return;
      sheetHeightRef.current = 0;
      setIsMounted(false);
    });
  }, [isOpen, offset, windowHeight]);

  const backdropOpacity = useMemo(
    () =>
      offset.interpolate({
        inputRange: [0, Math.max(sheetHeight, 1)],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [offset, sheetHeight],
  );

  // 引いている間は描画し直さない（位置は Animated の値だけで動かす）ので、
  // 掴んでいる途中で作り直されることはない
  const dragHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => offset.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_e, g) => {
          if (g.dy > DRAG_CLOSE_DISTANCE || g.vy > DRAG_CLOSE_VELOCITY) {
            onClose();
            return;
          }
          Animated.spring(offset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(offset, {
            toValue: 0,
            useNativeDriver: true,
          }).start(),
      }).panHandlers,
    [offset, onClose],
  );

  // Modal 自身のアニメーション（slide）は使わない。中身全体を 1 枚として
  // 動かすため、幕までシートと一緒に下から上がってくる。幕はその場で
  // 濃くなり、シートだけが下から上がるのが iOS / Android 共通のシートの動き
  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          />
        </Animated.View>
        <Animated.View
          onLayout={(event) => {
            const measured = event.nativeEvent.layout.height;
            sheetHeightRef.current = measured;
            setSheetHeight(measured);
            if (!pendingOpenRef.current) return;
            pendingOpenRef.current = false;
            offset.setValue(measured);
            Animated.timing(offset, {
              toValue: 0,
              duration: OPEN_DURATION,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          }}
          style={[
            styles.sheet,
            height === undefined ? styles.sheetAuto : { height },
            { paddingBottom: Math.max(insets.bottom, 16) },
            { transform: [{ translateY: offset }] },
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
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
