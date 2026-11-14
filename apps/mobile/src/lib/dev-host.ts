/**
 * 開発中に Metro を動かしているホスト（`host:port`）を決める
 * 開発ホスト解決
 *
 * 手元の Supabase と web の接続先（`resolveSupabaseConfig`・`resolveSiteUrl`）は、
 * このホストのアドレスにポートだけ差し替えて組む。
 *
 * 1. Expo の CLI が渡す `hostUri`（`Constants.expoConfig.hostUri`）があればそれ
 * 2. 無ければ、読み込んだバンドルの URL（`scriptUrl`）のホスト
 * 3. どちらも無ければ undefined（呼ぶ側が localhost に倒す）
 *
 * 2 が要るのは、`hostUri` が Metro の返すマニフェストにしか無いため。マニフェストを
 * 読むのは Expo Go と開発クライアント（expo-dev-client）で、このアプリの開発ビルド
 * （`expo run:android` / `expo run:ios`。開発クライアントを入れていない）はビルドに
 * 埋め込んだ設定（`app.config`）を読み、そこに `hostUri` は無い。2 が無いと接続先が
 * localhost に倒れ、Android のエミュレーターと実機では端末自身を指してログインも
 * アプリ向け API も届かない（iOS のシミュレーターは localhost が Mac を指すので
 * 気付かない）。バンドルの URL は React Native が Metro から読んだときの URL で、
 * Android のエミュレーターでは Mac を指す `10.0.2.2` になる。
 *
 * ストアのビルドのバンドルは端末の中のファイルで、URL が http で始まらないので
 * undefined になる（呼ぶ側もストアのビルドではこの値を読まない）。
 *
 * @param hostUri - `Constants.expoConfig.hostUri`（例: `192.168.4.22:8081`）
 * @param scriptUrl - 読み込んだバンドルの URL（例: `http://10.0.2.2:8081/index.bundle?platform=android`）
 */
export function resolveDevHostUri({
  hostUri,
  scriptUrl,
}: {
  readonly hostUri: string | undefined;
  readonly scriptUrl: string | undefined;
}): string | undefined {
  if (hostUri) return hostUri;
  const match = scriptUrl?.match(/^https?:\/\/([^/?#]+)/);
  return match?.[1];
}
