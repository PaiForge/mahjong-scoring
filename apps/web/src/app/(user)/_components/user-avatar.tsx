import Image from "next/image";

/**
 * ユーザーアバター表示。画像があれば丸画像、無ければ頭文字のフォールバックを表示する。
 * マイページのカードや公開プロフィールで共通利用する。
 * ユーザーアバター
 *
 * @remarks
 * ブランド UI の太枠（`border-3 border-ink`）は付けない。ink は苔色の緑で、
 * 丸く回り込むと顔写真の縁を削ったうえに色まで被せてしまい、誰の顔かが
 * 分かりにくくなる。輪郭は画像自身の円で足りる。
 */

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CONFIG: Record<
  AvatarSize,
  { px: number; box: string; text: string }
> = {
  sm: { px: 32, box: "h-8 w-8", text: "text-sm" },
  md: { px: 48, box: "h-12 w-12", text: "text-lg" },
  lg: { px: 80, box: "h-20 w-20", text: "text-2xl" },
};

export function UserAvatar({
  avatarUrl,
  name,
  size = "md",
}: {
  readonly avatarUrl: string | null;
  /** 表示名（フォールバックの頭文字・alt に使用） */
  readonly name: string;
  readonly size?: AvatarSize;
}) {
  const { px, box, text } = SIZE_CONFIG[size];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={px}
        height={px}
        className={`${box} flex-shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${box} flex flex-shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-500`}
      aria-hidden="true"
    >
      <span className={`${text} font-bold`}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
