import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { launchImageLibraryAsync } from "expo-image-picker";

/**
 * 上げる前に縮める一辺の長さ（px）
 *
 * サーバーは 256px に正規化するので、それより大きければ足りる。写真を
 * そのまま送るとサーバーの上限（5MB）を超えうる（iPhone の写真は数十 MP）。
 */
const UPLOAD_EDGE = 512;

/** JPEG の画質。サーバーが WebP に作り直すので、ここは送る大きさだけを見る */
const UPLOAD_JPEG_QUALITY = 0.85;

/**
 * 写真ライブラリからアバターにする画像を選び、送れる形の JPEG にする
 * アバター画像の選択
 *
 * 選ぶ画面で正方形に切り抜かせ（iOS の標準の切り抜き）、一辺
 * {@link UPLOAD_EDGE}px の JPEG に作り直す。HEIC 等で選んでもここで JPEG に
 * なるので、サーバーが受け付ける形式（JPEG / PNG / WebP）から外れない。
 *
 * @returns 作った JPEG のファイルの URI。選ぶのをやめたら `canceled`、
 *   読めない画像なら `failed`
 */
export async function pickAvatarImage(): Promise<
  { readonly uri: string } | "canceled" | "failed"
> {
  try {
    const picked = await launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    const asset = picked.canceled ? undefined : picked.assets[0];
    if (asset === undefined) return "canceled";
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize(
      asset.width >= asset.height
        ? { height: Math.min(UPLOAD_EDGE, asset.height) }
        : { width: Math.min(UPLOAD_EDGE, asset.width) },
    );
    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: UPLOAD_JPEG_QUALITY,
    });
    return { uri: saved.uri };
  } catch {
    return "failed";
  }
}
