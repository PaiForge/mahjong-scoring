import Image from "next/image";

/**
 * ユーザーアバター表示。画像があれば丸画像、無ければ頭文字のフォールバックを表示する。
 * マイページのカードや公開プロフィールで共通利用する。
 * ユーザーアバター
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
  bordered = true,
}: {
  readonly avatarUrl: string | null;
  /** 表示名（フォールバックの頭文字・alt に使用） */
  readonly name: string;
  readonly size?: AvatarSize;
  /**
   * ブランド UI の太枠を描くか。既定は描く。
   * ヘッダーのように 32px で出す場所では太枠が画像の面積をそのまま削り、
   * 誰の顔かが分からなくなるため false にする。
   */
  readonly bordered?: boolean;
}) {
  const { px, box, text } = SIZE_CONFIG[size];
  const border = bordered ? "border-3 border-ink" : "";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={px}
        height={px}
        className={`${box} ${border} flex-shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${box} ${border} flex flex-shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-500`}
      aria-hidden="true"
    >
      <span className={`${text} font-bold`}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
