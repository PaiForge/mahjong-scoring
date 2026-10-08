import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/** supabase-js がセッションを読み書きする保存先の形 */
interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * ログイン状態（Supabase のセッション）の保存先
 * セッション保存先
 *
 * @design 端末のキーチェーン（SecureStore）に直接置く
 *
 * セッションにはリフレッシュトークンが入る。AsyncStorage は暗号化されない
 * ので、OS が守る保存先に置く。かつて iOS の一部の版で約 2KB を超える値が
 * 拒まれたため、鍵だけをキーチェーンに置いて本体を暗号化して AsyncStorage に
 * 置く方式が広まったが、Expo の SecureStore は今は上限を設けていない。
 * 鍵と本体を分けると、片方だけ消えた（バックアップから戻した）ときの扱いや
 * 改ざんの検出まで抱えるので、まず直接置く。最初のリリースは iOS だけで、
 * 実機で入りきらないと分かったら分割に切り替える。
 *
 * 読み出しは端末の初回ロック解除後なら背景でも許す
 * （`AFTER_FIRST_UNLOCK`）。アプリが背景から戻った直後のトークン更新で
 * 読めないと、ログアウトしたように見えるため。
 *
 * Expo の web 版（画面確認用）に SecureStore は無いので AsyncStorage を使う。
 */
export const sessionStorage: SessionStorage =
  Platform.OS === "web"
    ? AsyncStorage
    : {
        getItem: (key) => SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS),
        setItem: (key, value) =>
          SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS),
        removeItem: (key) =>
          SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS),
      };

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};
